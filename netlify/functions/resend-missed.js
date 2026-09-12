// TEMPORARY: re-sends the documents that were generated while the Gmail app
// password was invalid (6–10 Sept), so nothing has to be regenerated:
//   • the existing invoice FAC-032 (already saved, never delivered)
//   • the 10 Sept pay-stubs for both employees
//   • the 10 Sept reserve reminder to the company inbox
// Nothing is created or renumbered — it only re-delivers. Delete after use.
const calc = require('./_shared/calc');
const { getUserData } = require('./_shared/firestore');
const { sendEmail } = require('./_shared/email');
const { generateInvoicePDF } = require('./_shared/pdf');
const { renderInvoiceEmailBody } = require('./_shared/render');
const { processPayslipsForUser } = require('./_shared/processors');
const reserve = require('./weekly-reserve');

const USER = 'admin';
const INVOICE_NO = 'FAC-032';
const MISSED_DAY = new Date('2026-09-10T21:00:00Z');

exports.handler = async (event) => {
  const only = (event.queryStringParameters || {}).only || 'all';
  const out = [];
  const data = await getUserData(USER);
  if (!data) return { statusCode: 404, body: JSON.stringify({ error: 'no user data' }) };
  const settings = data.settings || {};
  const ent = settings.entreprise || {};

  // 1. The invoice that was saved but never delivered.
  if (only === 'all' || only === 'invoice') {
    const fac = (data.factures || []).find(f => f.numero === INVOICE_NO);
    const client = (data.clients || [])[0] || {};
    if (!fac) out.push({ item: INVOICE_NO, status: 'not-found' });
    else if (!client.courriel) out.push({ item: INVOICE_NO, status: 'no-client-email' });
    else {
      try {
        let pdf = null;
        try { pdf = await generateInvoicePDF(fac, client, ent, settings); }
        catch (e) { console.error('[resend] pdf failed:', e); }
        const r = await sendEmail({
          to: client.courriel,
          subject: `Facture ${fac.numero} - ${ent.nom || 'J&W Transport'}`,
          html: renderInvoiceEmailBody(fac, client, ent),
          fromName: ent.nom || 'J&W Transport',
          replyTo: ent.courriel || undefined,
          attachments: pdf ? [{ filename: `Facture-${fac.numero}.pdf`, content: pdf, contentType: 'application/pdf' }] : undefined
        });
        out.push({ item: fac.numero, status: 'sent', to: client.courriel, total: fac.total, period: fac.periode, pdf: !!pdf, messageId: r.messageId });
      } catch (e) {
        out.push({ item: INVOICE_NO, status: 'failed', error: String(e.message || e).slice(0, 200) });
      }
    }
  }

  // 2. The pay-stubs for the Thursday that failed.
  if (only === 'all' || only === 'payslips') {
    try {
      const rs = await processPayslipsForUser(USER, data, { today: MISSED_DAY, respectCycle: true });
      rs.forEach(r => out.push({ item: 'talon ' + (r.employee || '?'), status: r.status, period: r.period, brut: r.brut, to: r.employeeEmail, error: r.error }));
    } catch (e) {
      out.push({ item: 'talon', status: 'failed', error: String(e.message || e).slice(0, 200) });
    }
  }

  // 3. The reserve reminder to the company inbox.
  if (only === 'all' || only === 'reserve') {
    try {
      const r = reserve.buildReminder(data, MISSED_DAY);
      if (!ent.courriel) out.push({ item: 'rapèl', status: 'no-company-email' });
      else {
        const res = await sendEmail({
          to: ent.courriel,
          subject: `💰 Mete ${calc.fM(r.reserve)} sou kote — semèn ${r.range.label}`,
          html: reserve.renderHTML(r, ent),
          fromName: ent.nom || 'J&W Transport'
        });
        out.push({ item: 'rapèl', status: 'sent', period: r.range.label, reserve: r.reserve, to: ent.courriel, messageId: res.messageId });
      }
    } catch (e) {
      out.push({ item: 'rapèl', status: 'failed', error: String(e.message || e).slice(0, 200) });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ results: out }, null, 1) };
};
