// PDF generation for invoices and pay-stubs.
// Uses pdfkit (already a project dependency).
const PDFDocument = require('pdfkit');
const { fN, fM, fD } = require('./calc');

// Wrap PDFKit's stream in a Promise<Buffer>.
function buildPdf(builder) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      builder(doc);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Sanitize text so we don't crash WinAnsi font on rare chars.
const safe = v => String(v == null ? '' : v);

// Common header used by both PDF types.
function drawHeader(doc, ent, accentColor = '#1e293b') {
  // Logo box "JW"
  doc.rect(40, 40, 60, 60).fill(accentColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22).text('JW', 40, 65, { width: 60, align: 'center' });

  // Company info
  doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(12).text(safe(ent.nom || 'J&W Transport'), 115, 42);
  doc.font('Helvetica').fontSize(9).fillColor('#475569');
  let y = 56;
  if (ent.adresse) { doc.text(safe(ent.adresse), 115, y); y += 11; }
  if (ent.ville)   { doc.text(safe(ent.ville),   115, y); y += 11; }
  if (ent.telephone) { doc.text(safe(ent.telephone), 115, y); y += 11; }
  if (ent.courriel)  { doc.text(safe(ent.courriel),  115, y); }

  // Separator
  doc.moveTo(40, 110).lineTo(572, 110).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.fillColor('#1a1a1a');
}

function drawFooter(doc, ent) {
  const y = 740;
  doc.moveTo(40, y).lineTo(572, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
  doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
    .text(`${safe(ent.nom || 'J&W Transport')} — ${safe(ent.courriel || '')} — ${safe(ent.telephone || '')}`,
      40, y + 6, { width: 532, align: 'center' });
}

async function generateInvoicePDF(invoice, client, ent, settings) {
  const tpsNum = settings.tpsNum || '';
  const tvqNum = settings.tvqNum || '';

  return buildPdf(doc => {
    // Print-style page header (small, top of page)
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text(stamp, 40, 28);
    doc.text(`Facture ${safe(invoice.numero)}`, 40, 28, { width: 532, align: 'center' });

    // Logo + company info
    doc.font('Helvetica-Bold').fontSize(34).fillColor('#cbd5e1').text('JW', 40, 60, { width: 80, align: 'center' });
    doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(11).text(safe(ent.nom || 'J&W Transport'), 130, 64);
    doc.font('Helvetica').fontSize(9).fillColor('#475569');
    let chy = 79;
    if (ent.adresse)   { doc.text(safe(ent.adresse),   130, chy); chy += 12; }
    if (ent.ville)     { doc.text(safe(ent.ville),     130, chy); chy += 12; }
    if (ent.telephone) { doc.text(safe(ent.telephone), 130, chy); chy += 12; }
    if (ent.courriel)  { doc.text(safe(ent.courriel),  130, chy); }

    // Section header — "Semaine du ..."
    let y = 165;
    if (invoice.periode) {
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1a1a1a')
        .text(`Semaine du ${safe(invoice.periode)}`, 40, y);
      y += 24;
    }

    // Two-column block: invoice meta (left) + client box (right)
    const metaTop = y;
    const metaItems = [
      { label: 'Facture', value: safe(invoice.numero) },
      { label: 'Date',    value: safe(invoice.date) },
      { label: 'Total',   value: fM(invoice.total) }
    ];
    doc.font('Helvetica').fontSize(10);
    metaItems.forEach((item, i) => {
      const ry = metaTop + i * 18;
      doc.fillColor('#64748b').text(item.label, 40, ry);
      doc.fillColor('#1a1a1a').font('Helvetica-Bold').text(item.value, 40, ry, { width: 270, align: 'right' });
      doc.font('Helvetica');
    });
    // Statut row with badge
    const statutY = metaTop + metaItems.length * 18;
    doc.fillColor('#64748b').text('Statut', 40, statutY);
    const statut = safe(invoice.statut || 'Envoyée');
    doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(9)
      .text(statut, 40, statutY + 1, { width: 270, align: 'right' });
    doc.font('Helvetica').fontSize(10);

    // Client box (right column)
    const cx = 330, cy = metaTop - 4, cw = 242, ch = 90;
    doc.rect(cx, cy, cw, ch).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor('#1a1a1a').font('Helvetica-Bold').fontSize(11).text(safe(client.nom || '—'), cx + 12, cy + 10);
    doc.font('Helvetica').fontSize(9).fillColor('#475569');
    let cyl = cy + 28;
    if (client.adresse)  { doc.text(safe(client.adresse), cx + 12, cyl, { width: cw - 24 }); cyl += 12; }
    if (client.ville)    { doc.text(safe(client.ville),    cx + 12, cyl, { width: cw - 24 }); cyl += 12; }
    if (client.telephone){ doc.text(safe(client.telephone),cx + 12, cyl, { width: cw - 24 }); cyl += 12; }
    if (client.courriel) { doc.text(safe(client.courriel), cx + 12, cyl, { width: cw - 24 }); }

    // Items table
    y = Math.max(metaTop + metaItems.length * 18 + 30, cy + ch + 14);
    const cols = [
      { label: 'DESCRIPTION', x: 40,  w: 280, align: 'left' },
      { label: 'QUANTITÉ',    x: 320, w: 80,  align: 'right' },
      { label: 'PRIX UNIT.',  x: 400, w: 80,  align: 'right' },
      { label: 'TOTAL',       x: 480, w: 92,  align: 'right' }
    ];
    doc.rect(40, y, 532, 22).fill('#f1f5f9').stroke('#e2e8f0');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569');
    cols.forEach(c => doc.text(c.label, c.x + 6, y + 7, { width: c.w - 12, align: c.align }));
    y += 22;

    doc.font('Helvetica').fontSize(9).fillColor('#1a1a1a');
    (invoice.details || []).forEach(d => {
      const q = parseFloat(d.quantite) || 0;
      const p = parseFloat(d.prixUnitaire) || 0;
      const total = q * p;
      const dtLines = d.dt ? String(d.dt).split('\n').filter(Boolean) : [];

      const rowH = 22 + (dtLines.length ? (dtLines.length * 10 + 14) : 0);
      doc.strokeColor('#e2e8f0').lineWidth(0.5);
      doc.rect(40, y, 532, rowH).stroke();

      doc.fillColor('#1a1a1a').font('Helvetica').fontSize(9)
         .text(safe(d.description || '—'), 46, y + 7, { width: 268 });
      doc.text(`${fN(q)} kg`, 326, y + 7, { width: 68, align: 'right' });
      doc.text(fN(p),         406, y + 7, { width: 68, align: 'right' });
      doc.font('Helvetica-Bold').text(fM(total), 486, y + 7, { width: 80, align: 'right' });
      doc.font('Helvetica');

      if (dtLines.length) {
        doc.fontSize(8).fillColor('#94a3b8').text('DT:', 46, y + 24);
        let yy = y + 24;
        dtLines.forEach(line => { doc.fillColor('#475569').text(safe(line), 46, yy + 10, { width: 250 }); yy += 10; });
        doc.fontSize(9).fillColor('#1a1a1a');
      }
      y += rowH;
    });

    // Totals box (bottom-right) — make it wider to keep TVQ label on one line.
    y += 12;
    const tbX = 290, tbW = 282;
    doc.font('Helvetica').fontSize(10).fillColor('#475569');
    const totRow = (label, value, opts = {}) => {
      const isFinal = !!opts.final;
      doc.fillColor(isFinal ? '#1a1a1a' : '#475569')
         .font(isFinal ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(isFinal ? 13 : 10);
      if (isFinal) {
        doc.moveTo(tbX, y).lineTo(tbX + tbW, y).strokeColor('#cbd5e1').lineWidth(1).stroke();
        y += 6;
      }
      doc.text(label, tbX, y, { width: tbW - 110, lineBreak: false, ellipsis: true });
      doc.fillColor('#1a1a1a')
         .text(value, tbX, y, { width: tbW, align: 'right', lineBreak: false });
      y += isFinal ? 22 : 18;
    };
    totRow('Sous-total', fM(invoice.sousTotal));
    if (invoice.avecTPS) totRow(`TPS ${tpsNum} 5%`, fM(invoice.tps));
    if (invoice.avecTVQ) totRow(`TVQ ${tvqNum} 9.975%`, fM(invoice.tvq));
    totRow('Total', fM(invoice.total), { final: true });

    drawFooter(doc, ent);
  });
}

async function generatePayslipPDF(emp, weekLabel, ent, payDate, opts = {}) {
  const isBiweekly = !!opts.isBiweekly;

  return buildPdf(doc => {
    drawHeader(doc, ent, '#22c55e');

    let y = 130;
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#1a1a1a').text('TALON DE PAIE', 40, y);

    // Beneficiary box
    y = 165;
    doc.rect(40, y, 532, 60).fill('#f0fdf4').stroke('#bbf7d0');
    doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(9).text('BÉNÉFICIAIRE', 50, y + 8);
    doc.fillColor('#14532d').font('Helvetica-Bold').fontSize(15).text(safe(emp.nom), 50, y + 22);
    doc.font('Helvetica').fontSize(10).fillColor('#15803d')
      .text(`${safe(emp.role)}${emp.courriel ? '  •  ' + safe(emp.courriel) : ''}`, 50, y + 42);

    // Three info cards (Période, Date paie, Voyages)
    y = 240;
    const cardW = 170, cardH = 60, gap = 11;
    const drawCard = (label, value, x, bg, fg, valBg, valFg) => {
      doc.rect(x, y, cardW, cardH).fill(bg).stroke('#e2e8f0');
      doc.fillColor(fg).font('Helvetica-Bold').fontSize(8).text(label, x + 10, y + 8);
      doc.fillColor(valFg || '#1a1a1a').font('Helvetica-Bold').fontSize(12).text(value, x + 10, y + 26, { width: cardW - 20 });
    };
    drawCard(`PÉRIODE${isBiweekly ? ' (2 SEMAINES)' : ''}`, safe(weekLabel), 40, '#f8fafc', '#64748b');
    drawCard('DATE DE PAIE', safe(payDate || '—'), 40 + cardW + gap, '#dbeafe', '#1d4ed8', null, '#1e40af');
    drawCard('VOYAGES', String(emp.totalVoy || 0), 40 + (cardW + gap) * 2, '#f8fafc', '#64748b', null, '#6366f1');

    // Trip details table
    y = 320;
    const cols = [
      { label: 'DATE',    x: 40,  w: 80,  align: 'left' },
      { label: 'ZONE',    x: 120, w: 80,  align: 'left' },
      { label: 'VOY.',    x: 200, w: 50,  align: 'right' },
      { label: 'TAUX',    x: 250, w: 80,  align: 'right' },
      { label: 'BONUS',   x: 330, w: 80,  align: 'right' },
      { label: 'TOTAL',   x: 410, w: 162, align: 'right' }
    ];
    const drawTableHead = () => {
      doc.rect(40, y, 532, 22).fill('#f1f5f9');
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569');
      cols.forEach(c => doc.text(c.label, c.x + 6, y + 7, { width: c.w - 12, align: c.align }));
      y += 22;
    };
    drawTableHead();
    // A long period runs past the bottom of the page; without an explicit break
    // the rows keep going and the totals box is drawn off-page and lost.
    const PAGE_BOTTOM = 720;
    const ensure = (need, repeatHead) => {
      if (y + need <= PAGE_BOTTOM) return;
      doc.addPage();
      y = 50;
      if (repeatHead) drawTableHead();
    };

    const trips = emp.tripDetails || [];
    // A biweekly pay period covers two work weeks; show them as Semaine 1 and
    // Semaine 2 with their own subtotal instead of one undivided list.
    const addD = (s, k) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const mon = opts.mondayStr || '';
    const wk2 = (isBiweekly && mon) ? addD(mon, 7) : '';
    const groups = wk2
      ? [
          { label: `SEMAINE 1 — ${fD(mon)} au ${fD(addD(mon, 4))}`, rows: trips.filter(d => d.date < wk2) },
          { label: `SEMAINE 2 — ${fD(wk2)} au ${fD(addD(wk2, 4))}`, rows: trips.filter(d => d.date >= wk2) }
        ]
      : [{ label: '', rows: trips }];

    if (trips.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(10).fillColor('#94a3b8')
        .text('Aucun voyage dans cette période.', 40, y + 8, { width: 532, align: 'center' });
      y += 30;
    } else {
      groups.forEach(g => {
        if (g.label) {
          ensure(56, true);
          doc.rect(40, y, 532, 18).fill('#eef2ff');
          doc.font('Helvetica-Bold').fontSize(8).fillColor('#4338ca')
            .text(g.label, 46, y + 5, { width: 400 });
          y += 18;
        }
        if (g.label && g.rows.length === 0) {
          doc.font('Helvetica-Oblique').fontSize(9).fillColor('#94a3b8')
            .text('Aucun voyage cette semaine.', 46, y + 4, { width: 520 });
          y += 18;
          return;
        }
        doc.font('Helvetica').fontSize(9).fillColor('#1a1a1a');
        g.rows.forEach((d, i) => {
          ensure(18, true);
          if (i % 2 === 1) doc.rect(40, y, 532, 18).fill('#fafafa');
          doc.fillColor('#1a1a1a').font('Helvetica');
          doc.text(safe(fD(d.date)),  46,  y + 5, { width: 68 });
          doc.text(safe(d.zone),      126, y + 5, { width: 68 });
          doc.text(String(d.nb || 0), 206, y + 5, { width: 38, align: 'right' });
          doc.text(fM(d.tx),          256, y + 5, { width: 68, align: 'right' });
          doc.fillColor(d.bonus > 0 ? '#f59e0b' : '#94a3b8')
             .text(d.bonus > 0 ? fM(d.bonus) : '—', 336, y + 5, { width: 68, align: 'right' });
          doc.fillColor('#1a1a1a').font('Helvetica-Bold')
             .text(fM(d.sub), 416, y + 5, { width: 156, align: 'right' });
          doc.font('Helvetica');
          y += 18;
        });
        if (g.label) {
          ensure(20, true);
          const sv = g.rows.reduce((s, d) => s + (d.nb || 0), 0);
          const ss = g.rows.reduce((s, d) => s + (d.sub || 0), 0);
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#4338ca')
            .text(`Sous-total ${g.label.split(' —')[0].toLowerCase()} — ${sv} voyage${sv > 1 ? 's' : ''}`, 46, y + 4, { width: 360 });
          doc.text(fM(Math.round(ss * 100) / 100), 416, y + 4, { width: 156, align: 'right' });
          y += 20;
        }
      });
    }

    // Totals box — keep it, the note and the footer on the same page.
    y += 14;
    ensure(140, false);
    const tbX = 320, tbW = 252;
    const totRow = (label, value, bg, fg) => {
      if (bg) doc.rect(tbX, y, tbW, 22).fill(bg);
      doc.fillColor(fg || '#475569').font(bg ? 'Helvetica-Bold' : 'Helvetica').fontSize(bg ? 12 : 10);
      doc.text(label, tbX + 10, y + 6);
      doc.text(value, tbX, y + 6, { width: tbW - 10, align: 'right' });
      y += 22;
    };
    totRow('Voyages × taux', fM((emp.brut || 0) - (emp.bonus || 0)));
    if (emp.bonus > 0) {
      doc.fillColor('#f59e0b').font('Helvetica-Bold').fontSize(10);
      doc.text('Bonus', tbX + 10, y + 6);
      doc.text(fM(emp.bonus), tbX, y + 6, { width: tbW - 10, align: 'right' });
      y += 22;
    }
    totRow('BRUT TOTAL', fM(emp.brut || 0), '#22c55e', '#ffffff');

    // Note travailleur autonome
    y += 14;
    doc.rect(40, y, 532, 36).fill('#fef3c7').stroke('#fde68a');
    doc.fillColor('#92400e').font('Helvetica-Bold').fontSize(9).text('NOTE:', 50, y + 8);
    doc.font('Helvetica').fontSize(9)
      .text('Travailleur autonome — Aucune retenue à la source. Le bénéficiaire est responsable de déclarer ce revenu.',
        88, y + 8, { width: 470 });

    drawFooter(doc, ent);
  });
}

module.exports = { generateInvoicePDF, generatePayslipPDF };
