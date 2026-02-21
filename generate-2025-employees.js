// Generate 2025 employee data: chauffeurs, voyages, dépenses (gaz)
// Parses the timesheet raw text to extract weekly pay data
const fs = require('fs');

function uid() { return Math.random().toString(36).substr(2, 9); }

// Employee IDs
const EMP = {
  c1: "c1",        // Brain Jean Ginior (Jean Junior) - Chauffeur principal
  c2: "c2",        // Djeph Alexandre (Jeff) - Helper
  c3: "c3",        // Ceres - Chauffeur 2
  c4: "c4",        // Fanfan - Helper 2
  ginior: "c5"     // Ginior - Helper (appears as separate helper in some weeks)
};

// New chauffeurs to add
const newChauffeurs = [
  { id: "c3", nom: "Ceres", role: "Chauffeur", aktif: true, courriel: "" },
  { id: "c4", nom: "Fanfan", role: "Helper", aktif: true, courriel: "" },
  { id: "c5", nom: "Ginior", role: "Helper", aktif: true, courriel: "" }
];

// Weekly pay data extracted from all 46 timesheet docx files
// Format: { week, weekStart, weekEnd, staff (who worked each day), pay (salary info), gaz, voyagesPerDay }
// Staff abbreviations: JJ=Jean Junior, JF=Jeff, GI=Ginior, CE=Ceres, FF=Fanfan
const weeklyData = [
  // === JANVIER 2025 ===
  { weekStart:"2025-01-06", weekEnd:"2025-01-10",
    staff: { lun:["JJ","JF"], mar:["JJ","JF"], mer:["JJ","JF"], jeu:["JJ","JF"], ven:["JJ","JF"] },
    pay: { jeff: 360 }, gaz: 220,
    // From invoice FAC-031: MTL 2 fiches 10440kg, LAV 4 fiches 20060kg
    zones: { mtl: { fiches: 2, kg: 10440 }, lav: { fiches: 4, kg: 20060 } }
  },
  { weekStart:"2025-01-13", weekEnd:"2025-01-17",
    staff: { lun:["JJ","JF"], mar:["JJ","JF"], mer:["JJ","JF"], jeu:["JJ","JF"], ven:["JJ","JF"] },
    pay: { jeff: 564 }, gaz: 300,
    zones: { mtl: { fiches: 4, kg: 19050 }, lav: { fiches: 5, kg: 25790 } }
  },
  { weekStart:"2025-01-20", weekEnd:"2025-01-24",
    staff: { lun:["JJ","JF"], mar:["JJ","JF"], mer:["JJ","JF"], jeu:["JJ","JF"], ven:["JJ","JF"] },
    pay: { jeff: 480 }, gaz: 250,
    zones: { mtl: { fiches: 4, kg: 19240 }, lav: { fiches: 4, kg: 18700 } }
  },
  { weekStart:"2025-01-27", weekEnd:"2025-01-31",
    staff: { lun:["JJ","JF"], mar:["JJ","JF"], mer:["JJ","JF"], jeu:["JJ","JF"], ven:["JJ","JF"] },
    pay: { jeff: 480 }, gaz: 350,
    zones: { mtl: { fiches: 6, kg: 29390 }, lav: { fiches: 2, kg: 10290 } }
  },
  // === FÉVRIER 2025 ===
  { weekStart:"2025-02-03", weekEnd:"2025-02-07",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 540, ginior: 520 }, gaz: 350,
    zones: { mtl: { fiches: 5, kg: 24970 }, lav: { fiches: 4, kg: 21240 } }
  },
  { weekStart:"2025-02-10", weekEnd:"2025-02-14",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 300, ginior: 325 }, gaz: 300,
    zones: { mtl: { fiches: 1, kg: 4840 }, lav: { fiches: 4, kg: 20900 } }
  },
  { weekStart:"2025-02-24", weekEnd:"2025-02-28",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"] },
    pay: { jeff: 180, ginior: 195 }, gaz: 180,
    zones: { mtl: { fiches: 2, kg: 10030 }, lav: { fiches: 1, kg: 5090 } }
  },
  // === MARS 2025 ===
  { weekStart:"2025-03-03", weekEnd:"2025-03-07",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"] },
    pay: { jeff: 180, ginior: 195 }, gaz: 250,
    zones: { mtl: { fiches: 3, kg: 14290 }, lav: null }
  },
  { weekStart:"2025-03-10", weekEnd:"2025-03-14",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"] },
    pay: { jeff: 230, ginior: 195 }, gaz: 250,
    zones: { mtl: null, lav: { fiches: 3, kg: 14130 } }
  },
  { weekStart:"2025-03-17", weekEnd:"2025-03-21",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 600, ginior: 700 }, gaz: 300,
    zones: { mtl: { fiches: 6, kg: 25010 }, lav: { fiches: 4, kg: 15750 } }
  },
  { weekStart:"2025-03-24", weekEnd:"2025-03-28",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 600, ginior: 700 }, gaz: 300,
    zones: { mtl: { fiches: 6, kg: 25010 }, lav: { fiches: 4, kg: 15750 } }
  },
  // === AVRIL 2025 ===
  { weekStart:"2025-03-31", weekEnd:"2025-04-04",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 480, ginior: 560 }, gaz: 300,
    zones: { mtl: { fiches: 6, kg: 24820 }, lav: { fiches: 2, kg: 8560 } }
  },
  { weekStart:"2025-04-07", weekEnd:"2025-04-11",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 600, ginior: 700 }, gaz: 400,
    zones: { mtl: { fiches: 4, kg: 16560 }, lav: { fiches: 6, kg: 26590 } }
  },
  { weekStart:"2025-04-14", weekEnd:"2025-04-18",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 540, ginior: 630 }, gaz: 400,
    zones: { mtl: { fiches: 2, kg: 8330 }, lav: { fiches: 6, kg: 29470 } }
  },
  { weekStart:"2025-04-21", weekEnd:"2025-04-25",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 900, ginior: 1050 }, gaz: 400,
    zones: { mtl: { fiches: 8, kg: 32410 }, lav: { fiches: 7, kg: 28180 } }
  },
  // === MAI 2025 ===
  { weekStart:"2025-04-28", weekEnd:"2025-05-02",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 120, ginior: 140 }, gaz: 150,
    zones: { mtl: { fiches: 6, kg: 26170 }, lav: { fiches: 6, kg: 25780 } }
  },
  { weekStart:"2025-05-05", weekEnd:"2025-05-09",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 780, ginior: 375 }, gaz: 400,
    // Note: pay format changed - Jeff 65x12, Ginior 75x5 then 70x5=350+375=725
    zones: { mtl: { fiches: 5, kg: 21260 }, lav: { fiches: 7, kg: 29660 } }
  },
  { weekStart:"2025-05-12", weekEnd:"2025-05-16",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 780, ginior: 375 }, gaz: 250,
    zones: { mtl: { fiches: 5, kg: 20670 }, lav: { fiches: 6, kg: 24940 } }
  },
  { weekStart:"2025-05-19", weekEnd:"2025-05-23",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 650, ginior: 525 }, gaz: 100,
    zones: { mtl: { fiches: 7, kg: 30540 }, lav: { fiches: 4, kg: 17090 } }
  },
  { weekStart:"2025-05-26", weekEnd:"2025-05-30",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","FF"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 520, ginior: 570 }, gaz: 150,
    // Fanfan appeared on Mercredi as substitute
    zones: { mtl: { fiches: 3, kg: 13090 }, lav: { fiches: 6, kg: 26030 } }
  },
  // === JUIN 2025 (First part: Jeff+Ginior, then Ceres+Fanfan take over) ===
  { weekStart:"2025-06-02", weekEnd:"2025-06-06",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 720, ginior: 490 }, gaz: 337,
    zones: { mtl: { fiches: 4, kg: 17360 }, lav: { fiches: 6, kg: 26090 } }
  },
  { weekStart:"2025-06-09", weekEnd:"2025-06-13",
    staff: { lun:["JJ","CE","FF"], mar:["JJ","CE","FF"], mer:["JJ","CE","FF"], jeu:["JJ","CE","FF"], ven:["JJ","CE","FF"] },
    pay: { ceres: 690, fanfan: 460 }, gaz: 350,
    zones: { mtl: { fiches: 5, kg: 21400 }, lav: { fiches: 8, kg: 35220 } }
  },
  { weekStart:"2025-06-16", weekEnd:"2025-06-20",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { ginior: 925, jeff: 845 }, gaz: 300,
    zones: { mtl: { fiches: 3, kg: 12810 }, lav: { fiches: 9, kg: 39390 } }
  },
  { weekStart:"2025-06-23", weekEnd:"2025-06-27",
    staff: { lun:["JJ","CE","FF"], mar:["JJ","CE","FF"], mer:["JJ","CE","FF"], jeu:["JJ","CE","FF"], ven:["JJ","CE","FF"] },
    pay: { ceres: 765, fanfan: 510 }, gaz: 485,
    zones: { mtl: { fiches: 5, kg: 17590 }, lav: { fiches: 5, kg: 26160 } }
  },
  // === JUILLET 2025 ===
  { weekStart:"2025-06-30", weekEnd:"2025-07-04",
    staff: { lun:["JJ","CE","FF"], mar:["JJ","CE","FF"], mer:["JJ","CE","FF"], jeu:["JJ","CE","FF"], ven:["JJ","CE","FF"] },
    pay: { ceres: 330, fanfan: 230 }, gaz: 100,
    zones: { mtl: { fiches: 3, kg: 12940 }, lav: { fiches: 5, kg: 20680 } }
  },
  { weekStart:"2025-07-14", weekEnd:"2025-07-18",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 780, ginior: 300 }, gaz: 350,
    zones: { mtl: { fiches: 4, kg: 17680 }, lav: { fiches: 8, kg: 34020 } }
  },
  // === AOUT 2025 ===
  { weekStart:"2025-08-04", weekEnd:"2025-08-08",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 975, ginior: 770 }, gaz: 300,
    zones: { mtl: { fiches: 4, kg: 15380 }, lav: { fiches: 11, kg: 44540 } }
  },
  { weekStart:"2025-08-11", weekEnd:"2025-08-15",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 325, ginior: 375 }, gaz: 150,
    zones: { mtl: { fiches: 5, kg: 20210 }, lav: null }
  },
  { weekStart:"2025-08-18", weekEnd:"2025-08-22",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 650, ginior: 725 }, gaz: 300,
    zones: { mtl: { fiches: 5, kg: 20820 }, lav: { fiches: 5, kg: 22680 } }
  },
  { weekStart:"2025-08-25", weekEnd:"2025-08-29",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 650, ginior: 725 }, gaz: 300,
    zones: { mtl: { fiches: 5, kg: 20790 }, lav: { fiches: 5, kg: 20620 } }
  },
  // === SEPTEMBRE 2025 ===
  { weekStart:"2025-09-01", weekEnd:"2025-09-05",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 520, ginior: 570 }, gaz: 300,
    zones: { mtl: { fiches: 2, kg: 8360 }, lav: { fiches: 6, kg: 21390 } }
  },
  { weekStart:"2025-09-08", weekEnd:"2025-09-12",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 650, ginior: 720 }, gaz: 150,
    zones: { mtl: { fiches: 4, kg: 16330 }, lav: { fiches: 0, kg: 24420 } }
  },
  { weekStart:"2025-09-15", weekEnd:"2025-09-19",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 650, ginior: 720 }, gaz: 150,
    zones: { mtl: { fiches: 4, kg: 15420 }, lav: { fiches: 6, kg: 24560 } }
  },
  { weekStart:"2025-09-22", weekEnd:"2025-09-26",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 585, ginior: 150 }, gaz: 150,
    // Jeff line: 9 x 65 = 455 = 585 (corrected), Ginior: 2 x 75 = 150
    zones: { mtl: { fiches: 4, kg: 17110 }, lav: { fiches: 6, kg: 24920 } }
  },
  // === OCTOBRE 2025 ===
  { weekStart:"2025-09-29", weekEnd:"2025-10-03",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 660, ginior: 725 }, gaz: 350,
    zones: { mtl: { fiches: 3, kg: 12120 }, lav: { fiches: 7, kg: 27880 } }
  },
  { weekStart:"2025-10-06", weekEnd:"2025-10-10",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 715, ginior: 300 }, gaz: 200,
    zones: { mtl: { fiches: 4, kg: 17420 }, lav: { fiches: 7, kg: 32240 } }
  },
  { weekStart:"2025-10-13", weekEnd:"2025-10-17",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 520, ginior: 0 }, gaz: 177,
    zones: { mtl: null, lav: { fiches: 8, kg: 34950 } }
  },
  { weekStart:"2025-10-20", weekEnd:"2025-10-24",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 910, ginior: 375 }, gaz: 0,
    zones: { mtl: { fiches: 5, kg: 21650 }, lav: { fiches: 9, kg: 39120 } }
  },
  { weekStart:"2025-10-27", weekEnd:"2025-10-31",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 1105, ginior: 450 }, gaz: 327,
    zones: { mtl: { fiches: 6, kg: 26310 }, lav: { fiches: 11, kg: 47840 } }
  },
  // === NOVEMBRE 2025 ===
  { weekStart:"2025-11-03", weekEnd:"2025-11-07",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 780, ginior: 725 }, gaz: 0,
    zones: { mtl: { fiches: 1, kg: 4370 }, lav: { fiches: 11, kg: 48080 } }
  },
  { weekStart:"2025-11-10", weekEnd:"2025-11-14",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 585, ginior: 150 }, gaz: 0,
    zones: { mtl: { fiches: 2, kg: 9020 }, lav: { fiches: 5, kg: 21280 } }
  },
  { weekStart:"2025-11-17", weekEnd:"2025-11-21",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 1235, ginior: 225 }, gaz: 0,
    zones: { mtl: { fiches: 3, kg: 15580 }, lav: { fiches: 17, kg: 83260 } }
  },
  { weekStart:"2025-11-24", weekEnd:"2025-11-28",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 845, ginior: 525 }, gaz: 0,
    zones: { mtl: { fiches: 7, kg: 32420 }, lav: { fiches: 6, kg: 28660 } }
  },
  // === DECEMBRE 2025 ===
  { weekStart:"2025-12-01", weekEnd:"2025-12-04",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 1105, ginior: 1360 }, gaz: 0,
    zones: { mtl: { fiches: 2, kg: 8870 }, lav: { fiches: 15, kg: 69720 } }
  },
  { weekStart:"2025-12-08", weekEnd:"2025-12-12",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 1040, ginior: 1280 }, gaz: 0,
    zones: { mtl: { fiches: 6, kg: 28040 }, lav: { fiches: 10, kg: 45310 } }
  },
  { weekStart:"2025-12-15", weekEnd:"2025-12-19",
    staff: { lun:["JJ","JF","GI"], mar:["JJ","JF","GI"], mer:["JJ","JF","GI"], jeu:["JJ","JF","GI"], ven:["JJ","JF","GI"] },
    pay: { jeff: 1170, ginior: 1440 }, gaz: 0,
    zones: { mtl: { fiches: 7, kg: 33650 }, lav: { fiches: 11, kg: 53110 } }
  },
];

// Map staff abbreviations to employee IDs
const STAFF_MAP = {
  "JJ": "c1",  // Jean Junior - Chauffeur
  "JF": "c2",  // Jeff - Helper
  "GI": "c5",  // Ginior - Helper
  "CE": "c3",  // Ceres - Chauffeur 2
  "FF": "c4",  // Fanfan - Helper 2
};

// Generate voyages: one voyage entry per day with all trips
const voyages = [];
const DAYS = ["lun","mar","mer","jeu","ven"];
const DAY_OFFSETS = { lun:0, mar:1, mer:2, jeu:3, ven:4 };
const TARE = 4710; // default tare weight

weeklyData.forEach(wk => {
  const startDate = new Date(wk.weekStart + "T12:00:00");

  // Determine total trips per zone for the week
  const mtlTotal = wk.zones.mtl ? wk.zones.mtl.fiches : 0;
  const lavTotal = wk.zones.lav ? wk.zones.lav.fiches : 0;
  const mtlKgTotal = wk.zones.mtl ? wk.zones.mtl.kg : 0;
  const lavKgTotal = wk.zones.lav ? wk.zones.lav.kg : 0;

  // Count working days
  const workDays = DAYS.filter(d => wk.staff[d] && wk.staff[d].length > 0);
  const numDays = workDays.length;
  if (numDays === 0) return;

  // Distribute trips evenly across days (not perfectly accurate but reasonable)
  const mtlPerDay = mtlTotal > 0 ? Math.max(1, Math.round(mtlTotal / numDays)) : 0;
  const lavPerDay = lavTotal > 0 ? Math.max(1, Math.round(lavTotal / numDays)) : 0;
  const mtlKgPerTrip = mtlTotal > 0 ? Math.round(mtlKgTotal / mtlTotal) : 0;
  const lavKgPerTrip = lavTotal > 0 ? Math.round(lavKgTotal / lavTotal) : 0;

  let mtlRemaining = mtlTotal;
  let lavRemaining = lavTotal;

  workDays.forEach((day, idx) => {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + DAY_OFFSETS[day]);
    const dateStr = dayDate.toISOString().split("T")[0];

    const staffIds = wk.staff[day].map(s => STAFF_MAP[s]);
    const chauffeur = staffIds[0]; // First person is chauffeur
    const helpers = staffIds.slice(1); // Rest are helpers

    const trips = [];

    // MTL trips for this day
    const isLastDay = idx === workDays.length - 1;
    const mtlToday = isLastDay ? mtlRemaining : Math.min(mtlPerDay, mtlRemaining);
    if (mtlToday > 0) {
      for (let t = 0; t < mtlToday; t++) {
        trips.push({
          id: uid(),
          zone: "06",
          nbVoyages: 1,
          poidsChaj: mtlKgPerTrip + TARE,
          dt: ""
        });
      }
      mtlRemaining -= mtlToday;
    }

    // LAV trips for this day
    const lavToday = isLastDay ? lavRemaining : Math.min(lavPerDay, lavRemaining);
    if (lavToday > 0) {
      for (let t = 0; t < lavToday; t++) {
        trips.push({
          id: uid(),
          zone: "13",
          nbVoyages: 1,
          poidsChaj: lavKgPerTrip + TARE,
          dt: ""
        });
      }
      lavRemaining -= lavToday;
    }

    if (trips.length > 0) {
      voyages.push({
        id: uid(),
        date: dateStr,
        "chofè": chauffeur,
        helpers: helpers,
        trips: trips
      });
    }
  });
});

// Generate gas expenses
const depenses = [];
weeklyData.forEach(wk => {
  if (wk.gaz && wk.gaz > 0) {
    // Put gas expense on first day of the week
    depenses.push({
      id: uid(),
      date: wk.weekStart,
      categorie: "Essence",
      description: "Diesel",
      montant: wk.gaz
    });
  }
});

console.log(`Generated ${voyages.length} voyage entries`);
console.log(`Generated ${depenses.length} gas expense entries`);
console.log(`New chauffeurs: ${newChauffeurs.map(c => c.nom).join(", ")}`);

// Save to files
const output = { voyages, depenses, newChauffeurs };
fs.writeFileSync('./employees-2025-data.json', JSON.stringify(output));
console.log('Written employees-2025-data.json');

// Also update seed data files
const seedPath = './netlify/functions/seed-admin-data.json';
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// Add new chauffeurs (avoid duplicates)
const existingIds = new Set((seed.chauffeurs || []).map(c => c.id));
newChauffeurs.forEach(nc => {
  if (!existingIds.has(nc.id)) {
    seed.chauffeurs.push(nc);
  }
});

// Add 2025 voyages (remove any existing 2025 voyages first)
const existing2026Voyages = (seed.voyages || []).filter(v => v.date >= "2026-01-01");
seed.voyages = [...voyages, ...existing2026Voyages];

// Add 2025 gas expenses (remove any existing 2025 gas expenses first)
const existing2026Depenses = (seed.depenses || []).filter(d => d.date >= "2026-01-01");
seed.depenses = [...depenses, ...existing2026Depenses];

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));
console.log(`Seed updated: ${seed.chauffeurs.length} chauffeurs, ${seed.voyages.length} voyages, ${seed.depenses.length} depenses`);

// Also update render seed
const renderSeedPath = './seed-admin-data.json';
if (fs.existsSync(renderSeedPath)) {
  const rSeed = JSON.parse(fs.readFileSync(renderSeedPath, 'utf8'));
  const rExistingIds = new Set((rSeed.chauffeurs || []).map(c => c.id));
  newChauffeurs.forEach(nc => { if (!rExistingIds.has(nc.id)) rSeed.chauffeurs.push(nc); });
  const r2026V = (rSeed.voyages || []).filter(v => v.date >= "2026-01-01");
  rSeed.voyages = [...voyages, ...r2026V];
  const r2026D = (rSeed.depenses || []).filter(d => d.date >= "2026-01-01");
  rSeed.depenses = [...depenses, ...r2026D];
  fs.writeFileSync(renderSeedPath, JSON.stringify(rSeed, null, 2));
  console.log(`Render seed also updated: ${rSeed.voyages.length} voyages`);
}

console.log('\nDone! Employee data for 2025 ready.');
