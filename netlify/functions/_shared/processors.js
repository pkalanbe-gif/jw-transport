// Core processors — generate invoices and pay-stubs for a single user
// and send them by email. Used by both scheduled and manual-trigger functions.
const calc = require('./calc');
const { sendEmail } = require('./email');
const {
  renderInvoiceHTML, renderPayslipHTML, renderNotificationHTML,
  renderInvoiceEmailBody, renderPayslipEmailBody
} = require('./render');
const { generateInvoicePDF, generatePayslipPDF } = require('./pdf');
const { saveUserData } = require('./firestore');

/**
 * Send a recap email to the company inbox (settings.entreprise.courriel)
 * after an automation run. Best-effort — failures are logged, not thrown.
 */
async function sendAutomationNotification({ ent, kind, label, results, triggeredBy }) {
  if (!ent || !ent.courriel) return { skipped: 'no-company-email' };
  // results may be a single object (invoices) or an array (payslips)
  const arr = Array.isArray(results) ? results : [results];
  if (!arr.length) return { skipped: 'no-results' };

  const when = new Date().toLocaleString('fr-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const html = renderNotificationHTML({ kind, label, results: arr, ent, when, triggeredBy });
  const sentCount = arr.filter(r => r.status === 'sent').length;
  const failedCount = arr.filter(r => /fail|error/.test(r.status || '')).length;
  const isDryRun = arr.length > 0 && arr.every(r => r.status === 'dry-run');
  const kindLabel = kind === 'invoices' ? 'Fakti' : kind === 'payslips' ? 'Talon Paie' : 'Otomatizasyon';
  const subjectPrefix = failedCount > 0 ? '⚠️' : isDryRun ? '🧪' : '✅';
  const subjectSuffix = isDryRun
    ? `${arr.length} liy nan tès`
    : `${sentCount} voye${failedCount > 0 ? `, ${failedCount} erè` : ''}`;

  try {
    const r = await sendEmail({
      to: ent.courriel,
      subject: `${subjectPrefix} ${kindLabel} otomatizasyon — ${subjectSuffix}`,
      html,
      fromName: ent.nom || 'J&W Transport',
      replyTo: ent.courriel
    });
    return { sent: true, messageId: r.messageId };
  } catch (e) {
    console.error('[notification] failed:', e);
    return { sent: false, error: e.message || String(e) };
  }
}

// Sanitize a string for use in a filename (no spaces, slashes, accents-safe).
function safeFilename(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Generate weekly invoice(s) for a user and email each client.
 * One invoice per client that has voyages in the previous Mon-Fri week.
 *
 * @param {string} username
 * @param {object} data — full user_data document from Firestore
 * @param {object} opts — { dryRun?: bool, skipSave?: bool, today?: Date }
 */
async function processInvoicesForUser(username, data, opts = {}) {
  const dryRun = !!opts.dryRun;
  const today = opts.today || new Date();

  const settings = data.settings || {};
  const ent = settings.entreprise || {};
  const tare = settings.tare || calc.DEF_TARE;
  const range = calc.gPrevWeekRange(today);

  const clients = data.clients || [];
  if (!clients.length) {
    return { username, kind: 'invoices', status: 'skipped', reason: 'no-clients', period: range.label };
  }

  // For now: all weekly voyages bill to the primary (first) client.
  // The data model doesn't tag voyages per-client, so we use the first client.
  const client = clients[0];
  if (!client.courriel) {
    return { username, kind: 'invoices', status: 'skipped', reason: 'client-no-email', client: client.nom, period: range.label };
  }

  const weekData = calc.aggregateWeekByZone(data.voyages || [], range.mondayStr, range.fridayStr, tare);
  weekData.label = range.label;

  if (!weekData.weekVoys.length) {
    return { username, kind: 'invoices', status: 'skipped', reason: 'no-voyages', period: range.label };
  }

  const existingCount = (data.factures || []).length;
  const invoice = calc.buildInvoice(weekData, client, ent, settings, existingCount);
  if (!invoice) {
    return { username, kind: 'invoices', status: 'skipped', reason: 'no-billable-zones', period: range.label };
  }

  // Friendly short body — full invoice details live in the attached PDF.
  const html = renderInvoiceEmailBody(invoice, client, ent);

  if (dryRun) {
    return {
      username, kind: 'invoices', status: 'dry-run',
      period: range.label, client: client.nom, clientEmail: client.courriel,
      invoiceNumero: invoice.numero, invoiceTotal: invoice.total,
      pdfAttached: true
    };
  }

  // Persist invoice first so we don't lose record even if email fails.
  if (!opts.skipSave) {
    data.factures = [...(data.factures || []), invoice];
    await saveUserData(username, data);
  }

  // Generate PDF attachment.
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateInvoicePDF(invoice, client, ent, settings);
  } catch (e) {
    console.error('[processors] invoice PDF generation failed:', e);
  }
  const pdfFilename = `Facture-${safeFilename(invoice.numero)}.pdf`;

  let emailResult = null;
  let emailError = null;
  try {
    emailResult = await sendEmail({
      to: client.courriel,
      subject: `Facture ${invoice.numero} - ${ent.nom || 'J&W Transport'}`,
      html,
      fromName: ent.nom || 'J&W Transport',
      replyTo: ent.courriel || undefined,
      attachments: pdfBuffer ? [{
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : undefined
    });
  } catch (e) {
    emailError = e.message || String(e);
  }

  return {
    username, kind: 'invoices',
    status: emailError ? 'saved-but-email-failed' : 'sent',
    period: range.label, client: client.nom, clientEmail: client.courriel,
    invoiceNumero: invoice.numero, invoiceTotal: invoice.total,
    pdfAttached: !!pdfBuffer,
    messageId: emailResult ? emailResult.messageId : null,
    error: emailError
  };
}

/**
 * Compute per-employee pay for the previous week and email each one
 * their pay-stub.
 *
 * @param {string} username
 * @param {object} data
 * @param {object} opts
 */
async function processPayslipsForUser(username, data, opts = {}) {
  const dryRun = !!opts.dryRun;
  const today = opts.today || new Date();
  // respectCycle: when true (used by the scheduled cron), biweekly off-week
  // Thursdays are skipped so we only send on the Thursday before each pay date.
  const respectCycle = !!opts.respectCycle;

  const settings = data.settings || {};
  const ent = settings.entreprise || {};

  const employees = data.chauffeurs || [];
  if (!employees.length) {
    return [{ username, kind: 'payslips', status: 'skipped', reason: 'no-employees' }];
  }

  // Pay frequency can differ per employee (e.g. the driver moved to biweekly
  // while the helper stayed weekly), so each one gets their own period and
  // their own on/off-week decision.
  const empSettings = (emp) => {
    const ps = settings.payrollSchedule || {};
    return emp.payFreq
      ? { ...settings, payrollSchedule: { ...ps, frequency: emp.payFreq } }
      : settings;
  };

  const results = [];
  for (const empRaw of employees.filter(c => c.aktif)) {
    const st = empSettings(empRaw);
    const range = calc.getCurrentPayPeriod(today, st);

    // For a biweekly schedule, only the Thursday before pay-day is a "send"
    // Thursday — skip the off-week if asked to respect the cycle.
    if (respectCycle && range.isBiweekly && range.daysToPay != null && range.daysToPay > 5) {
      results.push({
        username, kind: 'payslips', status: 'skipped', reason: 'biweekly-off-week',
        employee: empRaw.nom, period: range.label, payDate: range.payDateLabel, daysToPay: range.daysToPay
      });
      continue;
    }

    const emp = calc.calcEmployeePay([empRaw], data.voyages || [], range.mondayStr, range.fridayStr, st)[0];
    if (!emp) continue;
    const payDateStr = range.payDateLabel;

    if (!emp.courriel) {
      results.push({ username, kind: 'payslips', status: 'skipped', reason: 'no-employee-email', employee: emp.nom });
      continue;
    }
    if (emp.totalVoy === 0 && emp.bonus === 0) {
      results.push({ username, kind: 'payslips', status: 'skipped', reason: 'no-work', employee: emp.nom, period: range.label });
      continue;
    }
    // Friendly short body — full pay-stub details live in the attached PDF.
    const html = renderPayslipEmailBody(emp, range.label, payDateStr, ent);

    if (dryRun) {
      results.push({
        username, kind: 'payslips', status: 'dry-run',
        employee: emp.nom, employeeEmail: emp.courriel,
        period: range.label, payDate: range.payDateLabel, totalVoy: emp.totalVoy, brut: emp.brut, bonus: emp.bonus,
        pdfAttached: true
      });
      continue;
    }

    // Generate PDF for this employee.
    let pdfBuffer = null;
    try {
      pdfBuffer = await generatePayslipPDF(emp, range.label, ent, payDateStr, { isBiweekly: range.isBiweekly });
    } catch (e) {
      console.error('[processors] payslip PDF generation failed for', emp.nom, ':', e);
    }
    const pdfFilename = `Talon-paie-${safeFilename(emp.nom)}-${safeFilename(range.payDateStr || '')}.pdf`;

    try {
      const r = await sendEmail({
        to: emp.courriel,
        subject: `Talon de paie - ${ent.nom || 'J&W Transport'}`,
        html,
        fromName: ent.nom || 'J&W Transport',
        replyTo: ent.courriel || undefined,
        attachments: pdfBuffer ? [{
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }] : undefined
      });
      results.push({
        username, kind: 'payslips', status: 'sent',
        employee: emp.nom, employeeEmail: emp.courriel,
        period: range.label, payDate: range.payDateLabel, totalVoy: emp.totalVoy, brut: emp.brut, bonus: emp.bonus,
        pdfAttached: !!pdfBuffer,
        messageId: r.messageId
      });
    } catch (e) {
      results.push({
        username, kind: 'payslips', status: 'email-failed',
        employee: emp.nom, employeeEmail: emp.courriel,
        period: range.label, error: e.message || String(e)
      });
    }
  }

  return results;
}

module.exports = { processInvoicesForUser, processPayslipsForUser, sendAutomationNotification };
