// Generate 2025 invoice and facture data for JW Transport
const fs = require('fs');

function uid() { return Math.random().toString(36).substr(2, 9); }

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatPeriode(weekStart, weekEnd) {
  const [y1,m1,d1] = weekStart.split('-');
  const [y2,m2,d2] = weekEnd.split('-');
  return `${d1}-${m1}-${y1} au ${d2}-${m2}-${y2}`;
}

const invoices = [
  { num:"031", date:"2025-01-12", weekStart:"2025-01-06", weekEnd:"2025-01-10",
    mtl:{fiches:2, kg:10440, dt:"\nLundi : 80070658\nMercredi : 80070673"},
    lav:{fiches:4, kg:20060, dt:"\nLundi : 80070610\nMercredi : 80070621\nJeudi : 80070698\nVendredi : 80070714"},
    st:2343.80 },
  { num:"032", date:"2025-01-19", weekStart:"2025-01-13", weekEnd:"2025-01-17",
    mtl:{fiches:4, kg:19050, dt:"\nLundi : 80070858\nMardi : 80070880\nMercredi : 80070912\nJeudi : 80070963"},
    lav:{fiches:5, kg:25790, dt:"\nLundi : 80070769\nMardi : 80070757\nMercredi : 80070821\nJeudi : 80070807\nVendredi : 80070969"},
    st:3519.80 },
  { num:"033", date:"2025-01-26", weekStart:"2025-01-20", weekEnd:"2025-01-24",
    mtl:{fiches:4, kg:19240, dt:"\nLundi : 80071004\nMardi : 80071054\nMercredi : 80071105\nJeudi : 80071152"},
    lav:{fiches:4, kg:18700, dt:"\nLundi : 80071019\nMardi : 80071071\nMercredi : 80071121\nJeudi : 80071164"},
    st:3040.60 },
  { num:"034", date:"2025-02-02", weekStart:"2025-01-27", weekEnd:"2025-01-31",
    mtl:{fiches:6, kg:29390, dt:""},
    lav:{fiches:2, kg:10290, dt:""},
    st:3365.40 },
  { num:"035", date:"2025-02-09", weekStart:"2025-02-03", weekEnd:"2025-02-07",
    mtl:{fiches:5, kg:24970, dt:""},
    lav:{fiches:4, kg:21240, dt:""},
    st:3734.10 },
  { num:"036", date:"2025-02-16", weekStart:"2025-02-10", weekEnd:"2025-02-14",
    mtl:{fiches:1, kg:4840, dt:""},
    lav:{fiches:4, kg:20900, dt:""},
    st:1898.60 },
  { num:"037", date:"2025-03-02", weekStart:"2025-02-24", weekEnd:"2025-02-28",
    mtl:{fiches:2, kg:10030, dt:""},
    lav:{fiches:1, kg:5090, dt:""},
    st:1259.00 },
  { num:"038", date:"2025-03-09", weekStart:"2025-03-03", weekEnd:"2025-03-07",
    mtl:{fiches:3, kg:14290, dt:""},
    lav:null,
    st:1286.10 },
  { num:"039", date:"2025-03-16", weekStart:"2025-03-10", weekEnd:"2025-03-14",
    mtl:null,
    lav:{fiches:3, kg:14130, dt:""},
    st:989.10 },
  { num:"040", date:"2025-03-24", weekStart:"2025-03-24", weekEnd:"2025-03-28",
    mtl:{fiches:6, kg:25010, dt:"\nLundi : 80072370\nMardi : 80072409\nMercredi : 80072452 ; 80072478\nJeudi : 80072482 ; 80072506"},
    lav:{fiches:4, kg:15750, dt:"\nLundi : 80072384\nMardi : 80072426\nJeudi : 80072509 ; 80072517"},
    st:3353.40 },
  { num:"041", date:"2025-03-31", weekStart:"2025-03-31", weekEnd:"2025-04-04",
    mtl:{fiches:6, kg:24820, dt:""},
    lav:{fiches:2, kg:8560, dt:""},
    st:2833.00 },
  { num:"042", date:"2025-04-06", weekStart:"2025-03-31", weekEnd:"2025-04-04",
    mtl:{fiches:1, kg:4400, dt:""},
    lav:{fiches:1, kg:4400, dt:""},
    st:704.00 },
  { num:"043", date:"2025-04-13", weekStart:"2025-04-07", weekEnd:"2025-04-11",
    mtl:{fiches:4, kg:16560, dt:""},
    lav:{fiches:6, kg:26590, dt:""},
    st:3351.70 },
  { num:"044", date:"2025-04-20", weekStart:"2025-04-14", weekEnd:"2025-04-18",
    mtl:{fiches:2, kg:8330, dt:""},
    lav:{fiches:6, kg:29470, dt:""},
    st:2812.60 },
  { num:"045", date:"2025-04-27", weekStart:"2025-04-21", weekEnd:"2025-04-25",
    mtl:{fiches:8, kg:32410, dt:""},
    lav:{fiches:7, kg:28180, dt:""},
    st:4889.50 },
  { num:"046", date:"2025-05-04", weekStart:"2025-04-28", weekEnd:"2025-05-02",
    mtl:{fiches:6, kg:26170, dt:""},
    lav:{fiches:6, kg:25780, dt:""},
    st:4159.90 },
  { num:"047", date:"2025-05-11", weekStart:"2025-05-05", weekEnd:"2025-05-09",
    mtl:{fiches:5, kg:21260, dt:"\nLundi : 80073823 ; 80073846\nMardi : 80073915\nMercredi : 80073969\nJeudi : 80074031"},
    lav:{fiches:7, kg:29660, dt:"\nLundi : 80073863\nMardi : 80073937\nMercredi : 80073953\nJeudi : 80073993\nVendredi : 80074081 ; 80074092 ; 80074098"},
    st:3989.60 },
  { num:"048", date:"2025-05-18", weekStart:"2025-05-12", weekEnd:"2025-05-16",
    mtl:{fiches:5, kg:20670, dt:"\nLundi : 80074138\nMardi : 80074216\nJeudi : 80074331 ; 80074342\nVendredi : 80074391"},
    lav:{fiches:6, kg:24940, dt:"\nLundi : 80074158\nMardi : 80074199 ; 80074243\nMercredi : 80074263 ; 80074276\nVendredi : 80074379"},
    st:3606.10 },
  { num:"049", date:"2025-05-25", weekStart:"2025-05-19", weekEnd:"2025-05-23",
    mtl:{fiches:7, kg:30540, dt:"\nMardi : 80074433 ; 80074450\nMercredi : 80074483\nJeudi : 80074535 ; 80074572\nVendredi : 80074597 ; 80074602"},
    lav:{fiches:4, kg:17090, dt:"\nMardi : 80074411\nMercredi : 80074464\nJeudi : 80074549\nVendredi : 80074614"},
    st:3944.90 },
  { num:"050", date:"2025-06-01", weekStart:"2025-05-26", weekEnd:"2025-05-30",
    mtl:{fiches:3, kg:13090, dt:"\nMardi : 80074728\nMercredi : 80074771\nJeudi : 80074771"},
    lav:{fiches:6, kg:26030, dt:"\nLundi : 80074630\nMardi : 80074699\nMercredi : 80074743\nJeudi : 80074821\nVendredi : 80074855 ; 80074860"},
    st:3000.20 },
  { num:"051", date:"2025-06-08", weekStart:"2025-06-02", weekEnd:"2025-06-06",
    mtl:{fiches:4, kg:17360, dt:"\nMardi : 80074951\nMercredi : 80075011\nJeudi : 80075073\nVendredi : 80075114"},
    lav:{fiches:6, kg:26090, dt:"\nLundi : 80074882 ; 80074898\nMardi : 80074963\nMercredi : 80075025\nJeudi : 80075092\nVendredi : 80075118"},
    st:3388.70 },
  { num:"053", date:"2025-06-15", weekStart:"2025-06-09", weekEnd:"2025-06-13",
    mtl:{fiches:5, kg:21400, dt:"\nLundi : 80075168 ; 80075161\nMardi : 80075214\nJeudi : 80075318\nVendredi : 80075369"},
    lav:{fiches:8, kg:35220, dt:"\nMardi : 80075205 ; 80075231\nMercredi : 80075265 ; 80075249 ; 80075254\nJeudi : 80075307 ; 80075336\nVendredi : 80075360"},
    st:4391.40 },
  { num:"055", date:"2025-06-21", weekStart:"2025-06-16", weekEnd:"2025-06-20", statut:"Payée",
    mtl:{fiches:3, kg:12810, dt:"\nLundi : 80075410 ; 80075426\nVendredi : 80075651"},
    lav:{fiches:9, kg:39390, dt:"\nMardi : 80075459 ; 80075478 ; 80075488\nMercredi : 80075553 ; 80075526\nJeudi : 80075576 ; 80075592\nVendredi : 80075644"},
    st:3910.20 },
  { num:"057", date:"2025-06-29", weekStart:"2025-06-23", weekEnd:"2025-06-27", statut:"Payée",
    mtl:{fiches:5, kg:17590, dt:"\nLundi : 80075696\nMercredi : 80075764\nJeudi : 80075827\nVendredi : 80075869"},
    lav:{fiches:5, kg:26160, dt:"\nLundi : 80075675 ; 80075708\nMercredi : 80075745\nJeudi : 80075801\nVendredi : 80075860\n18-06-2025 : 80075542"},
    st:3414.30 },
  { num:"059", date:"2025-07-06", weekStart:"2025-06-30", weekEnd:"2025-07-04",
    mtl:{fiches:3, kg:12940, dt:"\nLundi : 80075906\nJeudi : 80076022\nVendredi : 80076060"},
    lav:{fiches:5, kg:20680, dt:"\nLundi : 80075888\nMercredi : 80075957 ; 80075966\nJeudi : 80076019\nVendredi : 80076073"},
    st:2612.20 },
  { num:"063", date:"2025-07-20", weekStart:"2025-07-14", weekEnd:"2025-07-18",
    mtl:{fiches:4, kg:17680, dt:"\nMardi : 80076435\nMercredi : 80076498\nJeudi : 80076538\nVendredi : 80076570"},
    lav:{fiches:8, kg:34020, dt:"\nLundi : 80076272 ; 80076378 ; 80076394\nMardi : 80076418 ; 80076423\nMercredi : 80076484 ; 80076470\nJeudi : 80076550"},
    st:3972.60 },
  { num:"065", date:"2025-08-10", weekStart:"2025-08-04", weekEnd:"2025-08-08",
    mtl:{fiches:4, kg:15380, dt:"\nMardi : 80076793\nMercredi : 80076881\nJeudi : 80076932\nVendredi : 80076983"},
    lav:{fiches:11, kg:44540, dt:"\nLundi : 80076728 ; 80076748 ; 80076755 ; 80076760\nMardi : 80076812 ; 80076819 ; 80076840\nMercredi : 80076873\nJeudi : 80076923\nVendredi : 80076971 ; 80076946"},
    st:4502.00 },
  { num:"066", date:"2025-08-17", weekStart:"2025-08-11", weekEnd:"2025-08-15",
    mtl:{fiches:5, kg:20210, dt:"\nLundi : 80077019\nMardi : 80077065 ; 80077075\nVendredi : 80077186 ; 80077197"},
    lav:null,
    st:1818.90 },
  { num:"067", date:"2025-08-24", weekStart:"2025-08-18", weekEnd:"2025-08-22",
    mtl:{fiches:5, kg:20820, dt:"\nLundi : 80077231\nMardi : 80077266 ; 80077275\nJeudi : 80077361\nVendredi : 80077400"},
    lav:{fiches:5, kg:22680, dt:"\nLundi : 80077221\nMercredi : 80077303 ; 80077323\nJeudi : 80077329\nVendredi : 80077405"},
    st:3461.40 },
  { num:"068", date:"2025-08-31", weekStart:"2025-08-25", weekEnd:"2025-08-29",
    mtl:{fiches:5, kg:20790, dt:"\nLundi : 80077438\nMardi : 80077490\nJeudi : 80077565 ; 80077472\nVendredi : 80077611"},
    lav:{fiches:5, kg:20620, dt:"\nLundi : 80077440\nMardi : 80077482\nMercredi : 80077521 ; 80077532\nVendredi : 80077597"},
    st:3314.50 },
  { num:"069", date:"2025-09-07", weekStart:"2025-09-01", weekEnd:"2025-09-05",
    mtl:{fiches:2, kg:8360, dt:"\nMardi : 80077446\nMercredi : 80077702"},
    lav:{fiches:6, kg:21390, dt:"\nMercredi : 80077677 ; 80077687\nJeudi : 80077737 ; 80077750\nVendredi : 80077787 ; 80077782"},
    st:2249.70 },
  { num:"070", date:"2025-09-14", weekStart:"2025-09-08", weekEnd:"2025-09-12",
    mtl:{fiches:4, kg:16330, dt:"\nLundi : 80077832\nMercredi : 80077948\nJeudi : 80077988\nVendredi : 80078030"},
    lav:{fiches:0, kg:24420, dt:""},
    st:3179.10 },
  { num:"071", date:"2025-09-21", weekStart:"2025-09-15", weekEnd:"2025-09-19", statut:"Envoyée",
    mtl:{fiches:4, kg:15420, dt:"\nMardi : 80078130\nMercredi : 80078179\nJeudi : 80078242\nVendredi : 80078283"},
    lav:{fiches:6, kg:24560, dt:"\nLundi : 80078062 ; 80078085\nMardi : 80078007\nMercredi : 80078195\nJeudi : 80078195\nVendredi : 80078277"},
    st:3107.00 },
  { num:"072", date:"2025-09-28", weekStart:"2025-09-22", weekEnd:"2025-09-26",
    mtl:{fiches:4, kg:17110, dt:"\nMardi : 80078365 ; 80078380\nJeudi : 80078482\nVendredi : 80078522"},
    lav:{fiches:6, kg:24920, dt:"\nLundi : 80078323 ; 80078334\nMercredi : 80078440 ; 80078426\nJeudi : 80078472\nVendredi : 80078517"},
    st:3284.30 },
  { num:"074", date:"2025-10-05", weekStart:"2025-09-29", weekEnd:"2025-10-03",
    mtl:{fiches:3, kg:12120, dt:"\nMardi : 80078612 ; 80078636\nJeudi : Moto"},
    lav:{fiches:7, kg:27880, dt:"\nLundi : 80078565 ; 80078558\nMercredi : 80078649 ; 80078674\nJeudi : 80078711\nVendredi : 80078765 ; 80078775"},
    st:3092.40, prime:50 },
  { num:"076", date:"2025-10-12", weekStart:"2025-10-06", weekEnd:"2025-10-10",
    mtl:{fiches:4, kg:17420, dt:"\nLundi : 80078812\nMardi : 80078870\nMercredi : 80078914\nVendredi : 80078990"},
    lav:{fiches:7, kg:32240, dt:"\nLundi : 80078796\nMardi : 80078854\nMercredi : 80078895\nJeudi : 80078942 ; 80079950\nVendredi : 80079008 ; 80078996"},
    st:3824.60 },
  { num:"077", date:"2025-10-19", weekStart:"2025-10-13", weekEnd:"2025-10-17",
    mtl:null,
    lav:{fiches:8, kg:34950, dt:"\nMardi : 80079054 ; 80079033\nMercredi : 80079079 ; 80079096\nJeudi : 80079128 ; 80079141\nVendredi : 80079187 ; 80079198"},
    st:2446.50 },
  { num:"078", date:"2025-10-26", weekStart:"2025-10-20", weekEnd:"2025-10-24",
    mtl:{fiches:5, kg:21650, dt:"\nMardi : 80079275\nMercredi : NO DT\nJeudi : 80079392 ; 80079431\nVendredi : 80079480"},
    lav:{fiches:9, kg:39120, dt:"\nLundi : 80079224 ; 80079249\nMardi : 80079290 ; 80079300\nMercredi : 80079349 ; NO DT\nJeudi : 80079427 ; No DT\nVendredi : 80079464"},
    st:4686.90 },
  { num:"079", date:"2025-11-02", weekStart:"2025-10-27", weekEnd:"2025-10-31",
    mtl:{fiches:6, kg:26310, dt:"\nLundi : 80079495\nMercredi : 80079629 ; 80079645\nJeudi : 80079704 ; 80079717\nVendredi : 80079759"},
    lav:{fiches:11, kg:47840, dt:"\nLundi : 80079521 ; 80079538\nMardi : 80079568 ; 80079577 ; 80079595\nMercredi : 80079634\nJeudi : 80079670 ; 80079712\nVendredi : 80079768 ; 80079752 ; 80079737"},
    st:5716.70 },
  { num:"081", date:"2025-11-11", weekStart:"2025-11-03", weekEnd:"2025-11-07",
    mtl:{fiches:1, kg:4370, dt:"\nLundi : 80079808"},
    lav:{fiches:11, kg:48080, dt:"\nLundi : 80079786 ; 80079816\nMercredi : 80079750 ; 80079935 ; 80079919\nJeudi : 80079987 ; 80079998 ; 80070015\nVendredi : 80070069 ; 80070057 ; 80080042"},
    st:3758.90 },
  { num:"082", date:"2025-11-16", weekStart:"2025-11-10", weekEnd:"2025-11-14",
    mtl:{fiches:2, kg:9020, dt:"\nLundi : 80080109 ; 80080126"},
    lav:{fiches:5, kg:21280, dt:"\nJeudi : 80080296 ; 80080300 ; 80080308 ; 80080316 ; 80080335"},
    st:2301.40 },
  { num:"083", date:"2025-11-23", weekStart:"2025-11-17", weekEnd:"2025-11-21",
    mtl:{fiches:3, kg:15580, dt:"\nMardi : 80080527\nJeudi : 80080625\nVendredi : 80080674"},
    lav:{fiches:17, kg:83260, dt:"\nLundi : 80080450 ; 80080387 ; 80080441 ; 80080425 ; 80080409\nMardi : 80080498 ; 80080485 ; 80080474\nMercredi : 80080572 ; 80080562 ; 80080556 ; 80080594\nJeudi : 80080610 ; 80080635\nVendredi : 80080688 ; 80080696 ; 80080707"},
    st:7230.40 },
  { num:"084", date:"2025-11-30", weekStart:"2025-11-24", weekEnd:"2025-11-28",
    mtl:{fiches:7, kg:32420, dt:"\nLundi : 80080755\nMardi : 80080799 ; 80080816 ; 80080840\nMercredi : 80080881\nJeudi : 80080920 ; 80080944"},
    lav:{fiches:6, kg:28660, dt:"\nLundi : 80080744 ; 80080772\nMercredi : 80080895\nJeudi : 80080956 ; 80080963 ; 80080983"},
    st:4924.00 },
  { num:"085", date:"2025-12-07", weekStart:"2025-12-01", weekEnd:"2025-12-04",
    mtl:{fiches:2, kg:8870, dt:"\nJeudi : 80081284\nVendredi : 80081331"},
    lav:{fiches:15, kg:69720, dt:"\nLundi : 80081066 ; 80081074 ; 80081083 ; 80081091\nMardi : 80081161 ; 80081143 ; 80081130\nMercredi : 80081230 ; 80081216 ; 80081205\nJeudi : 80081294 ; 80081272 ; 80081262\nVendredi : 80081346 ; 80081321"},
    st:5678.70 },
  { num:"086", date:"2025-12-14", weekStart:"2025-12-08", weekEnd:"2025-12-12",
    mtl:{fiches:6, kg:28040, dt:"\nLundi : 80081393 ; 80081385 ; 80081373\nMercredi : 80081523 ; 80081494 ; 80081505"},
    lav:{fiches:10, kg:45310, dt:"\nLundi : 80081353\nMardi : 80081462 ; 80081448 ; 80081432 ; 80081432\nMercredi : 80081484\nVendredi : 80081630 ; 80081622 ; 80081608 ; 80081602"},
    st:5695.30 },
  { num:"087", date:"2025-12-21", weekStart:"2025-12-15", weekEnd:"2025-12-19",
    mtl:{fiches:7, kg:33650, dt:"\nLundi : 80081642 ; 80081670 ; 80081683\nMardi : 89981735\nMercredi : 80081774 ; 80081795\nVendredi : 80081908"},
    lav:{fiches:11, kg:53110, dt:"\nLundi : 80081630\nMardi : 80081722 ; 80081715\nMercredi : 80081811 ; 80081765\nJeudi : 80081842 ; 80081854 ; 80081666 ; 80081878\nVendredi : 80081914 ; 80081901"},
    st:6746.20 },
];

// Build factures array
const factures = invoices.map(inv => {
  const details = [];
  if (inv.mtl && inv.mtl.kg > 0) {
    details.push({
      id: uid(),
      zone: "06",
      description: `Nbre de fiches livrés a Montréal : ${inv.mtl.fiches}`,
      quantite: String(inv.mtl.kg),
      unite: "kg",
      prixUnitaire: "0.09",
      dt: inv.mtl.dt || ""
    });
  }
  if (inv.lav && inv.lav.kg > 0) {
    details.push({
      id: uid(),
      zone: "13",
      description: `Nbre de fiches livrés a Laval : ${inv.lav.fiches || ''}`,
      quantite: String(inv.lav.kg),
      unite: "kg",
      prixUnitaire: "0.07",
      dt: inv.lav.dt || ""
    });
  }
  if (inv.prime) {
    details.push({
      id: uid(),
      zone: "",
      description: `Prime de $ ${inv.prime}`,
      quantite: "1",
      unite: "",
      prixUnitaire: String(inv.prime),
      dt: ""
    });
  }

  // Calculate totals
  const st = inv.st;
  const tps = Math.round(st * 0.05 * 100) / 100;
  const tvq = Math.round(st * 0.09975 * 100) / 100;
  const total = Math.round((st + tps + tvq) * 100) / 100;

  return {
    id: uid(),
    clientId: "2fmamuwhq",
    date: inv.date,
    dateLimite: addDays(inv.date, 30),
    periode: formatPeriode(inv.weekStart, inv.weekEnd),
    details: details,
    avecTPS: true,
    avecTVQ: true,
    statut: inv.statut || "Nouvelle",
    numero: `FAC-${inv.num}`,
    sousTotal: st,
    tps: tps,
    tvq: tvq,
    total: total
  };
});

// Read existing seed data and merge
const seedPath = './netlify/functions/seed-admin-data.json';
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Remove any existing 2025 factures (FAC-0xx), keep only 2026+ (FAC-00x)
const existing2026Factures = (seed.factures || []).filter(f => !f.numero || !f.numero.match(/^FAC-0[3-9]/));
seed.factures = [...factures, ...existing2026Factures];

// Write updated seed
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));
console.log(`Added ${factures.length} factures for 2025`);
console.log(`Total factures now: ${seed.factures.length}`);

// Also write to render seed
const renderSeedPath = './seed-admin-data.json';
if (fs.existsSync(renderSeedPath)) {
  const renderSeed = JSON.parse(fs.readFileSync(renderSeedPath, 'utf8'));
  const existing2026R = (renderSeed.factures || []).filter(f => !f.numero || !f.numero.match(/^FAC-0[3-9]/));
  renderSeed.factures = [...factures, ...existing2026R];
  fs.writeFileSync(renderSeedPath, JSON.stringify(renderSeed, null, 2));
  console.log(`Also updated render seed: ${renderSeed.factures.length} factures`);
}

console.log('\nDone! 2025 factures added to seed data.');
