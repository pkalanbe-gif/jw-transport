// Scheduled: daily at 17:00 UTC (12:00 EST / 13:00 EDT winter/summer).
// The exact schedule is set in netlify.toml under [functions."biweekly-location-invoices"].
//
// What it does:
// 1. Loads every user_data document from Firestore.
// 2. For each active rental contract (data.locations), computes the current
//    billing period anchored on the contract start date ("2semaines" = 14 days,
//    "hebdomadaire" = 7 days, "mensuel" = 1 month).
// 3. Creates the invoice for that period in data.locationFactures if missing,
//    then emails it (with PDF) to the renter once — sentAt guards duplicates,
//    so running daily is safe and catches up missed days.
//
// Period math must stay in sync with locPeriod() in src/App.js.
//
// Required env vars: FIREBASE_KEY, EMAIL_USER, EMAIL_PASS

const { listAllUserData, saveUserData, logAutomationRun } = require('./_shared/firestore');
const { sendEmail } = require('./_shared/email');
const { generateInvoicePDF } = require('./_shared/pdf');
const { renderInvoiceEmailBody } = require('./_shared/render');

const TPS_R = 0.05, TVQ_R = 0.09975;
const toL = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fD = s => new Date(s + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });

function currentPeriod(loc, today) {
  if (!loc.debut) return null;
  const d0 = new Date(loc.debut + 'T12:00:00');
  const dn = new Date(toL(today) + 'T12:00:00');
  if (dn < d0) return null;
  if ((loc.frequence || 'mensuel') === 'mensuel') {
    let months = (dn.getFullYear() - d0.getFullYear()) * 12 + (dn.getMonth() - d0.getMonth());
    let ps = new Date(d0); ps.setMonth(d0.getMonth() + months);
    if (ps > dn) { ps = new Date(d0); ps.setMonth(d0.getMonth() + months - 1); }
    const pe = new Date(ps); pe.setMonth(pe.getMonth() + 1); pe.setDate(pe.getDate() - 1);
    return { debut: toL(ps), fin: toL(pe) };
  }
  const step = loc.frequence === 'hebdomadaire' ? 7 : 14;
  const days = Math.floor((dn - d0) / 86400000);
  const n = Math.floor(days / step);
  const ps = new Date(d0); ps.setDate(d0.getDate() + n * step);
  const pe = new Date(ps); pe.setDate(ps.getDate() + step - 1);
  return { debut: toL(ps), fin: toL(pe) };
}

async function processLocationInvoicesForUser(username, data, today) {
  const settings = data.settings || {};
  const ent = settings.entreprise || {};
  const vehicules = data.vehicules || [];
  const locs = (data.locations || []).filter(l => l.statut !== 'Terminé');
  const results = [];
  let changed = false;

  for (const l of locs) {
    const base = { username, kind: 'location-invoices', locataire: l.locataire || '—' };
    // Manual mode is the default: the cron only touches contracts where the
    // user explicitly enabled "Envoi automatique" (l.auto).
    if (!l.auto) { results.push({ ...base, status: 'skipped', reason: 'manual-mode' }); continue; }
    let per = currentPeriod(l, today);
    if (!per) { results.push({ ...base, status: 'skipped', reason: 'not-started-or-no-debut' }); continue; }

    // "Par jour" contracts are billed AFTER the period ends (all days recorded),
    // so target the most recent COMPLETED period instead of the running one.
    if (l.tarif === 'parjour' && toL(today) <= per.fin) {
      const prevEnd = new Date(per.debut + 'T12:00:00');
      prevEnd.setDate(prevEnd.getDate() - 1);
      if (toL(prevEnd) < l.debut) { results.push({ ...base, status: 'skipped', reason: 'period-not-finished' }); continue; }
      per = currentPeriod(l, prevEnd);
      if (!per) { results.push({ ...base, status: 'skipped', reason: 'period-not-finished' }); continue; }
    }
    if (l.fin && per.debut > l.fin) { results.push({ ...base, status: 'skipped', reason: 'contract-ended' }); continue; }

    let facs = data.locationFactures || [];
    let fac = facs.find(f => f.locationId === l.id && f.periodeDebut === per.debut);
    if (!fac) {
      // "Par jour" contracts bill the sum of the day entries recorded in the
      // period (l.jours); fixed contracts bill the flat contract amount.
      const parJour = l.tarif === 'parjour';
      const sumJ = arr => Math.round(arr.reduce((s, j) => s + (parseFloat(j.montant) || 0), 0) * 100) / 100;
      const jours = parJour ? (l.jours || []).filter(j => j.date >= per.debut && j.date <= per.fin) : [];
      if (parJour && !jours.length) {
        results.push({ ...base, status: 'skipped', reason: 'parjour-no-days', period: `${per.debut} au ${per.fin}` });
        continue;
      }
      const montant = parJour ? sumJ(jours) : Math.round((parseFloat(l.montant) || 0) * 100) / 100;
      const avecTaxes = !!l.avecTaxes;
      const tps = avecTaxes ? Math.round(montant * TPS_R * 100) / 100 : 0;
      const tvq = avecTaxes ? Math.round(montant * TVQ_R * 100) / 100 : 0;
      // "Aux 2 semaines" invoices are detailed as Semaine 1 + Semaine 2 —
      // half the fixed amount each, or the actual per-day totals of each week.
      const lignes = [];
      if (l.frequence === '2semaines') {
        const w1e = new Date(per.debut + 'T12:00:00'); w1e.setDate(w1e.getDate() + 6);
        const w1eS = toL(w1e);
        const w2s = new Date(per.debut + 'T12:00:00'); w2s.setDate(w2s.getDate() + 7);
        if (parJour) {
          const j1 = jours.filter(j => j.date <= w1eS);
          const j2 = jours.filter(j => j.date > w1eS);
          lignes.push({ label: `Semaine 1 (${j1.length} jou)`, debut: per.debut, fin: w1eS, montant: sumJ(j1) });
          lignes.push({ label: `Semaine 2 (${j2.length} jou)`, debut: toL(w2s), fin: per.fin, montant: sumJ(j2) });
        } else {
          const m1 = Math.round(montant / 2 * 100) / 100;
          const m2 = Math.round((montant - m1) * 100) / 100;
          lignes.push({ label: 'Semaine 1', debut: per.debut, fin: w1eS, montant: m1 });
          lignes.push({ label: 'Semaine 2', debut: toL(w2s), fin: per.fin, montant: m2 });
        }
      } else {
        lignes.push({ label: (l.frequence === 'hebdomadaire' ? 'Semaine' : 'Mois') + (parJour ? ` (${jours.length} jou)` : ''), debut: per.debut, fin: per.fin, montant });
      }
      fac = {
        id: 'loc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        numero: `LOC-${(facs.length + 1).toString().padStart(3, '0')}`,
        locationId: l.id,
        date: toL(today),
        periodeDebut: per.debut,
        periodeFin: per.fin,
        periode: `${fD(per.debut)} au ${fD(per.fin)}`,
        lignes,
        locataire: l.locataire || '',
        courriel: l.courriel || '',
        vehicule: (vehicules.find(v => v.id === l.vehiculeId) || {}).nom || '',
        montant, avecTaxes,
        sousTotal: montant, tps, tvq,
        total: Math.round((montant + tps + tvq) * 100) / 100,
        statut: 'Nouvelle',
        autoGenerated: true,
        autoGeneratedAt: new Date().toISOString()
      };
      data.locationFactures = [...facs, fac];
      changed = true;
    }

    if (fac.sentAt) { results.push({ ...base, status: 'skipped', reason: 'already-sent', numero: fac.numero, period: fac.periode }); continue; }
    if (!l.courriel) { results.push({ ...base, status: 'skipped', reason: 'no-renter-email', numero: fac.numero, period: fac.periode }); continue; }

    // Shape the record like a standard invoice so PDF/email helpers can render it.
    // One detail line per week (Semaine 1 / Semaine 2 for biweekly contracts).
    const facLignes = (fac.lignes && fac.lignes.length)
      ? fac.lignes
      : [{ label: 'Location', debut: fac.periodeDebut, fin: fac.periodeFin, montant: fac.montant }];
    const invoice = {
      numero: fac.numero, date: fac.date, dateLimite: '', periode: fac.periode,
      details: facLignes.map((li, i) => ({
        id: fac.id + '_' + i, zone: '',
        description: `Location camion ${fac.vehicule} — ${li.label} : ${fD(li.debut)} au ${fD(li.fin)}`,
        quantite: '1', unite: 'lot', prixUnitaire: String(li.montant), dt: '',
        taxable: fac.avecTaxes
      })),
      avecTPS: fac.avecTaxes, avecTVQ: fac.avecTaxes,
      sousTotal: fac.sousTotal, tps: fac.tps, tvq: fac.tvq, total: fac.total,
      statut: 'Envoyée'
    };
    const client = { nom: l.locataire || 'Locataire', adresse: '', ville: '', courriel: l.courriel };

    let pdfBuffer = null;
    try { pdfBuffer = await generateInvoicePDF(invoice, client, ent, settings); }
    catch (e) { console.error('[location-invoices] PDF failed:', e); }

    try {
      const r = await sendEmail({
        to: l.courriel,
        subject: `Facture ${fac.numero} — Location camion ${fac.vehicule} - ${ent.nom || 'J&W Transport'}`,
        html: renderInvoiceEmailBody(invoice, client, ent),
        fromName: ent.nom || 'J&W Transport',
        replyTo: ent.courriel || undefined,
        attachments: pdfBuffer ? [{
          filename: `Facture-${fac.numero}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }] : undefined
      });
      fac.sentAt = new Date().toISOString();
      fac.statut = 'Envoyée';
      changed = true;
      results.push({ ...base, status: 'sent', numero: fac.numero, period: fac.periode, total: fac.total, renterEmail: l.courriel, messageId: r.messageId, pdfAttached: !!pdfBuffer });
    } catch (e) {
      results.push({ ...base, status: 'email-failed', numero: fac.numero, period: fac.periode, error: e.message || String(e) });
    }
  }

  if (changed) await saveUserData(username, data);
  return results;
}

exports.handler = async () => {
  const startedAt = new Date().toISOString();
  const today = new Date();
  console.log(`[location-invoices] starting at ${startedAt}`);

  let users;
  try {
    users = await listAllUserData();
  } catch (e) {
    console.error('[location-invoices] failed to list users:', e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }

  const results = [];
  for (const u of users) {
    try {
      const r = await processLocationInvoicesForUser(u.username, u.data, today);
      results.push(...r);
      console.log(`[location-invoices] ${u.username}: ${r.map(x => x.status).join(',') || 'no-contracts'}`);
    } catch (e) {
      console.error(`[location-invoices] ${u.username} crashed:`, e);
      results.push({ username: u.username, kind: 'location-invoices', status: 'error', error: e.message || String(e) });
    }

    // Recap to the company inbox only when something was actually sent or failed.
    const ent = (u.data && u.data.settings && u.data.settings.entreprise) || {};
    const notable = results.filter(x => x.username === u.username && (x.status === 'sent' || /fail|error/.test(x.status)));
    if (ent.courriel && notable.length) {
      try {
        const lines = notable.map(x => `<li>${x.numero || ''} — ${x.locataire} — ${x.period || ''} : <b>${x.status}</b>${x.error ? ` (${x.error})` : ''}</li>`).join('');
        await sendEmail({
          to: ent.courriel,
          subject: `🔑 Factures location otomatik — ${notable.filter(x => x.status === 'sent').length} voye`,
          html: `<div style="font-family:sans-serif;font-size:14px"><p>Rapò fakti location otomatik :</p><ul>${lines}</ul></div>`,
          fromName: ent.nom || 'J&W Transport'
        });
      } catch (e) { console.error('[location-invoices] recap failed:', e); }
    }
  }

  try { await logAutomationRun('location-invoices', results); } catch (e) { /* best effort */ }

  return {
    statusCode: 200,
    body: JSON.stringify({ startedAt, finishedAt: new Date().toISOString(), count: results.length, results })
  };
};
