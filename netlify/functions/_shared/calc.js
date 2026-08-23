// Shared calculation logic — mirrored from src/App.js so scheduled functions
// can compute invoices/paystubs server-side without depending on the React app.

const TPS_R = 0.05;
const TVQ_R = 0.09975;
const RM = 0.09; // Montréal rate ($/kg)
const RL = 0.07; // Laval rate ($/kg)
const ZR = { "06": RM, "13": RL };
const ZN = { "06": "Montréal", "13": "Laval" };
const DEF_TARE = 4560;

const fN = n => new Intl.NumberFormat('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(n || 0));
const fM = n => fN(n) + " $ CAD";

function sumBonuses(t) {
  if (t.bonuses && typeof t.bonuses === 'object') {
    return Object.values(t.bonuses).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  }
  return parseFloat(t.bonus) || 0;
}

function empBonus(t, empId) {
  if (t.bonuses && typeof t.bonuses === 'object') {
    return parseFloat(t.bonuses[empId]) || 0;
  }
  return parseFloat(t.bonus) || 0;
}

function cTrip(t, tare = DEF_TARE) {
  const usedTare = t.tare || tare;
  const pN = Math.max(0, (t.poidsChaj || 0) - usedTare);
  const r = ZR[t.zone] || 0;
  const bonus = sumBonuses(t);
  const rv = pN * r * (t.nbVoyages || 1) + bonus;
  return { pN, rv: Math.round(rv * 100) / 100, bonus };
}

const toL = d => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const fD = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// Monday of the week containing date d (ISO week, Mon..Sun).
const gMon = (d = new Date()) => {
  const dt = new Date(d);
  const dy = dt.getDay();
  dt.setDate(dt.getDate() - dy + (dy === 0 ? -6 : 1));
  return toL(dt);
};

// Pay date for a given work week's Monday, using payrollSchedule.
// Mirrors the same function in src/App.js.
function getPayDate(weekMonStr, settings) {
  const ps = (settings && settings.payrollSchedule) || { frequency: 'weekly', payDelay: 2, payDay: 5 };
  const fri = new Date(weekMonStr + 'T12:00:00');
  fri.setDate(fri.getDate() + 4);
  const pd = new Date(fri);
  pd.setDate(pd.getDate() + ps.payDelay * 7);
  const cur = pd.getDay();
  const tgt = ps.payDay === 7 ? 0 : ps.payDay;
  pd.setDate(pd.getDate() + (tgt - cur));
  return toL(pd);
}

// Find the upcoming pay period — the work week(s) whose pay date is the next
// upcoming pay date relative to `today`. Honours `payrollSchedule.frequency`
// (weekly = 1 work week per period, biweekly = 2-week cadence).
//
// Returns: { mondayStr, fridayStr, payDateStr, payDateLabel, label,
//            isBiweekly, daysToPay, periodWeeks }
function getCurrentPayPeriod(today, settings) {
  const ps = (settings && settings.payrollSchedule) || { frequency: 'weekly', payDelay: 2, payDay: 5 };
  const isBiweekly = ps.frequency === 'biweekly';
  const step = isBiweekly ? 14 : 7;
  const periodWeeks = isBiweekly ? 2 : 1;

  const t = today instanceof Date ? new Date(today) : new Date();
  const todayStr = toL(t);
  // Periods are keyed by their LAST week. For a biweekly cycle the fortnight
  // parity must come from ps.ancre (the first Monday of a period) — anchoring on
  // the current week makes the grid drift 7 days every week, so daysToPay is
  // always 8 and the paystub cron skips every Thursday as an "off-week".
  // Keep in sync with payGridMon() in src/App.js.
  let baseMon = gMon(t);
  if (isBiweekly) {
    const last = new Date(gMon(new Date((ps.ancre || '1970-01-05') + 'T12:00:00')) + 'T12:00:00');
    last.setDate(last.getDate() + 7);
    const k = Math.floor(
      Math.round((new Date(baseMon + 'T12:00:00') - last) / 86400000) / 14
    );
    last.setDate(last.getDate() + k * 14);
    baseMon = toL(last);
  }
  const anchor = new Date(baseMon + 'T12:00:00');
  anchor.setDate(anchor.getDate() - 12 * 7);

  let cur = new Date(anchor);
  let found = null;
  for (let i = 0; i < 60; i++) {
    const wm = toL(cur);
    const payD = getPayDate(wm, settings);
    if (payD >= todayStr) {
      found = { weekMon: wm, payDate: payD };
      break;
    }
    cur.setDate(cur.getDate() + step);
  }
  if (!found) {
    // fallback: previous Mon-Fri
    const fb = gPrevWeekRange(t);
    return {
      mondayStr: fb.mondayStr,
      fridayStr: fb.fridayStr,
      payDateStr: getPayDate(fb.mondayStr, settings),
      payDateLabel: fD(getPayDate(fb.mondayStr, settings)),
      label: fb.label,
      isBiweekly,
      periodWeeks,
      daysToPay: null
    };
  }

  // First Monday of the period (for biweekly: 1 week before the "found" Monday)
  const firstMon = new Date(found.weekMon + 'T12:00:00');
  if (isBiweekly) firstMon.setDate(firstMon.getDate() - 7);
  // Last Friday of the period = found.weekMon + 4 days
  const lastFri = new Date(found.weekMon + 'T12:00:00');
  lastFri.setDate(lastFri.getDate() + 4);

  const daysToPay = Math.round(
    (new Date(found.payDate + 'T12:00:00') - new Date(todayStr + 'T12:00:00')) / (24 * 3600 * 1000)
  );

  return {
    mondayStr: toL(firstMon),
    fridayStr: toL(lastFri),
    payDateStr: found.payDate,
    payDateLabel: fD(found.payDate),
    label: `${fD(toL(firstMon))} au ${fD(toL(lastFri))}`,
    isBiweekly,
    periodWeeks,
    daysToPay
  };
}

// Get Monday-Friday of the most recently completed week.
// Used by Sunday job: if today is Sunday, the past week is Mon..Fri 6..2 days ago.
// Used by Thursday job: we want the previous Mon..Fri (so payslips for last week are sent
// on Thursday before payday). If today is Thursday, the previous Mon was 10 days ago.
function gPrevWeekRange(today = new Date()) {
  const d = new Date(today);
  const dy = d.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu
  // Find the Monday of the *previous* completed work-week.
  // Sunday → previous Monday is 6 days ago (covers Mon..Fri just ended)
  // Thursday → previous Monday is 10 days ago (covers prior Mon..Fri)
  let backToMonday;
  if (dy === 0) backToMonday = 6;          // Sunday
  else if (dy === 4) backToMonday = 10;    // Thursday
  else if (dy === 1) backToMonday = 7;     // Monday
  else if (dy >= 5) backToMonday = dy - 1; // Fri/Sat → this week's Mon
  else backToMonday = dy + 6;              // Tue/Wed → prior week Mon

  const monday = new Date(d);
  monday.setDate(d.getDate() - backToMonday);
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return {
    mondayStr: toL(monday),
    fridayStr: toL(friday),
    label: `${fD(toL(monday))} au ${fD(toL(friday))}`
  };
}

function aggregateWeekByZone(voyages, mondayStr, fridayStr, tare) {
  const weekVoys = (voyages || []).filter(v => v.date >= mondayStr && v.date <= fridayStr);
  const zones = {};
  Object.keys(ZR).forEach(z => { zones[z] = { name: ZN[z], totalKg: 0, nbFiches: 0, dt: [], rate: ZR[z] }; });
  let totalBonus = 0;
  weekVoys.forEach(v => {
    (v.trips || []).forEach(t => {
      const c = cTrip(t, tare);
      const z = zones[t.zone];
      if (!z) return;
      const w = c.pN * (t.nbVoyages || 1);
      z.totalKg += w;
      z.nbFiches += 1;
      if (t.dt) z.dt.push(t.dt);
      totalBonus += c.bonus;
    });
  });
  return { zones, totalBonus, weekVoys };
}

function buildInvoice(weekData, client, ent, settings, existingFacturesCount) {
  const details = [];
  Object.entries(weekData.zones).forEach(([zone, z]) => {
    if (z.totalKg <= 0) return;
    details.push({
      id: 'auto_d_' + zone + '_' + Date.now(),
      zone,
      description: `Nbre fiches ${z.name}: ${z.nbFiches}`,
      quantite: String(Math.round(z.totalKg)),
      unite: 'kg',
      prixUnitaire: String(z.rate),
      dt: z.dt.join('\n'),
      taxable: true
    });
  });

  // Bonus line — single consolidated line for all bonuses in the week.
  // Client is invoiced for the bonus amount that gets paid out to employees.
  if (weekData.totalBonus && weekData.totalBonus > 0) {
    details.push({
      id: 'auto_bonus_' + Date.now(),
      zone: '',
      description: 'Bonus voyages',
      quantite: '1',
      unite: 'lot',
      prixUnitaire: String(Math.round(weekData.totalBonus * 100) / 100),
      dt: '',
      taxable: true
    });
  }

  if (!details.length) return null;

  let stTax = 0, stNoTax = 0;
  details.forEach(d => {
    const q = parseFloat(d.quantite) || 0;
    const p = parseFloat(d.prixUnitaire) || 0;
    if (d.taxable === false) stNoTax += q * p; else stTax += q * p;
  });
  const sousTotal = Math.round((stTax + stNoTax) * 100) / 100;
  const tps = Math.round(stTax * TPS_R * 100) / 100;
  const tvq = Math.round(stTax * TVQ_R * 100) / 100;
  const total = Math.round((sousTotal + tps + tvq) * 100) / 100;

  const num = `FAC-${(existingFacturesCount + 1).toString().padStart(3, '0')}`;
  return {
    id: 'auto_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    clientId: client.id,
    date: toL(new Date()),
    dateLimite: '',
    periode: weekData.label || '',
    details,
    avecTPS: true,
    avecTVQ: true,
    statut: 'Envoyée',
    numero: num,
    sousTotal,
    tps,
    tvq,
    total,
    autoGenerated: true,
    autoGeneratedAt: new Date().toISOString()
  };
}

// Compute payroll per employee for a week (Mon-Fri).
function calcEmployeePay(employees, voyages, mondayStr, fridayStr, settings) {
  const weekVoys = (voyages || []).filter(v => v.date >= mondayStr && v.date <= fridayStr);
  const st = settings || {};
  return employees.filter(c => c.aktif).map(ch => {
    let totalVoy = 0, brut = 0, bonus = 0;
    const tripDetails = [];
    const defTx = parseFloat(ch.tauxPersonnel) || (ch.role === 'Chauffeur' ? (st.tauxChauffeur || 80) : (st.tauxHelper || 65));
    weekVoys.forEach(v => {
      const isDriver = v.chofè === ch.id;
      const isHelper = (v.helpers || []).includes(ch.id);
      if (!isDriver && !isHelper) return;
      (v.trips || []).forEach(t => {
        const nb = t.nbVoyages || 0;
        const tripTx = isDriver ? (parseFloat(t.tauxChofe) || defTx) : (parseFloat(t.tauxHelper) || defTx);
        const tBon = empBonus(t, ch.id);
        if (nb > 0 || tBon > 0) {
          tripDetails.push({
            date: v.date,
            zone: ZN[t.zone] || t.zone,
            nb,
            tx: tripTx,
            bonus: tBon,
            sub: nb * tripTx + tBon
          });
        }
        totalVoy += nb;
        brut += nb * tripTx + tBon;
        bonus += tBon;
      });
    });
    return {
      ...ch,
      totalVoy,
      tx: defTx,
      brut: Math.round(brut * 100) / 100,
      bonus: Math.round(bonus * 100) / 100,
      tripDetails
    };
  });
}

module.exports = {
  TPS_R, TVQ_R, RM, RL, ZR, ZN, DEF_TARE,
  fN, fM, fD, toL,
  sumBonuses, empBonus, cTrip,
  gMon, gPrevWeekRange, getPayDate, getCurrentPayPeriod,
  aggregateWeekByZone,
  buildInvoice,
  calcEmployeePay
};
