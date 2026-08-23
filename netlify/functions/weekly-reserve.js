// Scheduled: Thursdays, after the pay-stubs go out.
// The exact schedule is set in netlify.toml under [functions."weekly-reserve"].
//
// What it does:
// Reminds the owner to move money aside for the business. The week it reports
// on is the one being paid out that Friday — the current weekly pay period —
// so the reminder lands while the money is actually moving.
//
// The base is what is left once the money that is not the owner's has gone out:
// TPS/TVQ collected belongs to Revenu Québec, and the employees have to be paid,
// so both are removed before taking the percentage (settings.tauxReserve,
// default 10%).
//
// Required env vars: FIREBASE_KEY, EMAIL_USER, EMAIL_PASS

const calc = require('./_shared/calc');
const { listAllUserData, logAutomationRun } = require('./_shared/firestore');
const { sendEmail } = require('./_shared/email');

const money = (n) => calc.fM(Math.round((n || 0) * 100) / 100);

function buildReminder(data, today) {
  const settings = data.settings || {};
  const tare = settings.tare || calc.DEF_TARE;
  const rate = (parseFloat(settings.tauxReserve) || 10) / 100;

  // Weekly period regardless of the employees' own frequencies: this is about
  // the week's takings, not about anyone's pay cycle.
  const st = { ...settings, payrollSchedule: { ...(settings.payrollSchedule || {}), frequency: 'weekly' } };
  const range = calc.getCurrentPayPeriod(today, st);

  const wk = calc.aggregateWeekByZone(data.voyages || [], range.mondayStr, range.fridayStr, tare);
  let ht = 0;
  Object.values(wk.zones).forEach(z => { ht += z.totalKg * z.rate; });
  ht += wk.totalBonus || 0;
  ht = Math.round(ht * 100) / 100;

  const tps = Math.round(ht * calc.TPS_R * 100) / 100;
  const tvq = Math.round(ht * calc.TVQ_R * 100) / 100;
  const ttc = Math.round((ht + tps + tvq) * 100) / 100;

  const pay = calc.calcEmployeePay(data.chauffeurs || [], data.voyages || [], range.mondayStr, range.fridayStr, settings);
  const salaires = Math.round(pay.reduce((s, e) => s + (e.brut || 0), 0) * 100) / 100;
  // Nothing to set aside on a week that did not cover its own payroll.
  const reste = Math.max(0, Math.round((ht - salaires) * 100) / 100);
  const reserve = Math.round(reste * rate * 100) / 100;

  // Context only — these are not taken off the base.
  const inRange = (d) => d && d >= range.mondayStr && d <= range.fridayStr;
  const depenses = Math.round((data.depenses || []).filter(x => inRange(x.date)).reduce((s, x) => s + (x.montant || 0), 0) * 100) / 100;
  const entretiens = Math.round((data.entretiens || []).filter(x => inRange(x.date)).reduce((s, x) => s + (x.cout || 0), 0) * 100) / 100;

  return { range, ht, tps, tvq, ttc, reste, reserve, rate, salaires, depenses, entretiens, nbVoyages: (wk.weekVoys || []).length };
}

function renderHTML(r, ent) {
  const pct = Math.round(r.rate * 100);
  const row = (label, value, color) =>
    `<tr><td style="padding:7px 0;color:#475569;font-size:14px">${label}</td>
      <td style="padding:7px 0;text-align:right;font-weight:700;font-size:14px;color:${color || '#1a1a1a'}">${value}</td></tr>`;
  return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
    <h2 style="margin:0 0 4px;font-size:20px">💰 Mete lajan sou kote</h2>
    <p style="margin:0 0 18px;color:#64748b;font-size:13px">Semèn ${r.range.label}</p>

    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:18px;text-align:center;margin-bottom:18px">
      <div style="font-size:12px;color:#047857;font-weight:700;letter-spacing:.5px">À METTRE DE CÔTÉ POUR L'ENTREPRISE (${pct}%)</div>
      <div style="font-size:30px;font-weight:800;color:#047857;margin-top:6px">${money(r.reserve)}</div>
    </div>

    <table style="width:100%;border-collapse:collapse">
      ${row('Revenu facturé TTC', money(r.ttc))}
      ${row(`− TPS (5%) + TVQ (9,975%)`, '− ' + money(r.tps + r.tvq), '#dc2626')}
      ${row('− Salaires employés', '− ' + money(r.salaires), '#dc2626')}
      <tr><td colspan="2" style="border-top:1px solid #e2e8f0"></td></tr>
      ${row('Reste après taxes et salaires', money(r.reste))}
      ${row(`× ${pct}% pour l'entreprise`, money(r.reserve), '#047857')}
    </table>

    <p style="margin:18px 0 6px;font-size:12px;color:#64748b;font-weight:700">Pour information — autres sorties de la semaine</p>
    <table style="width:100%;border-collapse:collapse">
      ${row('Dépenses', money(r.depenses))}
      ${row('Entretiens', money(r.entretiens))}
    </table>

    <p style="margin-top:20px;font-size:12px;color:#94a3b8;line-height:1.6">
      Le ${pct}% est calculé sur ce qui reste une fois la TPS/TVQ (due à Revenu Québec)
      et les salaires des employés sortis. Les dépenses et entretiens ci-dessus ne sont
      pas retirés du calcul.<br/>
      ${ent.nom || 'J&W Transport'}
    </p>
  </div>`;
}

// Exported so the reminder can be built and previewed without sending mail.
exports.buildReminder = buildReminder;
exports.renderHTML = renderHTML;

exports.handler = async () => {
  const startedAt = new Date().toISOString();
  const today = new Date();
  console.log(`[weekly-reserve] starting at ${startedAt}`);

  let users;
  try {
    users = await listAllUserData();
  } catch (e) {
    console.error('[weekly-reserve] failed to list users:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }

  const results = [];
  for (const u of users) {
    const ent = (u.data && u.data.settings && u.data.settings.entreprise) || {};
    try {
      if (!ent.courriel) {
        results.push({ username: u.username, kind: 'reserve', status: 'skipped', reason: 'no-company-email' });
        continue;
      }
      const r = buildReminder(u.data, today);
      if (r.ht <= 0) {
        results.push({ username: u.username, kind: 'reserve', status: 'skipped', reason: 'no-revenue', period: r.range.label });
        continue;
      }
      const res = await sendEmail({
        to: ent.courriel,
        subject: `💰 Mete ${money(r.reserve)} sou kote — semèn ${r.range.label}`,
        html: renderHTML(r, ent),
        fromName: ent.nom || 'J&W Transport'
      });
      results.push({
        username: u.username, kind: 'reserve', status: 'sent', period: r.range.label,
        ht: r.ht, taxes: Math.round((r.tps + r.tvq) * 100) / 100, reserve: r.reserve,
        messageId: res.messageId
      });
      console.log(`[weekly-reserve] ${u.username}: sent ${r.reserve} for ${r.range.label}`);
    } catch (e) {
      console.error(`[weekly-reserve] ${u.username} failed:`, e);
      results.push({ username: u.username, kind: 'reserve', status: 'error', error: e.message || String(e) });
    }
  }

  try { await logAutomationRun('weekly-reserve', results); } catch (e) { /* best effort */ }

  return {
    statusCode: 200,
    body: JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), count: results.length, results })
  };
};
