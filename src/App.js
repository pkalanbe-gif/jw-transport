import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
const gid=()=>Math.random().toString(36).substr(2,9);
const toL=d=>{const dt=new Date(d);return`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;};
const fD=d=>d?new Date(d+"T12:00:00").toLocaleDateString("fr-CA",{day:"numeric",month:"short",year:"numeric"}):"";
const fDs=d=>d?new Date(d+"T12:00:00").toLocaleDateString("fr-CA",{day:"numeric",month:"short"}):"";
const fN=n=>{const v=new Intl.NumberFormat("fr-CA",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(n||0));return(n<0?"−":"")+v;};
const fM=n=>fN(n)+" $ CAD";const today=()=>toL(new Date());
const DEF_TARE=4560,RM=0.09,RL=0.07,TPS_R=0.05,TVQ_R=0.09975;
const ZONES=[{v:"06",l:"06 — Montréal",rate:RM},{v:"13",l:"13 — Laval",rate:RL}];
const ZR={"06":RM,"13":RL};const ZM={"06":"MTL","13":"LAV"};
const JRS=["Lundi","Mardi","Mercredi","Jeudi","Vendredi"];
const DCATS=["Essence","Diesel","Entretien","Assurance","Péage","Réparation","Fournitures","Immatriculation","Permis/SAAQ","Stationnement","Lavage camion","Téléphone","Internet","Loyer/Bureau","Comptabilité","Frais bancaire","Intérêts emprunt","Amortissement","Publicité","Nourriture/Repas","Formation","Équipement","Location équip.","Sous-traitance","Salaires","CNESST","Déneigement","Uniforme/Vêtement","Outil","Logiciel/App","Autre"];
const DCOLORS={"Essence":"#f59e0b","Diesel":"#f97316","Entretien":"#3b82f6","Assurance":"#8b5cf6","Péage":"#06b6d4","Réparation":"#ef4444","Fournitures":"#22c55e","Immatriculation":"#a855f7","Permis/SAAQ":"#7c3aed","Stationnement":"#64748b","Lavage camion":"#0ea5e9","Téléphone":"#14b8a6","Internet":"#0d9488","Loyer/Bureau":"#6366f1","Comptabilité":"#8b5cf6","Frais bancaire":"#9ca3af","Intérêts emprunt":"#ef4444","Amortissement":"#64748b","Publicité":"#ec4899","Nourriture/Repas":"#f43f5e","Formation":"#10b981","Équipement":"#3b82f6","Location équip.":"#0284c7","Sous-traitance":"#f59e0b","Salaires":"#22c55e","CNESST":"#a855f7","Déneigement":"#7dd3fc","Uniforme/Vêtement":"#d946ef","Outil":"#78716c","Logiciel/App":"#6366f1","Autre":"#ec4899"};
const TAX_INFO={"Essence":"✅ 100% déductible","Diesel":"✅ 100% déductible","Entretien":"✅ 100% déductible","Assurance":"✅ 100% déductible (véhicule commercial)","Péage":"✅ 100% déductible","Réparation":"✅ 100% déductible","Fournitures":"✅ 100% déductible","Immatriculation":"✅ 100% déductible","Permis/SAAQ":"✅ 100% déductible","Stationnement":"✅ 100% déductible (travail)","Lavage camion":"✅ 100% déductible","Téléphone":"✅ % usage commercial","Internet":"✅ % usage commercial","Loyer/Bureau":"✅ % usage commercial","Comptabilité":"✅ 100% déductible","Frais bancaire":"✅ 100% déductible","Intérêts emprunt":"✅ 100% déductible (véhicule commercial)","Amortissement":"✅ DPA selon catégorie","Publicité":"✅ 100% déductible","Nourriture/Repas":"⚠️ 50% déductible (longue distance)","Formation":"✅ 100% déductible","Équipement":"✅ DPA ou 100% si <1500$","Location équip.":"✅ 100% déductible","Sous-traitance":"✅ 100% déductible","Salaires":"✅ 100% déductible","CNESST":"✅ 100% déductible","Déneigement":"✅ 100% déductible","Uniforme/Vêtement":"✅ 100% déductible (logo/sécurité)","Outil":"✅ 100% déductible","Logiciel/App":"✅ 100% déductible","Autre":"⚠️ Selon nature"};
const C={bg:"#0a0e1a",card:"#111827",card2:"#1a2236",border:"#1e293b",accent:"#6366f1",accentL:"#818cf8",green:"#22c55e",red:"#ef4444",orange:"#f59e0b",purple:"#a855f7",cyan:"#06b6d4",text:"#f1f5f9",muted:"#94a3b8",dim:"#475569",g1:"linear-gradient(135deg,#6366f1,#8b5cf6)",g2:"linear-gradient(135deg,#22c55e,#06b6d4)",g3:"linear-gradient(135deg,#f59e0b,#ef4444)",g4:"linear-gradient(135deg,#3b82f6,#6366f1)"};
const def={chauffeurs:[],voyages:[],depenses:[],factures:[],clients:[],vehicules:[],entretiens:[],settings:{tauxChauffeur:80,tauxHelper:65,tare:DEF_TARE,tpsNum:"",tvqNum:"",entreprise:{nom:"J&W Transport",adresse:"",ville:"",telephone:"",courriel:"",neq:""},payrollSchedule:{frequency:"weekly",payDelay:2,payDay:5}}};
const ADMIN_DATA={chauffeurs:[{id:"c1",nom:"Brain Jean Ginior",role:"Chauffeur",aktif:true,courriel:"bainjunior2020@gmail.com"},{id:"c2",nom:"Djeph Alexandre",role:"Helper",aktif:true,courriel:"djephalexandre697@gmail.com"}],voyages:[{"id":"e6ax27dqb","date":"2026-01-06","chofè":"c1","helpers":["c2"],"trips":[{"id":"48azewten","zone":"13","nbVoyages":1,"poidsChaj":8820,"dt":"80081991"},{"id":"fkgveot0a","zone":"06","nbVoyages":1,"poidsChaj":9630,"dt":"80082006"},{"id":"6v047lbsr","zone":"06","nbVoyages":1,"poidsChaj":8890,"dt":"80082014"},{"id":"6cmhk1pjl","zone":"06","nbVoyages":1,"poidsChaj":9640,"dt":"80082026"}]},{"id":"j6aq7pvqk","date":"2026-01-07","chofè":"c1","helpers":["c2"],"trips":[{"id":"v2clkt6sd","zone":"13","nbVoyages":1,"poidsChaj":9660,"dt":"80082057"},{"id":"3eizy45fm","zone":"13","nbVoyages":1,"poidsChaj":9400,"dt":"80082065"},{"id":"lutlwglcu","zone":"06","nbVoyages":1,"poidsChaj":9090,"dt":"80082091"}]},{"id":"31kwyzdsn","date":"2026-01-08","chofè":"c1","helpers":["c2"],"trips":[{"id":"3bfyftwt0","zone":"13","nbVoyages":1,"poidsChaj":9010,"dt":"80082162"},{"id":"pd347ofos","zone":"06","nbVoyages":1,"poidsChaj":9320,"dt":"80082111"},{"id":"mvhckk16c","zone":"06","nbVoyages":1,"poidsChaj":9040,"dt":"80082128"}]},{"id":"fqe3xs2r7","date":"2026-01-09","chofè":"c1","helpers":["c2"],"trips":[{"id":"bhcovuifh","zone":"13","nbVoyages":1,"poidsChaj":9950,"dt":"80082166"},{"id":"a6fbg1yez","zone":"13","nbVoyages":1,"poidsChaj":9490,"dt":"80082171"},{"id":"d7azls8kt","zone":"13","nbVoyages":1,"poidsChaj":9740,"dt":"80082159"},{"id":"ay93r96f2","zone":"13","nbVoyages":1,"poidsChaj":9350,"dt":"80082154"}]},{"id":"2grd5mlgh","date":"2026-02-09","chofè":"c1","helpers":["c2"],"trips":[{"id":"0smpl48de","zone":"06","nbVoyages":1,"poidsChaj":9580,"dt":"80083154"},{"id":"0z96khprn","zone":"13","nbVoyages":1,"poidsChaj":9590,"dt":"80083161"}]},{"id":"nc78r3k2h","date":"2026-02-10","chofè":"c1","helpers":["c2"],"trips":[{"id":"ynzde93gx","zone":"13","nbVoyages":1,"poidsChaj":8610,"dt":"80083211"},{"id":"nncuxyz5n","zone":"13","nbVoyages":1,"poidsChaj":9240,"dt":"80083221"}]},{"id":"ky8w36qbn","date":"2026-02-11","chofè":"c1","helpers":["c2"],"trips":[{"id":"s19lb1bc4","zone":"13","nbVoyages":1,"poidsChaj":9400,"dt":"80083254"},{"id":"g05k7v0xz","zone":"13","nbVoyages":1,"poidsChaj":9110,"dt":"80083260"}]},{"id":"5zv224wvo","date":"2026-01-12","chofè":"c1","helpers":["c2"],"trips":[{"id":"jxeadfp0r","zone":"13","nbVoyages":1,"poidsChaj":10660,"dt":"80082208"},{"id":"y2jqwidh3","zone":"06","nbVoyages":1,"poidsChaj":8990,"dt":"80082996"}]},{"id":"0xn57vlt9","date":"2026-01-13","chofè":"c1","helpers":["c2"],"trips":[{"id":"alc6036bp","zone":"13","nbVoyages":1,"poidsChaj":8930,"dt":"80082245"},{"id":"jt0e6r5v8","zone":"13","nbVoyages":1,"poidsChaj":8750,"dt":"80082259"},{"id":"0k0iqhk43","zone":"06","nbVoyages":1,"poidsChaj":8640,"dt":"80082268"},{"id":"xuzor6rw6","zone":"13","nbVoyages":1,"poidsChaj":8670,"dt":"80082280"},{"id":"76m2x6h8h","zone":"13","nbVoyages":1,"poidsChaj":9040,"dt":"80082301"}]},{"id":"kb2iadjwt","date":"2026-01-14","chofè":"c1","helpers":["c2"],"trips":[{"id":"q8wkfa7jz","zone":"13","nbVoyages":1,"poidsChaj":8790,"dt":"80062315"},{"id":"4tjvg802n","zone":"13","nbVoyages":1,"poidsChaj":8770,"dt":"80082322"},{"id":"pl7hm7cya","zone":"06","nbVoyages":1,"poidsChaj":9070,"dt":"80082334"},{"id":"x4rsrmuw8","zone":"13","nbVoyages":1,"poidsChaj":9300,"dt":"80082345"}]},{"id":"n6umuepb9","date":"2026-01-15","chofè":"c1","helpers":["c2"],"trips":[{"id":"vhm1zinw7","zone":"13","nbVoyages":1,"poidsChaj":9360,"dt":"80082369"},{"id":"yzph4o7ea","zone":"06","nbVoyages":1,"poidsChaj":9010,"dt":"80082387"},{"id":"xwrkty7j9","zone":"13","nbVoyages":1,"poidsChaj":8660,"dt":"80082395"}]},{"id":"1v5y77icz","date":"2026-01-19","chofè":"c1","helpers":["c2"],"trips":[{"id":"nyuvxi73x","zone":"13","nbVoyages":1,"poidsChaj":9320,"dt":"80082468"},{"id":"g2lqhq615","zone":"13","nbVoyages":1,"poidsChaj":9230,"dt":"80082482"},{"id":"81hj9s1zl","zone":"13","nbVoyages":1,"poidsChaj":9780,"dt":"80082461"}]},{"id":"yz0r60sfq","date":"2026-01-20","chofè":"c1","helpers":["c2"],"trips":[{"id":"b7hgtoyfe","zone":"13","nbVoyages":1,"poidsChaj":9500,"dt":"80082501"},{"id":"kabomeh29","zone":"13","nbVoyages":1,"poidsChaj":9110,"dt":"80082510"},{"id":"8sei2kjgh","zone":"06","nbVoyages":1,"poidsChaj":9510,"dt":"80082521"}]},{"id":"0l6bu7a9y","date":"2026-01-21","chofè":"c1","helpers":["c2"],"trips":[{"id":"rqyo7tg2w","zone":"13","nbVoyages":1,"poidsChaj":9660,"dt":"80082547"},{"id":"9wc95hqk9","zone":"13","nbVoyages":1,"poidsChaj":9300,"dt":"80082557"},{"id":"q51fd029k","zone":"06","nbVoyages":1,"poidsChaj":9270,"dt":"80082565"},{"id":"uj2tv7ydd","zone":"06","nbVoyages":1,"poidsChaj":8860,"dt":"80082591"}]},{"id":"20947r23w","date":"2026-01-22","chofè":"c1","helpers":["c2"],"trips":[{"id":"vny9uga7m","zone":"13","nbVoyages":1,"poidsChaj":9330,"dt":"80082604"},{"id":"odh17nv7p","zone":"13","nbVoyages":1,"poidsChaj":8990,"dt":"80082615"},{"id":"yaxm07ew8","zone":"13","nbVoyages":1,"poidsChaj":8620,"dt":"80082634"},{"id":"hfrrex50t","zone":"13","nbVoyages":1,"poidsChaj":9450,"dt":"80082638"}]},{"id":"kcvwaej8n","date":"2026-01-23","chofè":"c1","helpers":["c2"],"trips":[{"id":"umi0wukhb","zone":"13","nbVoyages":1,"poidsChaj":9480,"dt":"80082668"},{"id":"m80c878rb","zone":"06","nbVoyages":1,"poidsChaj":9710,"dt":"80082678"},{"id":"r1k14dr21","zone":"13","nbVoyages":1,"poidsChaj":9230,"dt":"80082685"}]},{"id":"jmupwgxvw","date":"2026-01-26","chofè":"c1","helpers":["c2"],"trips":[{"id":"a8lhzeem6","zone":"13","nbVoyages":1,"poidsChaj":9370,"dt":"80082706"},{"id":"mydlmxe2i","zone":"13","nbVoyages":1,"poidsChaj":9490,"dt":"80082712"}]},{"id":"ri3serni0","date":"2026-01-27","chofè":"c1","helpers":["c2"],"trips":[{"id":"0rs6fjwz4","zone":"13","nbVoyages":1,"poidsChaj":9470,"dt":"80082751"},{"id":"s7sn3um7q","zone":"13","nbVoyages":1,"poidsChaj":8860,"dt":"80082767"}]},{"id":"c1ldyqgj8","date":"2026-01-28","chofè":"c1","helpers":["c2"],"trips":[{"id":"ps1n3i701","zone":"13","nbVoyages":1,"poidsChaj":9260,"dt":"80082796"},{"id":"garz8tzsk","zone":"06","nbVoyages":1,"poidsChaj":9210,"dt":"80082811"},{"id":"z7qvgs6g7","zone":"13","nbVoyages":1,"poidsChaj":9180,"dt":"80082831"}]},{"id":"s5jadpp51","date":"2026-01-29","chofè":"c1","helpers":["c2"],"trips":[{"id":"65onpfsh9","zone":"13","nbVoyages":1,"poidsChaj":9120,"dt":"80082847"},{"id":"6pxip2by2","zone":"13","nbVoyages":1,"poidsChaj":9300,"dt":"80082862"},{"id":"uvasz9crv","zone":"13","nbVoyages":1,"poidsChaj":9380,"dt":"80082878"}]},{"id":"9kuf4c38b","date":"2026-01-30","chofè":"c1","helpers":["c2"],"trips":[{"id":"yv3z7zhc9","zone":"13","nbVoyages":1,"poidsChaj":9300,"dt":"80082892"},{"id":"6jb29vfev","zone":"06","nbVoyages":1,"poidsChaj":9600,"dt":"80082894"},{"id":"euzqw0siw","zone":"06","nbVoyages":1,"poidsChaj":9490,"dt":"80082905"},{"id":"6se8ry425","zone":"06","nbVoyages":1,"poidsChaj":9330,"dt":"80082909"}]},{"id":"tzw0vkpa9","date":"2026-02-02","chofè":"c1","helpers":["c2"],"trips":[{"id":"v8dlg5xdr","zone":"13","nbVoyages":1,"poidsChaj":9200,"dt":"80082929"},{"id":"r1irm9igd","zone":"13","nbVoyages":1,"poidsChaj":9470,"dt":"80082933"},{"id":"1mhd15yjo","zone":"13","nbVoyages":1,"poidsChaj":9450,"dt":"80082937"},{"id":"g2to0wd4n","zone":"06","nbVoyages":1,"poidsChaj":9030,"dt":"80082949"}]},{"id":"ogih8nmid","date":"2026-02-03","chofè":"c1","helpers":["c2"],"trips":[{"id":"4zzpy6g69","zone":"13","nbVoyages":1,"poidsChaj":9150,"dt":"80082972"},{"id":"alsit5aza","zone":"13","nbVoyages":1,"poidsChaj":9150,"dt":"80082980"},{"id":"tpoip4qmj","zone":"06","nbVoyages":1,"poidsChaj":9350,"dt":"80082966"}]},{"id":"qf0rlcg62","date":"2026-02-04","chofè":"c1","helpers":["c2"],"trips":[{"id":"hvjk7gjl7","zone":"13","nbVoyages":1,"poidsChaj":9360,"dt":"80083024"},{"id":"wq41sd7tg","zone":"06","nbVoyages":1,"poidsChaj":9510,"dt":"80083042"}]},{"id":"vbzmmjmcl","date":"2026-02-05","chofè":"c1","helpers":["c2"],"trips":[{"id":"lzb6iuwqt","zone":"13","nbVoyages":1,"poidsChaj":9200,"dt":"80083076"},{"id":"dp2rd849p","zone":"13","nbVoyages":1,"poidsChaj":8920,"dt":"80083084"},{"id":"53otd2nmi","zone":"06","nbVoyages":1,"poidsChaj":9040,"dt":"80083092"}]},{"id":"chp6jhbq4","date":"2026-02-06","chofè":"c1","helpers":["c2"],"trips":[{"id":"nogv3x2if","zone":"13","nbVoyages":1,"poidsChaj":9370,"dt":"80083124"},{"id":"uh444dt80","zone":"06","nbVoyages":1,"poidsChaj":9510,"dt":"80083135"},{"id":"0amzvypmk","zone":"06","nbVoyages":1,"poidsChaj":9750,"dt":"80083142"}]},{"id":"pn0s92c8o","date":"2026-02-12","chofè":"c1","helpers":["c2"],"trips":[{"id":"pob90gd31","zone":"13","nbVoyages":1,"poidsChaj":9160,"dt":"80083300"},{"id":"1z0sz4zgl","zone":"13","nbVoyages":1,"poidsChaj":9440,"dt":"80083291"}]},{"id":"vibc49g36","date":"2026-02-13","chofè":"c1","helpers":["c2"],"trips":[{"id":"4uauylgde","zone":"06","nbVoyages":1,"poidsChaj":9340,"dt":"80083359"},{"id":"ltqzp7b33","zone":"06","nbVoyages":1,"poidsChaj":9740,"dt":"80083367"}]}],depenses:[{"id":"k03y0dcxc","date":"2026-02-24","categorie":"Assurance","description":"Auto","montant":189},{"id":"gvpq9s5s0","date":"2026-02-12","categorie":"Assurance","description":"Camion","montant":671},{"id":"lezu8n584","date":"2026-02-12","categorie":"Autre","description":"Nourriture","montant":41.45},{"id":"h9yqtmwy1","date":"2026-02-12","categorie":"Autre","description":"Nourriture","montant":16.54},{"id":"5nmmu963s","date":"2026-02-11","categorie":"Essence","description":"Diesel","montant":608},{"id":"djfr7ftm2","date":"2026-02-10","categorie":"Autre","description":"Nourriture","montant":15.78},{"id":"dtlpv3f97","date":"2026-02-10","categorie":"Autre","description":"Nourriture","montant":40.33},{"id":"hvqd26y7x","date":"2026-02-09","categorie":"Essence","description":"Ordinaire","montant":50},{"id":"tgijw2slm","date":"2026-02-06","categorie":"Autre","description":"Nourriture","montant":28.75},{"id":"hhhni6sts","date":"2026-02-04","categorie":"Essence","description":"Diesel","montant":453},{"id":"b476bkrne","date":"2026-02-03","categorie":"Essence","description":"Ordinaire","montant":50},{"id":"huolgz1qs","date":"2026-02-03","categorie":"Autre","description":"Nourriture","montant":12.57},{"id":"m3vd5rrp4","date":"2026-02-03","categorie":"Autre","description":"Nourriture","montant":12.75},{"id":"77qe32cdt","date":"2026-01-29","categorie":"Essence","description":"Ordinaire","montant":70},{"id":"2r9gh2cof","date":"2026-01-29","categorie":"Essence","description":"Ordinaire","montant":54.09},{"id":"emavd14nn","date":"2026-01-28","categorie":"Essence","description":"Diesel","montant":403},{"id":"ou2zd2lbp","date":"2026-01-26","categorie":"Essence","description":"Ordinaire","montant":50},{"id":"0nthh7x1f","date":"2026-01-24","categorie":"Essence","description":"Ordinaire","montant":50},{"id":"y3zqoqnmd","date":"2026-01-23","categorie":"Assurance","description":"Auto","montant":189},{"id":"1wuvaqzlb","date":"2026-01-21","categorie":"Essence","description":"Diesel","montant":700},{"id":"vx4189ok0","date":"2026-01-14","categorie":"Essence","description":"Diesel","montant":205},{"id":"pe9p0ook1","date":"2026-01-12","categorie":"Assurance","description":"Camion","montant":671},{"id":"kl73u3dnt","date":"2026-01-07","categorie":"Essence","description":"Diesel","montant":227},{"id":"1ck4nzn1k","date":"2026-01-06","categorie":"Autre","description":"Nourriture Dominos Pizza","montant":45.37}],factures:[{"id":"boipjj630","clientId":"2fmamuwhq","date":"2026-02-02","dateLimite":"2026-02-13","periode":"02-02-2026 au 06-02-2026","details":[{"id":"fnc661uad","zone":"06","description":"Nbre de fiches livrés a Montréal : 6","quantite":"28830","unite":"kg","prixUnitaire":"0.09","dt":"\nLundi : 80082949\nMardi : 80082966\nMercredi : 80083042\nJeudi : 80083092\nVendredi : 80083135 ; 80083142"},{"id":"pzwsds13w","zone":"13","description":"Nbre de fiches livrés a Laval : 9","quantite":"42230","unite":"kg","prixUnitaire":"0.07","dt":"\nLundi : 80082929 ; 80082933 ; 80082937\nMardi : 80082972 ; 80082980\nMercredi : 80083024\nJeudi : 80083076 ; 80083084\nVendredi : 80083124"}],"avecTPS":true,"avecTVQ":true,"statut":"Envoyée","numero":"FAC-001","sousTotal":5550.8,"tps":277.54,"tvq":553.69,"total":6382.03},{"id":"acmmq6ynh","clientId":"2fmamuwhq","date":"2026-02-13","dateLimite":"","periode":"9 févr. 2026 au 13 févr. 2026","details":[{"id":"trmo0q6ru","zone":"06","description":"Nbre fiches Montréal: 3","quantite":"14980","unite":"kg","prixUnitaire":"0.09","dt":"80083154\n80083359\n80083367"},{"id":"kuqg5kwbh","zone":"13","description":"Nbre fiches Laval: 7","quantite":"32630","unite":"kg","prixUnitaire":"0.07","dt":"80083161\n80083211\n80083221\n80083254\n80083260\n80083300\n80083291"}],"avecTPS":true,"avecTVQ":true,"statut":"Envoyée","numero":"FAC-002","sousTotal":3632.3,"tps":181.62,"tvq":362.32,"total":4176.24}],clients:[{"id":"2fmamuwhq","nom":"TRANSPORT PRIOLEX INC.","adresse":"8631 Rue Basswood #3","ville":"Montréal, QC, H8Y 1S7","telephone":"(438) 227-9752","courriel":"salespriolex@gmail.com"}],vehicules:[{"id":"e0jmtma1p","nom":"HINO 195_2018","plaque":"L860450","annee":"2018","km":"269315","statut":"Actif"},{"id":"c9789kzkw","nom":"HINO 195_2013","plaque":"L998841","annee":"2013","km":"","statut":"Actif"},{"id":"zkf6xh3kt","nom":"Toyota Matrix _2009","plaque":"ARD 30N","annee":"2009","km":"174000","statut":"Actif"}],entretiens:[{"id":"e2koveyyf","vehiculeId":"e0jmtma1p","date":"2026-01-31","type":"Huile","description":"Pan a huile - Gasket pan a huile - Filtre a huile - Litres huile a moteur - Main d'œuvre - Changement de courroie alternateur.","cout":1676.71,"km":"750000"},{"id":"j16f1efi9","vehiculeId":"e0jmtma1p","date":"2026-01-23","type":"Filtre","description":"x2 Filtre a fuel - filtre a air - injecteur cleaner","cout":530.08,"km":""},{"id":"20eslpr8v","vehiculeId":"e0jmtma1p","date":"2026-01-19","type":"Réparation","description":"Mirroir cote gauche","cout":294.32,"km":""},{"id":"2ahtn3yuj","vehiculeId":"e0jmtma1p","date":"2026-01-15","type":"Autre","description":"Terminal Cable de Batterie - Main d'œuvre - Suspension a Air ne fonctionne pas Réparer filage corroder","cout":174.08,"km":""}],settings:{tauxChauffeur:80,tauxHelper:65,tare:DEF_TARE,tpsNum:"745940213 RT0001",tvqNum:"4028093794 TQ0001",entreprise:{nom:"Jean Junior claudy Desroches (2278727070)",adresse:"11528 Ovide-Clermont",ville:"Montréal, QC, H1G 3Y8",telephone:"+1 (514) 706-1362",courriel:"jwtransportmtl@gmail.com",neq:"2278727070"}}};
const PRELOAD_USERS={"admin":{username:"admin",displayName:"admin",hash:"kz4vem",created:"2026-02-14"}};
const gMon=(d=new Date())=>{const dt=new Date(d);const dy=dt.getDay();dt.setDate(dt.getDate()-dy+(dy===0?-6:1));return toL(dt);};
const gWk=m=>JRS.map((_,i)=>{const d=new Date(m+"T12:00:00");d.setDate(d.getDate()+i);return toL(d);});
const getPayDate=(weekMon,settings)=>{const ps=settings?.payrollSchedule||{frequency:"weekly",payDelay:2,payDay:5};const fri=new Date(weekMon+"T12:00:00");fri.setDate(fri.getDate()+4);const pd=new Date(fri);pd.setDate(pd.getDate()+ps.payDelay*7);const cur=pd.getDay();const tgt=ps.payDay===7?0:ps.payDay;pd.setDate(pd.getDate()+(tgt-cur));return toL(pd);};
const getPayPeriods=(fromDate,count,settings,voyages)=>{const ps=settings?.payrollSchedule||{frequency:"weekly",payDelay:2,payDay:5};const step=ps.frequency==="biweekly"?14:7;const periods=[];const c=new Date(gMon(new Date(fromDate+"T12:00:00"))+"T12:00:00");c.setDate(c.getDate()-10*7);for(let i=0;i<count;i++){const wm=toL(c);const wd=gWk(wm);const pd=getPayDate(wm,settings);const wv=(voyages||[]).filter(v=>v.date>=wd[0]&&v.date<=wd[4]);const tv=wv.reduce((s,v)=>(v.trips||[]).reduce((s2,t)=>s2+(t.nbVoyages||0),s),0);periods.push({weekMon:wm,weekFri:wd[4],payDate:pd,trips:tv,voyages:wv});c.setDate(c.getDate()+step);}return periods;};
const JRSK=["","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const cTrip=(t,tare=DEF_TARE)=>{const pN=Math.max(0,(t.poidsChaj||0)-tare);const r=ZR[t.zone]||0;const rv=pN*r*(t.nbVoyages||1);return{pN,rv:Math.round(rv*100)/100};};
function agg(voys,tare=DEF_TARE){let tv=0,tp=0,rM=0,rL=0,nM=0,nL=0,pM=0,pL=0;voys.forEach(v=>(v.trips||[]).forEach(t=>{const c=cTrip(t,tare);tv+=(t.nbVoyages||0);tp+=c.pN*(t.nbVoyages||1);if(t.zone==="06"){rM+=c.rv;nM+=t.nbVoyages;pM+=c.pN*(t.nbVoyages||1);}if(t.zone==="13"){rL+=c.rv;nL+=t.nbVoyages;pL+=c.pN*(t.nbVoyages||1);}}));const rev=rM+rL;return{tv,tp,rM,rL,rev,ttc:Math.round(rev*(1+TPS_R+TVQ_R)*100)/100,nM,nL,pM,pL};}
function calcZW(voyages,ws,zone,tare=DEF_TARE){const wd=gWk(ws);let tp=0,nv=0,nf=0,dt=[];voyages.filter(v=>v.date>=wd[0]&&v.date<=wd[4]).forEach(v=>{(v.trips||[]).forEach(t=>{if(t.zone===zone){const pN=Math.max(0,(t.poidsChaj||0)-tare);tp+=pN*(t.nbVoyages||1);nv+=(t.nbVoyages||1);nf++;if(t.dt)dt.push(t.dt);}});});return{tp,nv,nf,dt};}
const openPrint=(title,html)=>{const w=window.open('','_blank');if(!w)return;w.document.write(`<!DOCTYPE html><html><head><meta charset=utf-8><title>${title}</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}body{background:#fff;color:#1a1a1a}.inv{max-width:780px;margin:0 auto;padding:30px}.hdr{display:flex;gap:16px;margin-bottom:20px}.av{width:80px;height:80px;border-radius:8px;background:#334155;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:900}.ci{font-size:12px;color:#475569;line-height:1.6}.ci strong{font-size:14px;color:#1a1a1a}.per{font-size:14px;font-weight:600;margin-bottom:12px}.mr{display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px}.mr .l{color:#64748b}.mr .v{font-weight:600}.bg{background:#dbeafe;color:#2563eb;font-size:10px;font-weight:700;padding:2px 10px;border-radius:10px;display:inline-block}.cb{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;font-size:12px;line-height:1.6}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f1f5f9;padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;border:1px solid #e2e8f0}td{padding:10px 14px;font-size:12px;border:1px solid #e2e8f0;vertical-align:top}.r{text-align:right}.b{font-weight:700}.ts{margin-left:auto;width:320px}.tr{display:flex;justify-content:space-between;padding:6px 14px;font-size:12px;border-bottom:1px solid #e2e8f0}.tr.t{background:#1e293b;color:#fff;font-weight:700;font-size:14px;border-radius:0 0 6px 6px}.ft{text-align:center;font-size:9px;color:#94a3b8;margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0}@media print{.inv{padding:20px}}</style></head><body><div class=inv>${html}</div><script>window.onload=function(){window.print()}<\/script></body></html>`);w.document.close();};
const Bt=({children,onClick,color=C.accent,variant="solid",size="md",disabled,style:sx})=><button onClick={onClick} disabled={disabled} style={{padding:size==="sm"?"6px 14px":size==="lg"?"12px 22px":"8px 16px",fontSize:size==="sm"?11:size==="lg"?14:12,fontWeight:700,border:variant==="solid"?"none":`1.5px solid ${color}`,borderRadius:8,cursor:disabled?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",gap:6,background:variant==="solid"?color:"transparent",color:variant==="solid"?"#fff":color,opacity:(disabled?0.5:1),minHeight:36,...sx}}>{children}</button>;
const In=({label,value,onChange,type="text",placeholder,options,style:sx,multiline,disabled:dis})=><div style={{display:"flex",flexDirection:"column",gap:4,flex:1,minWidth:0,...sx}}>{label&&<label style={{fontSize:11,color:C.muted,fontWeight:600}}>{label}</label>}{options?<select value={value} onChange={e=>onChange(e.target.value)} disabled={dis} style={{background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:16,outline:"none",minHeight:40}}>{options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}</select>:multiline?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={2} style={{background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:16,outline:"none",width:"100%",resize:"vertical"}}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={dis} style={{background:dis?C.card2:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:16,outline:"none",width:"100%",minHeight:40}}/>}</div>;
const Mo=({open,onClose,title,children,width=700})=>{if(!open)return null;return<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.7)",padding:"8px"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} className="jw-modal" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"clamp(12px, 3vw, 24px)",width,maxWidth:"96vw",maxHeight:"92vh",overflowY:"auto",overflowX:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h3 style={{color:C.text,fontSize:"clamp(14px, 3vw, 17px)",fontWeight:700,margin:0}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18,padding:8,minWidth:36,minHeight:36}}>✕</button></div>{children}</div></div>;};
const Bg=({text,color})=><span style={{background:`${color}18`,color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:6}}>{text}</span>;
const St=({title,value,color,grad})=><div className="jw-st" style={{background:grad||C.card,border:grad?"none":`1px solid ${color}25`,borderRadius:14,padding:"14px 18px",flex:"1 1 120px",minWidth:100,position:"relative",overflow:"hidden"}}>{grad&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.25)",borderRadius:14}}/>}<div style={{position:"relative",zIndex:1}}><div style={{fontSize:10,color:grad?"rgba(255,255,255,.7)":C.muted,textTransform:"uppercase",letterSpacing:.8,fontWeight:600,marginBottom:4}}>{title}</div><div style={{fontSize:18,fontWeight:800,color:grad?"#fff":color}}>{value}</div></div></div>;
const Tb=({columns,data:rows})=><div className="jw-tbl-wrap" style={{overflowX:"auto",WebkitOverflowScrolling:"touch",borderRadius:10,border:`1px solid ${C.border}`}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:columns.length>4?500:0}}><thead><tr style={{background:C.card2}}>{columns.map(c=><th key={c.key} style={{padding:"8px 12px",textAlign:c.align||"left",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`}}>{c.label}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i} style={{background:i%2?C.card2+"40":"transparent"}}>{columns.map(c=><td key={c.key} style={{padding:"8px 12px",fontSize:12,color:C.text,borderBottom:`1px solid ${C.border}10`,textAlign:c.align||"left"}}>{c.render?c.render(r):r[c.key]}</td>)}</tr>)}{rows.length===0&&<tr><td colSpan={columns.length} style={{padding:30,textAlign:"center",color:C.dim}}>Aucune donnée</td></tr>}</tbody></table></div>;
const Ck=({label,checked,onChange})=><label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:C.muted}}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{accentColor:C.accent}}/>{label}</label>;
function Dash({data,go}){
const[wk,setWk]=useState(gMon());
const wd=useMemo(()=>gWk(wk),[wk]);const st=data.settings||def.settings;
const filt=useMemo(()=>data.voyages.filter(v=>v.date>=wd[0]&&v.date<=wd[4]),[data.voyages,wd]);
const a=useMemo(()=>agg(filt),[filt]);const gN=id=>data.chauffeurs.find(c=>c.id===id)?.nom||"—";const gVhN=id=>(data.vehicules||[]).find(v=>v.id===id)?.nom||"";
const wkD=useMemo(()=>wd.map((d,i)=>{const v=data.voyages.find(x=>x.date===d);if(!v)return{id:d,j:JRS[i],td:d===today(),ch:"—",veh:"",voy:0,p:0,r:0};const da=agg([v]);return{id:d,j:JRS[i],td:d===today(),ch:gN(v.chofè),veh:gVhN(v.vehiculeId),voy:da.tv,p:da.tp,r:da.rev};}),[wd,data]);
const empPay=useMemo(()=>{return data.chauffeurs.filter(c=>c.aktif).map(ch=>{let vy=0;filt.forEach(v=>{if(v.chofè===ch.id||v.helpers?.includes(ch.id))(v.trips||[]).forEach(t=>{vy+=(t.nbVoyages||0);});});const tx=parseFloat(ch.tauxPersonnel)||(ch.role==="Chauffeur"?st.tauxChauffeur:st.tauxHelper);return{id:ch.id,nom:ch.nom,role:ch.role,vy,tx,br:vy*tx};});},[data.chauffeurs,filt,st]);
const totEmpBr=empPay.reduce((s,e)=>s+e.br,0);
const wkDeps=useMemo(()=>(data.depenses||[]).filter(d=>d.date>=wd[0]&&d.date<=wd[4]),[data.depenses,wd]);
const totDeps=wkDeps.reduce((s,d)=>s+(d.montant||0),0);
const wkEnts=useMemo(()=>{const ents=data.entretiens||[];const vehs=data.vehicules||[];return ents.filter(e=>e.date>=wd[0]&&e.date<=wd[4]).map(e=>({...e,vNom:vehs.find(v=>v.id===e.vehiculeId)?.nom||"—"}));},[data.entretiens,data.vehicules,wd]);
const totEnt=wkEnts.reduce((s,e)=>s+(e.cout||0),0);
const profit=a.ttc-totEmpBr-totDeps-totEnt;
const chartData=useMemo(()=>{const weeks=[];let d=new Date(wk+"T12:00:00");d.setDate(d.getDate()-7*7);for(let i=0;i<8;i++){const ws=toL(d);const we=gWk(ws);const wVoys=data.voyages.filter(v=>v.date>=we[0]&&v.date<=we[4]);const wa=agg(wVoys);weeks.push({label:fDs(we[0]),tv:wa.tv,rev:wa.rev});d.setDate(d.getDate()+7);}return weeks;},[wk,data.voyages]);
const maxRev=Math.max(...chartData.map(w=>w.rev),1);const maxVoy=Math.max(...chartData.map(w=>w.tv),1);
const Bar=({val,max,color,h=80})=>{const pct=max>0?(val/max)*100:0;return<div style={{width:"100%",height:h,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",gap:2}}><span style={{fontSize:9,fontWeight:700,color}}>{val>0?val:""}</span><div style={{width:"100%",background:color,borderRadius:"4px 4px 0 0",height:`${Math.max(pct,2)}%`,minHeight:2,transition:"height 0.3s"}}/></div>;};
return<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h1 style={{fontSize:22,fontWeight:800}}>Tableau de bord</h1></div>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()-7);setWk(toL(d));}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}>{"◀"}</button><span style={{fontSize:13,fontWeight:600,minWidth:200,textAlign:"center"}}>{fDs(wd[0])} {"→"} {fDs(wd[4])}</span><button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()+7);setWk(toL(d));}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}>{"▶"}</button></div>
<div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}><St title="Voyages" value={a.tv} grad={C.g1}/><St title="Poids" value={`${a.tp.toLocaleString()} kg`} grad={C.g2}/><St title="TTC" value={fM(a.ttc)} grad={C.g4}/><St title="Emp." value={fM(totEmpBr)} color={C.orange}/><St title="Dépenses" value={fM(totDeps)} color={C.red}/><St title="Entretien" value={fM(totEnt)} color={C.cyan}/><St title="Profit" value={fM(profit)} color={profit>=0?C.green:C.red}/></div>
<Tb columns={[{key:"j",label:"Jour",render:r=><span style={{fontWeight:700,color:r.td?C.accentL:C.text}}>{r.j}</span>},{key:"ch",label:"Ch."},{key:"veh",label:"🚛",render:r=>r.veh?<span style={{fontSize:9,color:C.cyan,fontWeight:600}}>{r.veh}</span>:<span style={{color:C.dim}}>{"—"}</span>},{key:"voy",label:"V.",align:"center",render:r=>r.voy>0?<b style={{color:C.accent}}>{r.voy}</b>:<span style={{color:C.dim}}>{"—"}</span>},{key:"p",label:"Poids",align:"right",render:r=>r.p>0?<span style={{color:C.green,fontWeight:700}}>{r.p.toLocaleString()} kg</span>:<span style={{color:C.dim}}>{"—"}</span>},{key:"r",label:"Rev",align:"right",render:r=>r.r>0?<span style={{color:C.cyan,fontWeight:700}}>{fM(r.r)}</span>:<span style={{color:C.dim}}>{"—"}</span>}]} data={wkD}/>
<div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16}}>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}><div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>Voyages (8 sem.)</div><div style={{display:"grid",gridTemplateColumns:`repeat(${chartData.length},1fr)`,gap:4,alignItems:"end"}}>{chartData.map((w,i)=><div key={i} style={{textAlign:"center"}}><Bar val={w.tv} max={maxVoy} color={C.accent}/><div style={{fontSize:8,color:C.dim,marginTop:3}}>{w.label}</div></div>)}</div></div>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16}}><div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>Revenu HT (8 sem.)</div><div style={{display:"grid",gridTemplateColumns:`repeat(${chartData.length},1fr)`,gap:4,alignItems:"end"}}>{chartData.map((w,i)=><div key={i} style={{textAlign:"center"}}><Bar val={Math.round(w.rev)} max={maxRev} color={C.cyan}/><div style={{fontSize:8,color:C.dim,marginTop:3}}>{w.label}</div></div>)}</div></div></div>
{empPay.filter(e=>e.vy>0).length>0?<div style={{marginTop:16}}><div style={{fontSize:13,fontWeight:700,color:C.muted,marginBottom:8}}>Revenu Employés (semaine)</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{empPay.map(e=><div key={e.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",minWidth:160,flex:"1 1 160px",opacity:e.vy>0?1:.5}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:12,fontWeight:700}}>{e.nom}</span><Bg text={e.role} color={e.role==="Chauffeur"?C.accent:C.purple}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}><span>{e.vy} voy {"×"} {fM(e.tx)}</span><span style={{fontWeight:800,color:e.br>0?C.green:C.dim,fontSize:14}}>{fM(e.br)}</span></div></div>)}</div><div style={{textAlign:"right",marginTop:6,fontSize:13,fontWeight:800,color:C.orange}}>Total: {fM(totEmpBr)}</div></div>:<div style={{marginTop:16}}><div style={{fontSize:13,fontWeight:700,color:C.muted,marginBottom:8}}>Revenu Employés (semaine)</div><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",color:C.dim,fontSize:12,textAlign:"center"}}>Aucun voyage cette semaine</div></div>}
{wkDeps.length>0&&<div style={{marginTop:16}}><div style={{fontSize:13,fontWeight:700,color:C.muted,marginBottom:8}}>Dépenses (semaine)</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{wkDeps.map(d=><div key={d.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",minWidth:160,flex:"1 1 160px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:700}}>{d.description||d.categorie}</span><Bg text={d.categorie} color={DCOLORS[d.categorie]||C.muted}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:C.muted}}>{fDs(d.date)}</span><span style={{fontWeight:800,color:C.red}}>{fM(d.montant)}</span></div></div>)}</div><div style={{textAlign:"right",marginTop:6,fontSize:13,fontWeight:800,color:C.red}}>Total: {fM(totDeps)}</div></div>}
<div style={{marginTop:16}}><div style={{fontSize:13,fontWeight:700,color:C.muted,marginBottom:8}}>Entretiens (semaine)</div>{wkEnts.length>0?<><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{wkEnts.map(e=><div key={e.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",minWidth:160,flex:"1 1 160px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:700}}>{e.vNom}</span><Bg text={e.type} color={C.cyan}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span style={{color:C.muted}}>{fDs(e.date)}{e.description?` — ${e.description}`:""}</span><span style={{fontWeight:800,color:C.red}}>{fM(e.cout)}</span></div></div>)}</div><div style={{textAlign:"right",marginTop:6,fontSize:13,fontWeight:800,color:C.red}}>Total: {fM(totEnt)}</div></>:<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px 20px",color:C.dim,fontSize:12,textAlign:"center"}}>Aucun entretien cette semaine</div>}</div>
<div style={{display:"flex",gap:8,marginTop:16}}><Bt onClick={()=>go("voyages")} size="lg">+ Voyage</Bt><Bt onClick={()=>go("factures")} variant="outline" color={C.purple}>Factures</Bt><Bt onClick={()=>go("clients")} variant="outline" color={C.cyan}>Clients</Bt></div>
</div>;}

function Voy({data,sv,ms}){
const[wk,setWk]=useState(gMon());const[modal,setModal]=useState(false);const[eDate,setEDate]=useState(null);
const[trips,setTrips]=useState([]);const[ch,setCh]=useState("");const[hlp,setHlp]=useState([]);const[veh,setVeh]=useState("");
const wd=useMemo(()=>gWk(wk),[wk]);const gV=d=>data.voyages.find(v=>v.date===d);const gN=id=>data.chauffeurs.find(c=>c.id===id)?.nom||"—";const gVN=id=>(data.vehicules||[]).find(v=>v.id===id)?.nom||"";
const openDay=d=>{const ex=gV(d);if(ex){setCh(ex.chofè||"");setHlp(ex.helpers||[]);setVeh(ex.vehiculeId||"");setTrips(ex.trips?ex.trips.map(t=>({...t})):[]);}else{setCh("");setHlp([]);setVeh("");setTrips([{id:gid(),zone:"06",nbVoyages:1,poidsChaj:"",dt:""}]);}setEDate(d);setModal(true);};
const addT=()=>setTrips(p=>[...p,{id:gid(),zone:"06",nbVoyages:1,poidsChaj:"",dt:""}]);
const upT=(id,f,v)=>setTrips(p=>p.map(t=>t.id===id?{...t,[f]:f==="zone"||f==="dt"?v:(parseFloat(v)||0)}:t));
const saveDay=()=>{if(!ch){ms("Choisir chauffeur!","error");return;}const vy={id:gV(eDate)?.id||gid(),date:eDate,chofè:ch,helpers:hlp,vehiculeId:veh,trips};const ex=data.voyages.find(v=>v.date===eDate);sv({...data,voyages:ex?data.voyages.map(v=>v.date===eDate?vy:v):[...data.voyages,vy]});ms("OK!");setModal(false);};
const wa=useMemo(()=>agg(data.voyages.filter(v=>v.date>=wd[0]&&v.date<=wd[4])),[data.voyages,wd]);
const[showHist,setShowHist]=useState(false);
const allVoys=useMemo(()=>[...data.voyages].sort((a,b)=>b.date.localeCompare(a.date)),[data.voyages]);
const openEdit=d=>{const mon=gMon(new Date(d+"T12:00:00"));setWk(mon);setTimeout(()=>openDay(d),50);};
return<div>
<h1 style={{fontSize:22,fontWeight:800,marginBottom:12}}>Voyages</h1>
<div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px"}}><button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()-7);setWk(toL(d));}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}>{"◀"}</button><div style={{flex:1,textAlign:"center",fontSize:14,fontWeight:700}}>{fDs(wd[0])} {"—"} {fDs(wd[4])}</div><button onClick={()=>{const d=new Date(wk+"T12:00:00");d.setDate(d.getDate()+7);setWk(toL(d));}} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}>{"▶"}</button></div>
<div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}><St title="Voy." value={wa.tv} color={C.accent}/><St title="Poids Total" value={`${wa.tp.toLocaleString()} kg`} color={C.green}/><St title="MTL (06)" value={`${wa.pM.toLocaleString()} kg`} color={C.accent}/><St title="LAV (13)" value={`${wa.pL.toLocaleString()} kg`} color={C.cyan}/><St title="Rev" value={fM(wa.rev)} color={C.cyan}/></div>
{wd.map((d,i)=>{const v=gV(d);const td=d===today();const ds=v?.trips?.length?agg([v]):null;const hasDT=v?.trips?.some(t=>t.dt);
return<div key={d} style={{background:C.card,border:`1px solid ${td?C.accent+"40":C.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:5}} onClick={()=>openDay(d)}>
<div style={{minWidth:70}}><div style={{fontSize:12,fontWeight:700,color:td?C.accentL:C.text}}>{JRS[i]}</div><div style={{fontSize:10,color:C.dim}}>{fDs(d)}</div></div>
{ds?<div style={{flex:1,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}><span style={{fontSize:11}}>{gN(v.chofè)}</span>{v.vehiculeId&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:C.cyan+"20",color:C.cyan,fontWeight:700}}>🚛 {gVN(v.vehiculeId)}</span>}<b style={{color:C.accent}}>{ds.tv}v</b><span style={{color:C.green,fontWeight:700}}>{ds.tp.toLocaleString()}kg</span><span style={{color:C.cyan,fontWeight:700}}>{fM(ds.rev)}</span>{hasDT&&<Bg text="DT" color={C.orange}/>}</div>:<div style={{flex:1,color:C.dim,fontSize:12}}>{"—"}</div>}
{v&&<button onClick={e=>{e.stopPropagation();sv({...data,voyages:data.voyages.filter(x=>x.date!==d)});ms("OK!");}} style={{background:"none",border:"none",cursor:"pointer",color:C.red}}>X</button>}
</div>;})}
<div style={{marginTop:16}}>
<button onClick={()=>setShowHist(!showHist)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",width:"100%",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",color:C.text}}>
<span style={{fontSize:13,fontWeight:700}}>Historique ({allVoys.length} voyages)</span>
<span style={{color:C.muted}}>{showHist?"▲":"▼"}</span>
</button>
{showHist&&<div style={{marginTop:8}}>
<Tb columns={[
{key:"date",label:"Date",render:r=><span style={{fontWeight:700,color:C.accentL}}>{fD(r.date)}</span>},
{key:"ch",label:"Chauffeur",render:r=><span>{gN(r.chofè)}</span>},
{key:"veh",label:"🚛 Véh.",render:r=><span style={{fontSize:10,color:r.vehiculeId?C.cyan:C.dim,fontWeight:600}}>{r.vehiculeId?gVN(r.vehiculeId):"—"}</span>},
{key:"hlp",label:"Helpers",render:r=><span style={{fontSize:10,color:C.muted}}>{(r.helpers||[]).map(h=>gN(h)).join(", ")||"—"}</span>},
{key:"tv",label:"V.",align:"center",render:r=>{const s=agg([r]);return<b style={{color:C.accent}}>{s.tv}</b>;}},
{key:"tp",label:"Poids",align:"right",render:r=>{const s=agg([r]);return<span style={{color:C.green,fontWeight:700}}>{s.tp.toLocaleString()} kg</span>;}},
{key:"rev",label:"Rev",align:"right",render:r=>{const s=agg([r]);return<span style={{color:C.cyan,fontWeight:700}}>{fM(s.rev)}</span>;}},
{key:"dt",label:"DT",render:r=>{const hasDT=r.trips?.some(t=>t.dt);return hasDT?<Bg text="DT" color={C.orange}/>:<span style={{color:C.dim}}>{"—"}</span>;}},
{key:"a",label:"",render:r=><div style={{display:"flex",gap:4}}><button onClick={()=>openEdit(r.date)} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:10,fontWeight:700}}>Edit</button><button onClick={()=>{sv({...data,voyages:data.voyages.filter(x=>x.date!==r.date)});ms("OK!");}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>Del</button></div>}
]} data={allVoys}/>
</div>}
</div>
<Mo open={modal} onClose={()=>setModal(false)} title={`${eDate?JRS[wd.indexOf(eDate)]||"":""} — ${fD(eDate)}`} width={800}>
<div style={{display:"flex",gap:10,marginBottom:12}}>
<In label="Chauffeur" value={ch} onChange={setCh} options={[{value:"",label:"— Choisir —"},...data.chauffeurs.filter(c=>c.aktif&&c.role==="Chauffeur").map(c=>({value:c.id,label:c.nom}))]}/>
<In label="🚛 Camion" value={veh} onChange={setVeh} options={[{value:"",label:"— Choisir Camion —"},...(data.vehicules||[]).filter(v=>v.statut!=="Inactif").map(v=>({value:v.id,label:v.nom+(v.plaque?" — "+v.plaque:"")}))]}/>
<div style={{flex:2}}><label style={{fontSize:11,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Helpers</label><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{data.chauffeurs.filter(c=>c.aktif&&c.role==="Helper").map(h=><button key={h.id} onClick={()=>setHlp(p=>p.includes(h.id)?p.filter(x=>x!==h.id):[...p,h.id])} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",border:`1.5px solid ${hlp.includes(h.id)?C.green:C.border}`,background:hlp.includes(h.id)?`${C.green}15`:"transparent",color:hlp.includes(h.id)?C.green:C.muted}}>{h.nom}</button>)}</div></div></div>
{trips.map((t,idx)=>{const tc=cTrip(t);return<div key={t.id} style={{background:C.bg,borderRadius:10,padding:10,marginBottom:8,border:`1px solid ${C.border}`}}>
<div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontWeight:800,color:C.accent,width:20}}>{idx+1}</span><select value={t.zone} onChange={e=>upT(t.id,"zone",e.target.value)} style={{background:C.card,color:C.text,border:`1px solid ${C.border}`,borderRadius:5,padding:5,fontSize:12}}>{ZONES.map(z=><option key={z.v} value={z.v}>{z.l}</option>)}</select><In type="number" value={t.nbVoyages} onChange={v=>upT(t.id,"nbVoyages",v)} placeholder="Nb" style={{maxWidth:55}}/><In type="number" value={t.poidsChaj} onChange={v=>upT(t.id,"poidsChaj",v)} placeholder="Poids chargé" style={{maxWidth:110}}/><div style={{minWidth:65,textAlign:"center"}}><div style={{fontSize:8,color:C.dim}}>P.NET</div><div style={{fontSize:11,color:tc.pN>0?C.green:C.dim,fontWeight:700}}>{tc.pN>0?tc.pN.toLocaleString()+"kg":"—"}</div></div><div style={{minWidth:65,textAlign:"center"}}><div style={{fontSize:8,color:C.dim}}>REV</div><div style={{fontSize:11,color:tc.rv>0?C.cyan:C.dim,fontWeight:700}}>{tc.rv>0?fM(tc.rv):"—"}</div></div>{trips.length>1&&<button onClick={()=>setTrips(p=>p.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",cursor:"pointer",color:C.red}}>X</button>}</div>
<div style={{marginLeft:28,marginTop:4}}><In value={t.dt||""} onChange={v=>upT(t.id,"dt",v)} placeholder={`DT — Notes zone ${ZM[t.zone]||""}...`} multiline/></div></div>;})}
<Bt variant="outline" color={C.accent} onClick={addT} size="sm" style={{marginBottom:10}}>+ Trip</Bt>
<div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Bt variant="outline" color={C.muted} onClick={()=>setModal(false)}>Annuler</Bt><Bt onClick={saveDay} size="lg">Enregistrer</Bt></div>
</Mo></div>;}

function Chauf({data,sv,ms}){const st=data.settings||def.settings;const[m,setM]=useState(false);const[eid,setEid]=useState(null);const e={nom:"",role:"Chauffeur",aktif:true,courriel:"",tauxPersonnel:""};const[f,setF]=useState(e);
const hs=()=>{if(!f.nom){ms("Nom!","error");return;}sv({...data,chauffeurs:eid?data.chauffeurs.map(c=>c.id===eid?{id:eid,...f}:c):[...data.chauffeurs,{id:gid(),...f}]});ms("OK!");setM(false);setEid(null);setF(e);};
return<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h1 style={{fontSize:22,fontWeight:800}}>Employés</h1><Bt onClick={()=>{setEid(null);setF(e);setM(true);}}>+</Bt></div>
<Tb columns={[{key:"nom",label:"Nom"},{key:"role",label:"Rôle",render:r=><Bg text={r.role} color={r.role==="Chauffeur"?C.accent:C.purple}/>},{key:"courriel",label:"Email",render:r=><span style={{fontSize:10,color:r.courriel?C.cyan:C.dim}}>{r.courriel||"—"}</span>},{key:"tauxPersonnel",label:"Taux ($)",render:r=>{const tx=r.tauxPersonnel||(r.role==="Chauffeur"?st.tauxChauffeur:st.tauxHelper);return<span style={{fontSize:11,fontWeight:700,color:r.tauxPersonnel?C.cyan:C.dim}}>${tx}{r.tauxPersonnel?"":" (déf)"}</span>;}},{key:"aktif",label:"",render:r=><Bg text={r.aktif?"Actif":"Inactif"} color={r.aktif?C.green:C.red}/>},{key:"a",label:"",render:r=><div style={{display:"flex",gap:3}}><button onClick={()=>{setEid(r.id);setF({nom:r.nom,role:r.role,aktif:r.aktif,courriel:r.courriel||"",tauxPersonnel:r.tauxPersonnel||""});setM(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:10}}>Edit</button><button onClick={()=>{sv({...data,chauffeurs:data.chauffeurs.filter(c=>c.id!==r.id)});ms("OK!");}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>Del</button></div>}]} data={data.chauffeurs}/>
<Mo open={m} onClose={()=>setM(false)} title={eid?"Modifier":"Nouveau"} width={400}><In label="Nom" value={f.nom} onChange={v=>setF({...f,nom:v})} style={{marginBottom:10}}/><In label="Rôle" value={f.role} onChange={v=>setF({...f,role:v})} options={["Chauffeur","Helper"]} style={{marginBottom:10}}/><In label="Courriel" value={f.courriel} onChange={v=>setF({...f,courriel:v})} placeholder="email@exemple.com" style={{marginBottom:10}}/><In label={`Taux Personnel ($/voy) — Défaut: $${f.role==="Chauffeur"?st.tauxChauffeur:st.tauxHelper}`} type="number" value={f.tauxPersonnel} onChange={v=>setF({...f,tauxPersonnel:v})} placeholder={`${f.role==="Chauffeur"?st.tauxChauffeur:st.tauxHelper}`} style={{marginBottom:10}}/><Ck label="Actif" checked={f.aktif} onChange={v=>setF({...f,aktif:v})}/><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:10}}><Bt variant="outline" color={C.muted} onClick={()=>setM(false)}>Annuler</Bt><Bt onClick={hs}>OK</Bt></div></Mo></div>;}

function Clients({data,sv,ms}){const cls=data.clients||[];const[m,setM]=useState(false);const[eid,setEid]=useState(null);const ef={nom:"",adresse:"",ville:"",telephone:"",courriel:""};const[f,setF]=useState(ef);
const hs=()=>{if(!f.nom){ms("Nom!","error");return;}sv({...data,clients:eid?cls.map(c=>c.id===eid?{id:eid,...f}:c):[...cls,{id:gid(),...f}]});ms("OK!");setM(false);setEid(null);setF(ef);};
return<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h1 style={{fontSize:22,fontWeight:800}}>Clients</h1><Bt onClick={()=>{setEid(null);setF(ef);setM(true);}}>+</Bt></div>
<Tb columns={[{key:"nom",label:"Nom",render:r=><b>{r.nom}</b>},{key:"ville",label:"Ville"},{key:"telephone",label:"Tél"},{key:"a",label:"",render:r=><div style={{display:"flex",gap:3}}><button onClick={()=>{setEid(r.id);setF({nom:r.nom,adresse:r.adresse||"",ville:r.ville||"",telephone:r.telephone||"",courriel:r.courriel||""});setM(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:10}}>Edit</button><button onClick={()=>{sv({...data,clients:cls.filter(c=>c.id!==r.id)});ms("OK!");}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>Del</button></div>}]} data={cls}/>
<Mo open={m} onClose={()=>setM(false)} title={eid?"Modifier":"Nouveau client"} width={500}><In label="Nom *" value={f.nom} onChange={v=>setF({...f,nom:v})} style={{marginBottom:10}}/><In label="Adresse" value={f.adresse} onChange={v=>setF({...f,adresse:v})} style={{marginBottom:10}}/><In label="Ville, Province, CP" value={f.ville} onChange={v=>setF({...f,ville:v})} style={{marginBottom:10}}/><div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><In label="Tél" value={f.telephone} onChange={v=>setF({...f,telephone:v})}/><In label="Courriel" value={f.courriel} onChange={v=>setF({...f,courriel:v})}/></div><div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Bt variant="outline" color={C.muted} onClick={()=>setM(false)}>Annuler</Bt><Bt onClick={hs}>OK</Bt></div></Mo></div>;}

function Vehic({data,sv,ms}){const vehs=data.vehicules||[];const ents=data.entretiens||[];const[m,setM]=useState(false);const[mE,setME]=useState(false);const[eid,setEid]=useState(null);const[eEid,setEEid]=useState(null);const ef={nom:"",plaque:"",annee:"",km:"",statut:"Actif"};const[f,setF]=useState(ef);const eef={vehiculeId:"",date:today(),type:"Huile",description:"",cout:"",km:""};const[fe,setFe]=useState(eef);const ETYPES=["Huile","Pneus","Freins","Filtre","Inspection","Réparation","Autre"];
const hsV=()=>{if(!f.nom){ms("Nom!","error");return;}sv({...data,vehicules:eid?vehs.map(v=>v.id===eid?{id:eid,...f}:v):[...vehs,{id:gid(),...f}]});ms("OK!");setM(false);setEid(null);setF(ef);};
const hsE=()=>{const obj={id:eEid||gid(),...fe,cout:parseFloat(fe.cout)||0};sv({...data,entretiens:eEid?ents.map(e=>e.id===eEid?obj:e):[...ents,obj]});ms("OK!");setME(false);setEEid(null);setFe(eef);};
const delE=id=>{sv({...data,entretiens:ents.filter(e=>e.id!==id)});ms("OK!");};
return<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h1 style={{fontSize:22,fontWeight:800}}>Véhicules</h1><div style={{display:"flex",gap:6}}><Bt onClick={()=>{setEid(null);setF(ef);setM(true);}}>+ Véh.</Bt><Bt color={C.cyan} onClick={()=>{setEEid(null);setFe(eef);setME(true);}}>+ Entretien</Bt></div></div>
<Tb columns={[{key:"nom",label:"Véhicule",render:r=><b>{r.nom}</b>},{key:"plaque",label:"Plaque"},{key:"annee",label:"Année"},{key:"km",label:"KM",render:r=><span>{r.km?Number(r.km).toLocaleString():"—"}</span>},{key:"statut",label:"",render:r=><Bg text={r.statut||"Actif"} color={r.statut==="Inactif"?C.red:C.green}/>},{key:"a",label:"",render:r=><div style={{display:"flex",gap:3}}><button onClick={()=>{setEid(r.id);setF({nom:r.nom,plaque:r.plaque||"",annee:r.annee||"",km:r.km||"",statut:r.statut||"Actif"});setM(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:10}}>Edit</button><button onClick={()=>{sv({...data,vehicules:vehs.filter(v=>v.id!==r.id)});ms("OK!");}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>Del</button></div>}]} data={vehs}/>
{ents.length>0&&<div style={{marginTop:16}}><h3 style={{fontSize:14,fontWeight:700,marginBottom:8,color:C.muted}}>Entretiens</h3><Tb columns={[{key:"date",label:"Date",render:r=>fDs(r.date)},{key:"v",label:"Véh.",render:r=><span>{vehs.find(v=>v.id===r.vehiculeId)?.nom||"—"}</span>},{key:"type",label:"Type",render:r=><Bg text={r.type} color={C.cyan}/>},{key:"description",label:"Desc."},{key:"cout",label:"$",align:"right",render:r=><span style={{fontWeight:700,color:C.red}}>{fM(r.cout)}</span>},{key:"a",label:"",render:r=><div style={{display:"flex",gap:3}}><button onClick={()=>{setEEid(r.id);setFe({vehiculeId:r.vehiculeId||"",date:r.date,type:r.type||"Huile",description:r.description||"",cout:r.cout||"",km:r.km||""});setME(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:10}}>Edit</button><button onClick={()=>delE(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>Del</button></div>}]} data={ents.sort((a,b)=>b.date.localeCompare(a.date))}/></div>}
<Mo open={m} onClose={()=>setM(false)} title={eid?"Modifier":"Nouveau véhicule"} width={480}><In label="Nom" value={f.nom} onChange={v=>setF({...f,nom:v})} style={{marginBottom:10}}/><div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><In label="Plaque" value={f.plaque} onChange={v=>setF({...f,plaque:v})}/><In label="Année" value={f.annee} onChange={v=>setF({...f,annee:v})}/></div><div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><In label="KM" type="number" value={f.km} onChange={v=>setF({...f,km:v})}/><In label="Statut" value={f.statut} onChange={v=>setF({...f,statut:v})} options={["Actif","Inactif"]}/></div><div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Bt variant="outline" color={C.muted} onClick={()=>setM(false)}>Annuler</Bt><Bt onClick={hsV}>OK</Bt></div></Mo>
<Mo open={mE} onClose={()=>{setME(false);setEEid(null);}} title={eEid?"Modifier entretien":"Nouvel entretien"} width={480}><In label="Véhicule" value={fe.vehiculeId} onChange={v=>setFe({...fe,vehiculeId:v})} options={[{value:"",label:"— Choisir —"},...vehs.map(v=>({value:v.id,label:v.nom}))]} style={{marginBottom:10}}/><div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><In label="Date" type="date" value={fe.date} onChange={v=>setFe({...fe,date:v})}/><In label="Type" value={fe.type} onChange={v=>setFe({...fe,type:v})} options={ETYPES}/></div><In label="Description" value={fe.description} onChange={v=>setFe({...fe,description:v})} style={{marginBottom:10}}/><In label="Coût $" type="number" value={fe.cout} onChange={v=>setFe({...fe,cout:v})} style={{marginBottom:14}}/><div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Bt variant="outline" color={C.muted} onClick={()=>setME(false)}>Annuler</Bt><Bt onClick={hsE} color={C.cyan}>OK</Bt></div></Mo></div>;}
function Fact({data,sv,ms}){
const facs=data.factures||[];const cls=data.clients||[];
const[ent,setEnt]=useState(data.settings?.entreprise||def.settings.entreprise);
const[tpsN,setTpsN]=useState(data.settings?.tpsNum||"");const[tvqN,setTvqN]=useState(data.settings?.tvqNum||"");
const[showE,setShowE]=useState(false);const[m,setM]=useState(false);const[eid,setEid]=useState(null);const[fWk,setFWk]=useState(gMon());
const saveE=()=>{sv({...data,settings:{...data.settings,entreprise:ent,tpsNum:tpsN,tvqNum:tvqN}});ms("OK!");setShowE(false);};
const ef={clientId:"",date:today(),dateLimite:"",periode:"",details:[{id:gid(),zone:"06",description:"",quantite:"",unite:"kg",prixUnitaire:RM.toString(),dt:""}],avecTPS:true,avecTVQ:true,statut:"Nouvelle"};
const[f,setF]=useState(ef);const gCl=id=>cls.find(c=>c.id===id);
const FSTAT=["Nouvelle","Envoyée","Payée","Annulée"];const FCOL={"Nouvelle":C.accent,"Envoyée":C.orange,"Payée":C.green,"Annulée":C.red};
const calcF=(det,tps,tvq)=>{const st=det.reduce((s,d)=>{const q=parseFloat(d.quantite)||0;const p=parseFloat(d.prixUnitaire)||0;return s+q*p;},0);const tv=tps?Math.round(st*TPS_R*100)/100:0;const qv=tvq?Math.round(st*TVQ_R*100)/100:0;return{st:Math.round(st*100)/100,tv,qv,total:Math.round((st+tv+qv)*100)/100};};
const addDZ=zone=>{const zd=calcZW(data.voyages,fWk,zone);const rate=ZR[zone]||0;const zName=zone==="06"?"Montréal":"Laval";const desc=`Nbre fiches ${zName}: ${zd.nf}`;const dtT=zd.dt.join("\n");setF(p=>({...p,details:[...p.details.filter(d=>d.quantite||d.description),{id:gid(),zone,description:desc,quantite:zd.tp.toString(),unite:"kg",prixUnitaire:rate.toString(),dt:dtT}]}));};
const addD=()=>setF(p=>({...p,details:[...p.details,{id:gid(),zone:"06",description:"",quantite:"",unite:"kg",prixUnitaire:RM.toString(),dt:""}]}));
const upD=(id,k,v)=>setF(p=>({...p,details:p.details.map(d=>{if(d.id!==id)return d;const u={...d,[k]:v};if(k==="zone")u.prixUnitaire=(ZR[v]||0).toString();return u;})}));
const rmD=id=>setF(p=>({...p,details:p.details.filter(d=>d.id!==id)}));
const hs=()=>{if(!f.clientId){ms("Client!","error");return;}const c=calcF(f.details,f.avecTPS,f.avecTVQ);const num=eid?facs.find(x=>x.id===eid)?.numero:`FAC-${(facs.length+1).toString().padStart(3,"0")}`;const obj={id:eid||gid(),clientId:f.clientId,date:f.date,dateLimite:f.dateLimite,periode:f.periode,details:f.details,avecTPS:f.avecTPS,avecTVQ:f.avecTVQ,statut:f.statut,numero:num,sousTotal:c.st,tps:c.tv,tvq:c.qv,total:c.total};sv({...data,factures:eid?facs.map(x=>x.id===eid?obj:x):[...facs,obj]});ms("OK!");setM(false);setEid(null);setF(ef);};
const del=id=>{sv({...data,factures:facs.filter(x=>x.id!==id)});ms("OK!");};
const[emailModal,setEmailModal]=useState(null);
const genPdfBlob=(fc)=>{const cl=gCl(fc.clientId)||{};const c=calcF(fc.details,fc.avecTPS,fc.avecTVQ);const eI=data.settings?.entreprise||ent;const tN=data.settings?.tpsNum||"";const vN=data.settings?.tvqNum||"";
let rH=fc.details.map(d=>{const q=parseFloat(d.quantite)||0;const p=parseFloat(d.prixUnitaire)||0;const t=q*p;const dtH=d.dt?`<br/><span style="color:#94a3b8;font-size:10px">DT:</span><br/>${d.dt.replace(/\n/g,"<br/>")}`:"";
return`<tr><td><div style="font-size:11px;color:#475569">${d.description||"\u2014"}${dtH}</div></td><td class="r">${fN(q)} kg</td><td class="r">${fN(p)}</td><td class="r b">${fM(t)}</td></tr>`;}).join("");
let tH=`<div class="ts"><div class="tr"><span>Sous-total</span><span class="b">${fM(c.st)}</span></div>`;
if(fc.avecTPS)tH+=`<div class="tr"><span>TPS ${tN} 5%</span><span>${fM(c.tv)}</span></div>`;
if(fc.avecTVQ)tH+=`<div class="tr"><span>TVQ ${vN} 9.975%</span><span>${fM(c.qv)}</span></div>`;
tH+=`<div class="tr t"><span>Total</span><span>${fM(c.total)}</span></div></div>`;
return{html:`<div class="hdr"><div class="av">JW</div><div class="ci"><strong>${eI.nom}</strong><br/>${eI.adresse||""}<br/>${eI.ville||""}<br/>${eI.telephone||""}<br/>${eI.courriel||""}</div></div>${fc.periode?`<div class="per">Semaine du ${fc.periode}</div>`:""}<div style="display:flex;gap:30px;margin-bottom:16px"><div style="flex:1"><div class="mr"><span class="l">Facture</span><span class="v">${fc.numero}</span></div><div class="mr"><span class="l">Date</span><span class="v">${fc.date}</span></div><div class="mr"><span class="l">Total</span><span class="v">${fM(c.total)}</span></div><div class="mr"><span class="l">Statut</span><span class="bg">${fc.statut}</span></div></div><div class="cb"><strong>${cl.nom||"\u2014"}</strong><br/>${cl.adresse||""}<br/>${cl.ville||""}</div></div><table><thead><tr><th>Description</th><th class="r">Quantit\u00e9</th><th class="r">Prix unit.</th><th class="r">Total</th></tr></thead><tbody>${rH}</tbody></table>${tH}<div class="ft">${eI.nom} - ${eI.courriel||""} - ${eI.telephone||""}</div>`,cl,eI,c};};
const emailF=fc=>{const cl=gCl(fc.clientId)||{};if(!cl.courriel){ms("Client sans courriel!","error");return;}
setEmailModal({fc,clNom:cl.nom,clEmail:cl.courriel});};
const sendEmail=(provider)=>{if(!emailModal)return;const{fc,clNom,clEmail}=emailModal;
const eI=data.settings?.entreprise||ent;const c=calcF(fc.details,fc.avecTPS,fc.avecTVQ);
const{html}=genPdfBlob(fc);
const w=window.open("","_blank");if(w){w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Facture ${fc.numero}</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}body{background:#fff;color:#1a1a1a}.inv{max-width:780px;margin:0 auto;padding:30px}.hdr{display:flex;gap:16px;margin-bottom:20px}.av{width:80px;height:80px;border-radius:8px;background:#334155;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:900}.ci{font-size:12px;color:#475569;line-height:1.6}.ci strong{font-size:14px;color:#1a1a1a}.per{font-size:14px;font-weight:600;margin-bottom:12px}.mr{display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px}.mr .l{color:#64748b}.mr .v{font-weight:600}.bg{background:#dbeafe;color:#2563eb;font-size:10px;font-weight:700;padding:2px 10px;border-radius:10px;display:inline-block}.cb{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;font-size:12px;line-height:1.6}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#f1f5f9;padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;border:1px solid #e2e8f0}td{padding:10px 14px;font-size:12px;border:1px solid #e2e8f0;vertical-align:top}.r{text-align:right}.b{font-weight:700}.ts{margin-left:auto;width:320px}.tr{display:flex;justify-content:space-between;padding:6px 14px;font-size:12px;border-bottom:1px solid #e2e8f0}.tr.t{background:#1e293b;color:#fff;font-weight:700;font-size:14px;border-radius:0 0 6px 6px}.ft{text-align:center;font-size:9px;color:#94a3b8;margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0}@media print{.no-print{display:none!important}}</style></head><body><div class="inv">${html}</div><div class="no-print" style="text-align:center;margin:30px;font-family:sans-serif"><p style="margin-bottom:16px;font-size:14px;color:#475569">1. Imprimez cette page en PDF (Ctrl+P {"→"} Save as PDF)<br/>2. Joignez le PDF à votre email ci-dessous</p><div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap"></div></div><script>window.onafterprint=function(){}</script></body></html>`);w.document.close();w.print();}
setTimeout(()=>{const subject=encodeURIComponent(`Facture ${fc.numero} - ${eI.nom}`);
const body=encodeURIComponent(`Bonjour ${clNom},\n\nVeuillez trouver ci-joint la facture ${fc.numero} d'un montant de ${fM(c.total)}.\n\n${fc.periode?`Période : ${fc.periode}\n`:""}Date limite de paiement : ${fc.dateLimite?fD(fc.dateLimite):"À réception"}\n\nMerci pour votre confiance.\n\n${eI.nom}\n${eI.telephone||""}\n${eI.courriel||""}`);
let url;
if(provider==="gmail"){url=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clEmail)}&su=${subject}&body=${body}`;}
else if(provider==="outlook"){url=`https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(clEmail)}&subject=${subject}&body=${body}`;}
else{url=`mailto:${clEmail}?subject=${subject}&body=${body}`;}
window.open(url,"_blank");},1000);
sv({...data,factures:facs.map(x=>x.id===fc.id?{...x,statut:"Envoyée"}:x)});setEmailModal(null);ms("PDF + Email ouvert!");};
const pdfF=fc=>{const cl=gCl(fc.clientId)||{};const c=calcF(fc.details,fc.avecTPS,fc.avecTVQ);const eI=data.settings?.entreprise||ent;const tN=data.settings?.tpsNum||"";const vN=data.settings?.tvqNum||"";let rH=fc.details.map(d=>{const q=parseFloat(d.quantite)||0;const p=parseFloat(d.prixUnitaire)||0;const t=q*p;const dtH=d.dt?`<br/><span style="color:#94a3b8;font-size:10px">DT:</span><br/>${d.dt.replace(/\n/g,"<br/>")}`:"";
return`<tr><td><div style="font-size:11px;color:#475569">${d.description||"—"}${dtH}</div></td><td class="r">${fN(q)} kg</td><td class="r">${fN(p)}</td><td class="r b">${fM(t)}</td></tr>`;}).join("");let tH=`<div class="ts"><div class="tr"><span>Sous-total</span><span class="b">${fM(c.st)}</span></div>`;if(fc.avecTPS)tH+=`<div class="tr"><span>TPS ${tN} 5%</span><span>${fM(c.tv)}</span></div>`;if(fc.avecTVQ)tH+=`<div class="tr"><span>TVQ ${vN} 9.975%</span><span>${fM(c.qv)}</span></div>`;tH+=`<div class="tr t"><span>Total</span><span>${fM(c.total)}</span></div></div>`;openPrint("Facture "+fc.numero,`<div class="hdr"><div class="av">JW</div><div class="ci"><strong>${eI.nom}</strong><br/>${eI.adresse||""}<br/>${eI.ville||""}<br/>${eI.telephone||""}<br/>${eI.courriel||""}</div></div>${fc.periode?`<div class="per">Semaine du ${fc.periode}</div>`:""}<div style="display:flex;gap:30px;margin-bottom:16px"><div style="flex:1"><div class="mr"><span class="l">Facture</span><span class="v">${fc.numero}</span></div><div class="mr"><span class="l">Date</span><span class="v">${fc.date}</span></div><div class="mr"><span class="l">Total</span><span class="v">${fM(c.total)}</span></div><div class="mr"><span class="l">Statut</span><span class="bg">${fc.statut}</span></div></div><div class="cb"><strong>${cl.nom||"—"}</strong><br/>${cl.adresse||""}<br/>${cl.ville||""}</div></div><table><thead><tr><th>Description</th><th class="r">Quantité</th><th class="r">Prix unit.</th><th class="r">Total</th></tr></thead><tbody>${rH}</tbody></table>${tH}<div class="ft">${eI.nom} - ${eI.courriel||""} - ${eI.telephone||""}</div>`);};
const c=calcF(f.details,f.avecTPS,f.avecTVQ);
return<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><h1 style={{fontSize:22,fontWeight:800}}>Factures</h1><div style={{display:"flex",gap:6}}><Bt variant="outline" color={C.cyan} onClick={()=>setShowE(true)} size="sm">Entreprise</Bt><Bt onClick={()=>{setEid(null);setF(ef);setM(true);}} color={C.purple}>+ Nouvelle</Bt></div></div>
<div style={{display:"flex",gap:8,marginBottom:12}}><St title="Total" value={facs.length} color={C.accent}/><St title="En cours" value={fM(facs.filter(x=>x.statut!=="Payée"&&x.statut!=="Annulée").reduce((s,x)=>s+(x.total||0),0))} color={C.orange}/><St title="Payées" value={fM(facs.filter(x=>x.statut==="Payée").reduce((s,x)=>s+(x.total||0),0))} color={C.green}/></div>
<Tb columns={[{key:"numero",label:"No",render:r=><span style={{fontWeight:700,color:C.accent,fontSize:11}}>{r.numero}</span>},{key:"date",label:"Date",render:r=>fDs(r.date)},{key:"cl",label:"Client",render:r=><b>{gCl(r.clientId)?.nom||"—"}</b>},{key:"total",label:"Total",align:"right",render:r=><span style={{fontWeight:800,color:C.green}}>{fM(r.total)}</span>},{key:"statut",label:"Statut",render:r=><Bg text={r.statut} color={FCOL[r.statut]||C.muted}/>},{key:"a",label:"",render:r=><div style={{display:"flex",gap:3}}><button onClick={()=>emailF(r)} style={{background:"none",border:"none",cursor:"pointer",color:C.green,fontSize:10,fontWeight:700}}>Email</button><button onClick={()=>pdfF(r)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10,fontWeight:700}}>PDF</button><button onClick={()=>{setEid(r.id);setF({clientId:r.clientId,date:r.date,dateLimite:r.dateLimite||"",periode:r.periode||"",details:r.details||[],avecTPS:r.avecTPS!==false,avecTVQ:r.avecTVQ!==false,statut:r.statut});setM(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:10}}>Edit</button><button onClick={()=>del(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>Del</button></div>}]} data={[...facs].sort((a,b)=>b.date.localeCompare(a.date))}/>
<Mo open={showE} onClose={()=>setShowE(false)} title="Info Entreprise" width={520}><In label="Nom" value={ent.nom} onChange={v=>setEnt({...ent,nom:v})} style={{marginBottom:10}}/><In label="Adresse" value={ent.adresse} onChange={v=>setEnt({...ent,adresse:v})} style={{marginBottom:10}}/><In label="Ville" value={ent.ville} onChange={v=>setEnt({...ent,ville:v})} style={{marginBottom:10}}/><div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><In label="Tél" value={ent.telephone} onChange={v=>setEnt({...ent,telephone:v})}/><In label="Courriel" value={ent.courriel} onChange={v=>setEnt({...ent,courriel:v})}/></div><In label="NEQ" value={ent.neq||""} onChange={v=>setEnt({...ent,neq:v})} style={{marginBottom:10}}/><div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><In label="No TPS" value={tpsN} onChange={setTpsN}/><In label="No TVQ" value={tvqN} onChange={setTvqN}/></div><div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Bt variant="outline" color={C.muted} onClick={()=>setShowE(false)}>Annuler</Bt><Bt onClick={saveE} color={C.cyan}>Sauvegarder</Bt></div></Mo>
<Mo open={m} onClose={()=>setM(false)} title={eid?"Modifier facture":"Nouvelle facture"} width={820}>
<div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><In label="Client *" value={f.clientId} onChange={v=>setF({...f,clientId:v})} options={[{value:"",label:"— Choisir —"},...cls.map(c=>({value:c.id,label:c.nom}))]}/><In label="Statut" value={f.statut} onChange={v=>setF({...f,statut:v})} options={FSTAT.map(s=>({value:s,label:s}))}/></div>
<div className="jw-grid3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}><In label="Date" type="date" value={f.date} onChange={v=>setF({...f,date:v})}/><In label="Date limite" type="date" value={f.dateLimite} onChange={v=>setF({...f,dateLimite:v})}/><In label="Période" value={f.periode} onChange={v=>setF({...f,periode:v})} placeholder="26 au 30 Janvier 2026"/></div>
<div style={{display:"flex",gap:16,marginBottom:10,padding:"8px 12px",background:C.card2,borderRadius:8,alignItems:"center",flexWrap:"wrap"}}><Ck label="TPS (5%)" checked={f.avecTPS} onChange={v=>setF({...f,avecTPS:v})}/><Ck label="TVQ (9.975%)" checked={f.avecTVQ} onChange={v=>setF({...f,avecTVQ:v})}/><div style={{marginLeft:"auto",display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:10,color:C.dim}}>Sem. voyages:</span><input type="date" value={fWk} onChange={e=>setFWk(e.target.value)} style={{background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:5,padding:"4px 8px",fontSize:11}}/></div></div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,fontWeight:700,color:C.muted}}>DÉTAILS</span><div style={{display:"flex",gap:4}}><Bt size="sm" color={C.accent} onClick={()=>addDZ("06")}>+ MTL</Bt><Bt size="sm" color={C.cyan} onClick={()=>addDZ("13")}>+ LAV</Bt><Bt size="sm" variant="outline" color={C.muted} onClick={addD}>+ Vide</Bt></div></div>
{f.details.map((d,idx)=>{const q=parseFloat(d.quantite)||0;const p=parseFloat(d.prixUnitaire)||0;const t=Math.round(q*p*100)/100;return<div key={d.id} style={{background:C.bg,borderRadius:10,padding:12,marginBottom:8,border:`1px solid ${C.border}`}}><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}><span style={{fontWeight:800,color:C.accent,width:18}}>{idx+1}</span><select value={d.zone||"06"} onChange={e=>upD(d.id,"zone",e.target.value)} style={{background:C.card,color:C.text,border:`1px solid ${C.border}`,borderRadius:5,padding:5,fontSize:11,minWidth:130}}>{ZONES.map(z=><option key={z.v} value={z.v}>{z.l} ({z.rate}$)</option>)}</select><In value={d.description} onChange={v=>upD(d.id,"description",v)} placeholder="Description" style={{flex:2}}/><In type="number" value={d.quantite} onChange={v=>upD(d.id,"quantite",v)} placeholder="Qté" style={{maxWidth:85}}/><span style={{fontSize:10,color:C.dim}}>kg</span><In type="number" value={d.prixUnitaire} onChange={v=>upD(d.id,"prixUnitaire",v)} placeholder="Prix" style={{maxWidth:70}}/><div style={{minWidth:80,textAlign:"right"}}><div style={{fontSize:8,color:C.dim}}>S-TOTAL</div><div style={{fontSize:13,fontWeight:800,color:t>0?C.green:C.dim}}>{t>0?fM(t):"—"}</div></div>{f.details.length>1&&<button onClick={()=>rmD(d.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red}}>X</button>}</div><div style={{marginLeft:24}}><In value={d.dt||""} onChange={v=>upD(d.id,"dt",v)} placeholder="DT — numéros fiches, jours..." multiline/></div></div>;})}
<div style={{background:C.card2,borderRadius:10,padding:14,marginBottom:14,marginTop:8}}><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:12}}>Sous-total (Qté × Prix)</span><span style={{fontWeight:700,fontSize:14}}>{fM(c.st)}</span></div>{f.avecTPS&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:12}}>TPS 5%</span><span>{fM(c.tv)}</span></div>}{f.avecTVQ&&<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}><span style={{color:C.muted,fontSize:12}}>TVQ 9.975%</span><span>{fM(c.qv)}</span></div>}<div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",marginTop:4}}><span style={{fontWeight:800,fontSize:14}}>TOTAL</span><span style={{fontWeight:900,fontSize:20,color:C.green}}>{fM(c.total)}</span></div></div>
<div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Bt variant="outline" color={C.muted} onClick={()=>setM(false)}>Annuler</Bt>{eid&&<Bt onClick={()=>{hs();setTimeout(()=>{const fc=data.factures.find(x=>x.id===eid);if(fc)emailF(fc);},100);}} color={C.green} size="lg">Enregistrer & Email</Bt>}<Bt onClick={hs} color={C.purple} size="lg">Enregistrer</Bt></div>
</Mo>
<Mo open={!!emailModal} onClose={()=>setEmailModal(null)} title="Envoyer facture par email" width={450}>
<div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:12,color:C.muted,marginBottom:4}}>Destinataire</div><div style={{fontSize:16,fontWeight:700,color:C.accentL}}>{emailModal?.clEmail}</div></div>
<div style={{background:C.bg,borderRadius:8,padding:12,marginBottom:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
<div style={{fontWeight:700,color:C.text,marginBottom:4}}>Comment ça marche :</div>
1. La facture PDF s'ouvre pour impression<br/>
2. Sauvegardez-la en PDF (Ctrl+P {"→"} Save as PDF)<br/>
3. L'email s'ouvre avec le message pré-rempli<br/>
4. Joignez le PDF et envoyez !
</div>
<div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Choisir votre messagerie :</div>
<div style={{display:"flex",flexDirection:"column",gap:8}}>
<button onClick={()=>sendEmail("gmail")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",color:C.text}}>
<div style={{width:38,height:38,borderRadius:8,background:"#ea4335",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>G</div>
<div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700}}>Gmail</div><div style={{fontSize:10,color:C.muted}}>PDF + ouvrir Gmail</div></div></button>
<button onClick={()=>sendEmail("outlook")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",color:C.text}}>
<div style={{width:38,height:38,borderRadius:8,background:"#0078d4",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>O</div>
<div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700}}>Outlook</div><div style={{fontSize:10,color:C.muted}}>PDF + ouvrir Outlook</div></div></button>
<button onClick={()=>sendEmail("mailto")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",color:C.text}}>
<div style={{width:38,height:38,borderRadius:8,background:C.dim,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>@</div>
<div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700}}>App par défaut</div><div style={{fontSize:10,color:C.muted}}>PDF + app email du système</div></div></button>
</div>
</Mo>
</div>;}

function Compta({data,sv,ms}){const[m,setM]=useState(false);const[eid,setEid]=useState(null);const e={date:today(),categorie:"Essence",description:"",montant:""};const[f,setF]=useState(e);const deps=data.depenses||[];
const hs=()=>{if(!f.montant){ms("$!","error");return;}sv({...data,depenses:eid?deps.map(d=>d.id===eid?{id:eid,...f,montant:parseFloat(f.montant)||0}:d):[...deps,{id:gid(),...f,montant:parseFloat(f.montant)||0}]});ms("OK!");setM(false);setEid(null);setF(e);};
return<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h1 style={{fontSize:22,fontWeight:800}}>Comptabilité</h1><Bt onClick={()=>{setEid(null);setF(e);setM(true);}} color={C.orange}>+</Bt></div>
<Tb columns={[{key:"date",label:"Date",render:r=>fDs(r.date)},{key:"categorie",label:"Cat.",render:r=><Bg text={r.categorie} color={DCOLORS[r.categorie]||C.muted}/>},{key:"description",label:"Desc."},{key:"tax",label:"Impôt",render:r=><span style={{fontSize:9,color:TAX_INFO[r.categorie]?.startsWith("✅")?C.green:C.orange}}>{TAX_INFO[r.categorie]?.startsWith("✅")?"✅ Déduc.":"⚠️ Partiel"}</span>},{key:"montant",label:"$",align:"right",render:r=><span style={{fontWeight:700,color:C.red}}>{fM(r.montant)}</span>},{key:"a",label:"",render:r=><div style={{display:"flex",gap:3}}><button onClick={()=>{setEid(r.id);setF({date:r.date,categorie:r.categorie,description:r.description,montant:r.montant});setM(true);}} style={{background:"none",border:"none",cursor:"pointer",color:C.accent,fontSize:10}}>Edit</button><button onClick={()=>{sv({...data,depenses:deps.filter(d=>d.id!==r.id)});ms("OK!");}} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>Del</button></div>}]} data={deps.sort((a,b)=>b.date.localeCompare(a.date))}/>
<Mo open={m} onClose={()=>setM(false)} title={eid?"Modifier":"Nouvelle"} width={480}><div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}><In label="Date" type="date" value={f.date} onChange={v=>setF({...f,date:v})}/><In label="Cat." value={f.categorie} onChange={v=>setF({...f,categorie:v})} options={DCATS}/></div>{f.categorie&&TAX_INFO[f.categorie]&&<div style={{padding:"6px 10px",borderRadius:6,background:TAX_INFO[f.categorie].startsWith("✅")?C.green+"18":C.orange+"18",fontSize:10,color:TAX_INFO[f.categorie].startsWith("✅")?C.green:C.orange,marginBottom:10}}>{TAX_INFO[f.categorie]}</div>}<In label="Description" value={f.description} onChange={v=>setF({...f,description:v})} style={{marginBottom:10}}/><In label="$" type="number" value={f.montant} onChange={v=>setF({...f,montant:v})} style={{marginBottom:14}}/><div style={{display:"flex",justifyContent:"flex-end",gap:8}}><Bt variant="outline" color={C.muted} onClick={()=>setM(false)}>Annuler</Bt><Bt onClick={hs} color={C.orange}>OK</Bt></div></Mo></div>;}

function Paie({data}){const[wk,setWk]=useState(gMon());const wd=useMemo(()=>gWk(wk),[wk]);const st=data.settings||def.settings;
const eI=data.settings?.entreprise||def.settings.entreprise;
const wv=useMemo(()=>data.voyages.filter(v=>v.date>=wd[0]&&v.date<=wd[4]),[data.voyages,wd]);
const ed=useMemo(()=>data.chauffeurs.filter(c=>c.aktif).map(ch=>{let voyDetails=[];wv.forEach(v=>{if(v.chofè===ch.id||v.helpers?.includes(ch.id))(v.trips||[]).forEach(t=>{if(t.nbVoyages>0)voyDetails.push({date:v.date,zone:t.zone,nb:t.nbVoyages||0});});});const vy=voyDetails.reduce((s,d)=>s+d.nb,0);const tx=parseFloat(ch.tauxPersonnel)||(ch.role==="Chauffeur"?st.tauxChauffeur:st.tauxHelper);return{...ch,vy,tx,br:vy*tx,voyDetails};}).filter(c=>c.vy>0),[data.chauffeurs,wv,st]);
const tot=ed.reduce((s,e)=>s+e.br,0);
const pdfAll=()=>{openPrint("Paie",`<h1>${eI.nom} \u2014 Paie</h1><p style="margin:8px 0 16px;color:#64748b">Semaine ${fD(wd[0])} au ${fD(wd[4])}</p><table><thead><tr><th>Employ\u00e9</th><th>R\u00f4le</th><th class="r">Voy.</th><th class="r">Taux</th><th class="r">Brut</th></tr></thead><tbody>${ed.map(e=>`<tr><td>${e.nom}</td><td>${e.role}</td><td class="r">${e.vy}</td><td class="r">${fM(e.tx)}</td><td class="r b">${fM(e.br)}</td></tr>`).join("")}</tbody></table><div class="ts"><div class="tr t"><span>TOTAL</span><span>${fM(tot)}</span></div></div>`);};
const talonPdf=(e)=>{const jours={};e.voyDetails.forEach(d=>{const k=d.date;if(!jours[k])jours[k]={date:k,zones:{}};if(!jours[k].zones[d.zone])jours[k].zones[d.zone]=0;jours[k].zones[d.zone]+=d.nb;});
const jourRows=Object.values(jours).sort((a,b)=>a.date.localeCompare(b.date)).map(j=>{const zList=Object.entries(j.zones).map(([z,n])=>`${ZM[z]||z}: ${n}`).join(", ");const dayTotal=Object.values(j.zones).reduce((s,n)=>s+n,0);return`<tr><td>${fD(j.date)}</td><td>${zList}</td><td class="r b">${dayTotal}</td></tr>`;}).join("");
const w=window.open("","_blank");if(!w)return;
w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Talon de paie - ${e.nom}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}
body{background:#fff;color:#1a1a1a;padding:20px}
.stub{max-width:700px;margin:0 auto;border:2px solid #1e293b;border-radius:8px;overflow:hidden}
.header{background:#1e293b;color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:center}
.header h2{font-size:18px;font-weight:800}
.header .sub{font-size:11px;color:#94a3b8;margin-top:2px}
.co-info{font-size:10px;text-align:right;color:#94a3b8;line-height:1.6}
.co-info strong{color:#fff;font-size:12px}
.section{padding:16px 24px;border-bottom:1px solid #e2e8f0}
.section:last-child{border-bottom:none}
.section-title{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;margin-bottom:10px}
.row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px}
.row .label{color:#64748b}.row .val{font-weight:600}
.row.highlight{background:#f0fdf4;padding:8px 12px;border-radius:6px;margin:4px -12px;font-size:14px}
.row.highlight .val{color:#16a34a;font-weight:800}
table{width:100%;border-collapse:collapse;margin:8px 0}
th{background:#f8fafc;padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;color:#64748b;border:1px solid #e2e8f0}
td{padding:6px 10px;font-size:11px;border:1px solid #e2e8f0}
.r{text-align:right}.b{font-weight:700}
.footer{background:#f8fafc;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#94a3b8}
.net-box{background:#1e293b;color:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center}
.net-box .label{font-size:12px;color:#94a3b8}.net-box .amount{font-size:24px;font-weight:900;color:#4ade80}
@media print{body{padding:0}.stub{border:1px solid #ccc}}
</style></head><body>
<div class="stub">
<div class="header">
<div><h2>TALON DE PAIE</h2><div class="sub">P\u00e9riode : ${fD(wd[0])} au ${fD(wd[4])}</div></div>
<div class="co-info"><strong>${eI.nom}</strong><br/>${eI.adresse||""}<br/>${eI.ville||""}<br/>${eI.telephone||""}<br/>${eI.courriel||""}</div>
</div>
<div class="section">
<div class="section-title">Information de l'employ\u00e9</div>
<div class="row"><span class="label">Nom complet</span><span class="val">${e.nom}</span></div>
<div class="row"><span class="label">R\u00f4le</span><span class="val">${e.role}</span></div>
<div class="row"><span class="label">Taux par voyage</span><span class="val">${fM(e.tx)}</span></div>
</div>
<div class="section">
<div class="section-title">D\u00e9tail des voyages</div>
<table><thead><tr><th>Date</th><th>Zones</th><th class="r">Voyages</th></tr></thead><tbody>${jourRows}</tbody></table>
<div class="row" style="margin-top:8px;padding-top:8px;border-top:2px solid #e2e8f0"><span class="label" style="font-weight:700">Total voyages</span><span class="val" style="font-size:14px">${e.vy}</span></div>
</div>
<div class="section">
<div class="section-title">Calcul de la r\u00e9mun\u00e9ration</div>
<div class="row"><span class="label">Nombre de voyages</span><span class="val">${e.vy}</span></div>
<div class="row"><span class="label">Taux par voyage</span><span class="val">${fM(e.tx)}</span></div>
<div class="row"><span class="label">Calcul</span><span class="val">${e.vy} \u00d7 ${fM(e.tx)}</span></div>
</div>
<div class="net-box">
<span class="label">MONTANT NET \u00c0 PAYER</span>
<span class="amount">${fM(e.br)}</span>
</div>
<div class="footer">
<span>${eI.nom} \u2022 ${eI.adresse||""} \u2022 ${eI.ville||""}</span>
<span>Date d'\u00e9mission : ${fD(today())}</span>
</div>
</div>
<script>window.onload=function(){window.print()}<\\/script>
</body></html>`);w.document.close();};
const[paieEmail,setPaieEmail]=useState(null);
const talonEmail=(e)=>{setPaieEmail({emp:e,nom:e.nom,email:e.courriel||""});};
const sendTalonEmail=(provider)=>{if(!paieEmail)return;const e=paieEmail.emp;
talonPdf(e);
setTimeout(()=>{const subject=encodeURIComponent(`Talon de paie - ${e.nom} - Semaine ${fD(wd[0])} au ${fD(wd[4])}`);
const body=encodeURIComponent(`Bonjour ${e.nom},\n\nVeuillez trouver ci-joint votre talon de paie pour la semaine du ${fD(wd[0])} au ${fD(wd[4])}.\n\nDétails :\n- Voyages : ${e.vy}\n- Taux : ${fM(e.tx)}\n- Montant : ${fM(e.br)}\n\nCordialement,\n${eI.nom}\n${eI.telephone||""}`);
let url;
if(provider==="gmail"){url=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(paieEmail.email)}&su=${subject}&body=${body}`;}
else if(provider==="outlook"){url=`https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(paieEmail.email)}&subject=${subject}&body=${body}`;}
else{url=`mailto:${paieEmail.email}?subject=${subject}&body=${body}`;}
window.open(url,"_blank");setPaieEmail(null);},1000);};
return<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h1 style={{fontSize:22,fontWeight:800}}>Paie</h1><Bt variant="outline" color={C.red} onClick={pdfAll}>PDF Global</Bt></div>
<In label="Semaine" type="date" value={wk} onChange={setWk} style={{maxWidth:180,marginBottom:12}}/>
<div style={{display:"flex",gap:8,marginBottom:12}}><St title="Emp." value={ed.length} color={C.accent}/><St title="Voy." value={wv.reduce((s,v)=>(v.trips||[]).reduce((s2,t)=>s2+(t.nbVoyages||0),s),0)} color={C.green}/><St title="Total" value={fM(tot)} grad={C.g3}/></div>
<Tb columns={[{key:"nom",label:"Nom"},{key:"role",label:"Rôle",render:r=><Bg text={r.role} color={r.role==="Chauffeur"?C.accent:C.purple}/>},{key:"vy",label:"V.",align:"center"},{key:"tx",label:"Taux",align:"right",render:r=>fM(r.tx)},{key:"br",label:"Brut",align:"right",render:r=><span style={{fontWeight:700,color:C.green}}>{fM(r.br)}</span>},{key:"a",label:"",render:r=><div style={{display:"flex",gap:4}}><button onClick={()=>talonPdf(r)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10,fontWeight:700}}>PDF</button><button onClick={()=>talonEmail(r)} style={{background:"none",border:"none",cursor:"pointer",color:C.green,fontSize:10,fontWeight:700}}>Email</button></div>}]} data={ed}/>
{paieEmail&&<Mo open={true} onClose={()=>setPaieEmail(null)} title="Envoyer talon de paie" width={450}>
<div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:12,color:C.muted,marginBottom:4}}>{paieEmail.nom}</div><div style={{fontSize:16,fontWeight:700,color:C.accentL}}>{paieEmail.email||"Pas de courriel"}</div></div>
{!paieEmail.email?<div style={{background:C.bg,borderRadius:8,padding:14,textAlign:"center",color:C.orange,fontSize:12}}>Cet employé n'a pas de courriel. Ajoutez-le dans l'onglet Chauffeurs.</div>:
<><div style={{background:C.bg,borderRadius:8,padding:12,marginBottom:14,fontSize:11,color:C.muted,lineHeight:1.6}}>
<div style={{fontWeight:700,color:C.text,marginBottom:4}}>Étapes :</div>
1. Le talon PDF s'ouvre pour impression<br/>
2. Sauvegardez en PDF (Ctrl+P {"→"} Save as PDF)<br/>
3. L'email s'ouvre pré-rempli<br/>
4. Joignez le PDF et envoyez !
</div>
<div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Messagerie :</div>
<div style={{display:"flex",flexDirection:"column",gap:8}}>
<button onClick={()=>sendTalonEmail("gmail")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",color:C.text}}>
<div style={{width:38,height:38,borderRadius:8,background:"#ea4335",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>G</div>
<div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700}}>Gmail</div><div style={{fontSize:10,color:C.muted}}>PDF + Gmail</div></div></button>
<button onClick={()=>sendTalonEmail("outlook")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",color:C.text}}>
<div style={{width:38,height:38,borderRadius:8,background:"#0078d4",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>O</div>
<div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700}}>Outlook</div><div style={{fontSize:10,color:C.muted}}>PDF + Outlook</div></div></button>
<button onClick={()=>sendTalonEmail("mailto")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.card,cursor:"pointer",color:C.text}}>
<div style={{width:38,height:38,borderRadius:8,background:C.dim,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:"#fff"}}>@</div>
<div style={{textAlign:"left"}}><div style={{fontSize:13,fontWeight:700}}>App par défaut</div><div style={{fontSize:10,color:C.muted}}>PDF + app email</div></div></button>
</div></>}
</Mo>}
</div>;}

function KalandryePaie({data,sv,ms}){
const st=data.settings||def.settings;
const ps=st.payrollSchedule||{frequency:"weekly",payDelay:2,payDay:5};
const[month,setMonth]=useState(today().substring(0,7));
const[showCfg,setShowCfg]=useState(false);
const[cfgFreq,setCfgFreq]=useState(ps.frequency);
const[cfgDelay,setCfgDelay]=useState(ps.payDelay);
const[cfgDay,setCfgDay]=useState(ps.payDay);

const periods=useMemo(()=>getPayPeriods(today(),30,st,data.voyages||[]),[st,data.voyages]);
const todayStr=today();
const upcoming=useMemo(()=>periods.filter(p=>p.payDate>=todayStr),[periods,todayStr]);
const nextPay=upcoming[0];
const daysUntil=nextPay?Math.ceil((new Date(nextPay.payDate+"T12:00:00")-new Date(todayStr+"T12:00:00"))/86400000):null;

const payDates=useMemo(()=>{const s=new Set();periods.forEach(p=>s.add(p.payDate));return s;},[periods]);
const workDates=useMemo(()=>{const s=new Set();(data.voyages||[]).forEach(v=>{if(v.date)s.add(v.date);});return s;},[data.voyages]);
const payDateMap=useMemo(()=>{const m={};periods.forEach(p=>{m[p.payDate]=p;});return m;},[periods]);

const saveCfg=()=>{const nd={...data,settings:{...st,payrollSchedule:{frequency:cfgFreq,payDelay:cfgDelay,payDay:cfgDay}}};sv(nd);ms("Paramètres de paie sauvegardés!");setShowCfg(false);};

const[y,m]=month.split("-").map(Number);
const mName=new Date(y,m-1,1).toLocaleDateString("fr-CA",{month:"long",year:"numeric"});
const firstDow=(new Date(y,m-1,1).getDay()+6)%7;
const daysInMonth=new Date(y,m,0).getDate();
const cells=[];
for(let i=0;i<firstDow;i++)cells.push(null);
for(let d=1;d<=daysInMonth;d++){const ds=`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;cells.push(ds);}

const prevM=()=>{const d=new Date(y,m-2,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
const nextM=()=>{const d=new Date(y,m,1);setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};

return<div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:20}}>
<h1 style={{fontSize:22,fontWeight:900}}>Calendrier de Paie</h1>
<Bt onClick={()=>setShowCfg(true)} variant="outline" size="sm">Param\u00e8tres</Bt>
</div>

<div className="jw-wrap" style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
<St title="Prochaine Paie" value={nextPay?fDs(nextPay.payDate):"—"} color={C.accent}/>
<St title="Dans" value={daysUntil!==null?(daysUntil===0?"Aujourd'hui!":daysUntil+" jours"):"—"} grad={daysUntil===0?C.g2:C.g1}/>
<St title="D\u00e9lai" value={ps.payDelay+" sem."} color={C.orange}/>
<St title="Fr\u00e9quence" value={ps.frequency==="biweekly"?"Aux 2 sem.":"Chaque sem."} color={C.cyan}/>
</div>

<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",marginBottom:20}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
<button onClick={prevM} style={{background:"none",border:"none",cursor:"pointer",color:C.accentL,fontSize:20,fontWeight:700,padding:"4px 12px"}}>{"\u25C0"}</button>
<div style={{fontSize:16,fontWeight:800,color:C.text,textTransform:"capitalize"}}>{mName}</div>
<button onClick={nextM} style={{background:"none",border:"none",cursor:"pointer",color:C.accentL,fontSize:20,fontWeight:700,padding:"4px 12px"}}>{"\u25B6"}</button>
</div>

<div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
{["LUN","MAR","MER","JEU","VEN","SAM","DIM"].map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:C.muted,padding:"6px 0",textTransform:"uppercase"}}>{d}</div>)}
{cells.map((ds,i)=>{
if(!ds)return<div key={"e"+i}/>;
const dayNum=parseInt(ds.split("-")[2]);
const isPay=payDates.has(ds);
const isToday=ds===todayStr;
const isPast=ds<todayStr;
const hasWork=workDates.has(ds);
const isNext=nextPay&&ds===nextPay.payDate;
const pInfo=payDateMap[ds];
let bg="transparent";
let border="2px solid transparent";
let color=C.text;
if(isPay&&isPast){bg=C.green+"20";color=C.green;}
else if(isNext){bg=C.accent+"35";color="#fff";}
else if(isPay){bg=C.purple+"20";color=C.purple;}
if(isToday)border=`2px solid ${C.accentL}`;
if(hasWork&&!isPay)bg=C.cyan+"10";
return<div key={ds} title={isPay?(pInfo?`Paie pour sem. ${fDs(pInfo.weekMon)} - ${fDs(pInfo.weekFri)}${pInfo.trips?` (${pInfo.trips} voyages)`:""}`:ds):hasWork?"Jour de travail":""} style={{textAlign:"center",padding:"8px 2px",borderRadius:8,background:bg,border,cursor:isPay?"pointer":"default",position:"relative",minHeight:38}}>
<div style={{fontSize:13,fontWeight:isPay||isToday?800:400,color}}>{dayNum}</div>
{isPay&&<div style={{width:6,height:6,borderRadius:3,background:isPast?C.green:isNext?C.accent:C.purple,margin:"2px auto 0"}}/>}
</div>;})}
</div>

<div style={{display:"flex",gap:16,marginTop:12,flexWrap:"wrap"}}>
<div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:C.muted}}><div style={{width:10,height:10,borderRadius:5,background:C.green}}/> D\u00e9j\u00e0 pay\u00e9</div>
<div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:C.muted}}><div style={{width:10,height:10,borderRadius:5,background:C.accent}}/> Prochaine paie</div>
<div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:C.muted}}><div style={{width:10,height:10,borderRadius:5,background:C.purple}}/> \u00C0 venir</div>
<div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:C.muted}}><div style={{width:10,height:10,borderRadius:2,background:C.cyan+"40"}}/> Jour de travail</div>
<div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:C.muted}}><div style={{width:10,height:10,borderRadius:2,border:`2px solid ${C.accentL}`}}/> Aujourd'hui</div>
</div>
</div>

<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
<div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:12}}>Prochains Paiements</div>
{upcoming.slice(0,6).map((p,i)=>{
const tripCount=p.trips;
const emps=data.chauffeurs?.filter(c=>c.aktif)||[];
const weekVoys=p.voyages||[];
let totalPay=0;
emps.forEach(ch=>{let nv=0;weekVoys.forEach(v=>{if(v.chof\u00e8===ch.id||v.helpers?.includes(ch.id))(v.trips||[]).forEach(t=>{nv+=(t.nbVoyages||0);});});const tx=parseFloat(ch.tauxPersonnel)||(ch.role==="Chauffeur"?st.tauxChauffeur:st.tauxHelper);totalPay+=nv*tx;});
const isPast=p.payDate<todayStr;
const isNext=i===0;
return<div key={p.weekMon} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:isNext?C.accent+"12":isPast?C.green+"08":"transparent",border:`1px solid ${isNext?C.accent+"30":isPast?C.green+"20":C.border}`,marginBottom:6}}>
<div style={{width:40,height:40,borderRadius:10,background:isPast?C.green+"20":isNext?C.accent+"25":C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{isPast?"\u2705":isNext?"\uD83D\uDCB0":"\uD83D\uDCC5"}</div>
<div style={{flex:1,minWidth:0}}>
<div style={{fontSize:13,fontWeight:700,color:isNext?C.accentL:isPast?C.green:C.text}}>{fD(p.payDate)}</div>
<div style={{fontSize:10,color:C.muted}}>Pour sem. {fDs(p.weekMon)} \u2192 {fDs(p.weekFri)} {tripCount>0?`\u2022 ${tripCount} voyages`:""}</div>
</div>
<div style={{textAlign:"right",flexShrink:0}}>
{totalPay>0&&<div style={{fontSize:13,fontWeight:800,color:isNext?C.accentL:C.green}}>{fM(totalPay)}</div>}
<div style={{fontSize:9,color:C.dim}}>{isPast?"Pay\u00e9":isNext?"Prochain":"\u00C0 venir"}</div>
</div>
</div>;})}
</div>

{showCfg&&<Mo open={true} onClose={()=>setShowCfg(false)} title="Param\u00e8tres du Calendrier de Paie" width={450}>
<div style={{display:"flex",flexDirection:"column",gap:14}}>
<In label="Fr\u00e9quence" value={cfgFreq} onChange={setCfgFreq} options={[{v:"weekly",l:"Chaque semaine"},{v:"biweekly",l:"Aux 2 semaines"}]}/>
<In label="D\u00e9lai de paiement (semaines)" type="number" value={cfgDelay} onChange={v=>setCfgDelay(parseInt(v)||0)}/>
<In label="Jour de paiement" value={cfgDay} onChange={v=>setCfgDay(parseInt(v)||5)} options={[{v:1,l:"Lundi"},{v:2,l:"Mardi"},{v:3,l:"Mercredi"},{v:4,l:"Jeudi"},{v:5,l:"Vendredi"}]}/>
<div style={{background:C.card2,borderRadius:10,padding:14}}>
<div style={{fontSize:11,color:C.muted,marginBottom:6}}>Explication</div>
<div style={{fontSize:12,color:C.text,lineHeight:1.6}}>Si vous travaillez la semaine 1, avec un d\u00e9lai de {cfgDelay} semaine(s), vous serez pay\u00e9 le {JRSK[cfgDay]||"Vendredi"}, {cfgDelay} semaine(s) apr\u00e8s.</div>
</div>
<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
<Bt variant="outline" color={C.dim} onClick={()=>setShowCfg(false)}>Annuler</Bt>
<Bt onClick={saveCfg}>Sauvegarder</Bt>
</div>
</div>
</Mo>}
</div>;}

function LivreComptable({data,sv,ms}){
const[tab,setTab]=useState("journal");
const[periodM,setPeriodM]=useState(today().substring(0,7));
const[showAdd,setShowAdd]=useState(false);
const[txForm,setTxForm]=useState({date:today(),type:"debit",compte:"",description:"",montant:"",categorie:"exploitation"});

// Chart des comptes
const COMPTES={
actif:["Encaisse","Comptes clients","Véhicules","Équipement"],
passif:["Comptes fournisseurs","Taxes à payer","Emprunt"],
revenu:["Revenus transport","Revenus livraison","Autres revenus"],
depense:["Carburant","Assurance","Entretien véhicules","Nourriture","Fournitures","Salaires","Loyer","Téléphone","Autres dépenses"]
};

// Auto-generate transactions from app data
const autoTx=useMemo(()=>{
const tx=[];
// Factures → revenus
(data.factures||[]).forEach(f=>{
tx.push({id:"fac-"+f.id,date:f.date,type:"credit",compte:"Revenus transport",description:`Facture ${f.numero} — ${(data.clients||[]).find(c=>c.id===f.clientId)?.nom||"Client"}`,montant:f.sousTotal||0,categorie:"revenu",source:"auto",ref:f.numero});
if(f.tps)tx.push({id:"tps-"+f.id,date:f.date,type:"credit",compte:"Taxes à payer",description:`TPS ${f.numero}`,montant:f.tps,categorie:"passif",source:"auto",ref:f.numero});
if(f.tvq)tx.push({id:"tvq-"+f.id,date:f.date,type:"credit",compte:"Taxes à payer",description:`TVQ ${f.numero}`,montant:f.tvq,categorie:"passif",source:"auto",ref:f.numero});
// Comptes à recevoir
if(f.statut!=="Payée")tx.push({id:"ar-"+f.id,date:f.date,type:"debit",compte:"Comptes clients",description:`À recevoir: ${f.numero}`,montant:f.total||0,categorie:"actif",source:"auto",ref:f.numero});
});
// Dépenses
(data.depenses||[]).forEach(d=>{
let cpt="Autres dépenses";
if(d.categorie==="Essence")cpt="Carburant";
else if(d.categorie==="Assurance")cpt="Assurance";
else if(d.categorie==="Entretien")cpt="Entretien véhicules";
else if(d.categorie==="Autre"&&d.description?.toLowerCase().includes("nourrit"))cpt="Nourriture";
tx.push({id:"dep-"+d.id,date:d.date,type:"debit",compte:cpt,description:d.description||d.categorie,montant:d.montant||0,categorie:"depense",source:"auto"});
});
// Entretiens
(data.entretiens||[]).forEach(e=>{
const v=(data.vehicules||[]).find(x=>x.id===e.vehiculeId);
tx.push({id:"ent-"+e.id,date:e.date,type:"debit",compte:"Entretien véhicules",description:`${v?.nom||"Véhicule"}: ${e.type} — ${e.description||""}`.substring(0,80),montant:e.cout||0,categorie:"depense",source:"auto"});
});
return tx;
},[data]);

// Manual transactions stored in data
const manualTx=data.transactions||[];
const allTx=[...autoTx,...manualTx].sort((a,b)=>a.date>b.date?-1:1);

// Filter by period
const filteredTx=allTx.filter(t=>t.date?.startsWith(periodM));

// Calculations
const calc=useMemo(()=>{
const byCompte={};
allTx.forEach(t=>{
if(!byCompte[t.compte])byCompte[t.compte]={debit:0,credit:0};
if(t.type==="debit")byCompte[t.compte].debit+=(t.montant||0);
else byCompte[t.compte].credit+=(t.montant||0);
});
const totalRevenu=allTx.filter(t=>t.categorie==="revenu").reduce((s,t)=>s+(t.montant||0),0);
const totalDepense=allTx.filter(t=>t.categorie==="depense").reduce((s,t)=>s+(t.montant||0),0);
const totalActif=allTx.filter(t=>t.categorie==="actif"&&t.type==="debit").reduce((s,t)=>s+(t.montant||0),0);
const totalPassif=allTx.filter(t=>t.categorie==="passif").reduce((s,t)=>s+(t.montant||0),0);
const profit=totalRevenu-totalDepense;
// Monthly
const byMonth={};allTx.forEach(t=>{const m=t.date?.substring(0,7);if(m){if(!byMonth[m])byMonth[m]={rev:0,dep:0};if(t.categorie==="revenu")byMonth[m].rev+=(t.montant||0);if(t.categorie==="depense")byMonth[m].dep+=(t.montant||0);}});
// Comptes à recevoir
const ar=allTx.filter(t=>t.compte==="Comptes clients");
const arTotal=ar.reduce((s,t)=>s+(t.montant||0),0);
return{byCompte,totalRevenu,totalDepense,totalActif,totalPassif,profit,byMonth,arTotal};
},[allTx]);

// Period filtered calcs
const pCalc=useMemo(()=>{
const rev=filteredTx.filter(t=>t.categorie==="revenu").reduce((s,t)=>s+(t.montant||0),0);
const dep=filteredTx.filter(t=>t.categorie==="depense").reduce((s,t)=>s+(t.montant||0),0);
return{rev,dep,profit:rev-dep};
},[filteredTx]);

const addTx=()=>{
if(!txForm.compte||!txForm.montant)return;
const tx={...txForm,id:"man-"+Date.now().toString(36),montant:parseFloat(txForm.montant),source:"manual"};
sv({...data,transactions:[...(data.transactions||[]),tx]});
setTxForm({date:today(),type:"debit",compte:"",description:"",montant:"",categorie:"exploitation"});
setShowAdd(false);ms("Transaction ajoutée!");
};

const delTx=(id)=>{sv({...data,transactions:(data.transactions||[]).filter(t=>t.id!==id)});ms("Supprimé!");};

const tabs=[{id:"journal",label:"📒 Journal"},{id:"grandlivre",label:"📊 Grand Livre"},{id:"etat",label:"📈 État Résultats"},{id:"bilan",label:"⚖️ Bilan"},{id:"ar",label:"💳 Comptes à Recevoir"},{id:"taxes",label:"🧾 Taxes"},{id:"rapport",label:"📅 Rapports"}];

const Sty={th:{padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700,color:C.muted,borderBottom:`1px solid ${C.border}`},td:{padding:"7px 10px",fontSize:11,color:C.text,borderBottom:`1px solid ${C.border}22`}};

return<div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
<h2 style={{fontSize:18,fontWeight:800,color:C.text}}>📒 Livre de Comptabilit\u00e9</h2>
<div style={{display:"flex",gap:8,alignItems:"center"}}>
<input type="month" value={periodM} onChange={e=>setPeriodM(e.target.value)} style={{background:C.card2,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:11}}/>
<Bt onClick={()=>setShowAdd(true)} color={C.green} size="sm">+ Transaction</Bt>
</div>
</div>

{/* Summary cards */}
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
{[
{label:"Revenu Total",val:fN(calc.totalRevenu),color:C.green,icon:"💰"},
{label:"D\u00e9penses Total",val:fN(calc.totalDepense),color:C.red,icon:"💸"},
{label:"Profit Net",val:fN(calc.profit),color:calc.profit>=0?C.green:C.red,icon:"📈"},
{label:"Compte Client",val:fN(calc.arTotal),color:C.orange,icon:"💳"},
{label:"Taxes Kolekte",val:fN(calc.totalPassif),color:C.purple,icon:"🧾"},
].map((c,i)=><div key={i} className="jw-st" style={{background:C.card,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
<div style={{fontSize:10,color:C.dim,marginBottom:4}}>{c.icon} {c.label}</div>
<div style={{fontSize:16,fontWeight:800,color:c.color}}>{c.val} $</div>
</div>)}
</div>

{/* Tabs */}
<div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"6px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:10,fontWeight:600,background:tab===t.id?C.accent:"transparent",color:tab===t.id?"#fff":C.muted}}>{t.label}</button>)}
</div>

{/* Add transaction modal */}
{showAdd&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,marginBottom:16}}>
<h3 style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:12}}>Nouvo Transaction</h3>
<div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
<div><label style={{fontSize:10,color:C.dim}}>Date</label><input type="date" value={txForm.date} onChange={e=>setTxForm({...txForm,date:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11}}/></div>
<div><label style={{fontSize:10,color:C.dim}}>Tip</label><select value={txForm.type} onChange={e=>setTxForm({...txForm,type:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11}}><option value="debit">Débit (sòti)</option><option value="credit">Crédit (antre)</option></select></div>
<div><label style={{fontSize:10,color:C.dim}}>Kategori</label><select value={txForm.categorie} onChange={e=>setTxForm({...txForm,categorie:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11}}><option value="revenu">Revenu</option><option value="depense">Dépense</option><option value="actif">Actif</option><option value="passif">Passif</option></select></div>
<div><label style={{fontSize:10,color:C.dim}}>Compte</label><select value={txForm.compte} onChange={e=>setTxForm({...txForm,compte:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11}}><option value="">-- Choisir --</option>{Object.values(COMPTES).flat().map(c=><option key={c} value={c}>{c}</option>)}</select></div>
<div style={{gridColumn:"1/-1"}}><label style={{fontSize:10,color:C.dim}}>Description</label><input value={txForm.description} onChange={e=>setTxForm({...txForm,description:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11}} placeholder="D\u00e9tails de la transaction"/></div>
<div><label style={{fontSize:10,color:C.dim}}>Montan ($)</label><input type="number" step="0.01" value={txForm.montant} onChange={e=>setTxForm({...txForm,montant:e.target.value})} style={{width:"100%",padding:"6px 8px",background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontSize:11}}/></div>
</div>
<div style={{display:"flex",gap:8,marginTop:12}}><Bt onClick={addTx} color={C.green} size="sm">Ajouter</Bt><Bt onClick={()=>setShowAdd(false)} variant="outline" size="sm">Annuler</Bt></div>
</div>}

{/* JOURNAL */}
{tab==="journal"&&<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"auto"}}>
<div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:12,fontWeight:700,color:C.muted}}>📒 Journal — {periodM} ({filteredTx.length} transaction{filteredTx.length>1?"s":""})</div>
<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
<th style={Sty.th}>Date</th><th style={Sty.th}>Compte</th><th style={Sty.th}>Description</th><th style={{...Sty.th,textAlign:"right"}}>D\u00e9bit</th><th style={{...Sty.th,textAlign:"right"}}>Cr\u00e9dit</th><th style={Sty.th}>Source</th>
</tr></thead><tbody>
{filteredTx.map(t=><tr key={t.id} style={{background:t.source==="auto"?"transparent":C.accent+"11"}}>
<td style={Sty.td}>{fD(t.date)}</td>
<td style={Sty.td}><span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:t.categorie==="revenu"?C.green+"22":t.categorie==="depense"?C.red+"22":C.blue+"22",color:t.categorie==="revenu"?C.green:t.categorie==="depense"?C.red:C.blue}}>{t.compte}</span></td>
<td style={{...Sty.td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</td>
<td style={{...Sty.td,textAlign:"right",color:C.red}}>{t.type==="debit"?fN(t.montant):""}</td>
<td style={{...Sty.td,textAlign:"right",color:C.green}}>{t.type==="credit"?fN(t.montant):""}</td>
<td style={Sty.td}>{t.source==="manual"?<button onClick={()=>delTx(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>✕</button>:<span style={{fontSize:9,color:C.dim}}>auto</span>}</td>
</tr>)}
{filteredTx.length===0&&<tr><td colSpan={6} style={{...Sty.td,textAlign:"center",padding:20,color:C.dim}}>Pa gen transaction pou mwa sa a</td></tr>}
</tbody></table>
<div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700}}>
<span style={{color:C.muted}}>Total mwa:</span>
<span><span style={{color:C.red,marginRight:16}}>Débit: {fN(filteredTx.filter(t=>t.type==="debit").reduce((s,t)=>s+(t.montant||0),0))} $</span><span style={{color:C.green}}>Crédit: {fN(filteredTx.filter(t=>t.type==="credit").reduce((s,t)=>s+(t.montant||0),0))} $</span></span>
</div>
</div>}

{/* GRAND LIVRE */}
{tab==="grandlivre"&&<div style={{display:"grid",gap:12}}>
{Object.entries(calc.byCompte).sort().map(([compte,vals])=><div key={compte} style={{background:C.card,borderRadius:10,padding:14,border:`1px solid ${C.border}`}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{fontWeight:700,fontSize:13,color:C.text}}>{compte}</div>
<div style={{display:"flex",gap:12,fontSize:12}}>
<span style={{color:C.red}}>D: {fN(vals.debit)} $</span>
<span style={{color:C.green}}>C: {fN(vals.credit)} $</span>
<span style={{fontWeight:800,color:vals.credit-vals.debit>=0?C.green:C.red}}>Solde: {fN(Math.abs(vals.credit-vals.debit))} $ {vals.credit>vals.debit?"Cr":"Dr"}</span>
</div>
</div>
</div>)}
</div>}

{/* ÉTAT DES RÉSULTATS */}
{tab==="etat"&&<div style={{background:C.card,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
<h3 style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:4}}>État des Résultats</h3>
<div style={{fontSize:10,color:C.dim,marginBottom:16}}>Peryòd: Tout done yo</div>
<div style={{marginBottom:16}}>
<div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:8,borderBottom:`1px solid ${C.border}`,paddingBottom:4}}>REVENUS</div>
{Object.entries(calc.byCompte).filter(([k])=>COMPTES.revenu.includes(k)).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.muted}}>{k}</span><span style={{color:C.green}}>{fN(v.credit)} $</span></div>)}
<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13,fontWeight:800,borderTop:`1px solid ${C.border}`,marginTop:4}}><span style={{color:C.text}}>Total Revenus</span><span style={{color:C.green}}>{fN(calc.totalRevenu)} $</span></div>
</div>
<div style={{marginBottom:16}}>
<div style={{fontSize:12,fontWeight:700,color:C.red,marginBottom:8,borderBottom:`1px solid ${C.border}`,paddingBottom:4}}>DÉPENSES</div>
{Object.entries(calc.byCompte).filter(([k])=>COMPTES.depense.includes(k)).map(([k,v])=><div key={k} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.muted}}>{k}</span><span style={{color:C.red}}>{fN(v.debit)} $</span></div>)}
<div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",fontSize:13,fontWeight:800,borderTop:`1px solid ${C.border}`,marginTop:4}}><span style={{color:C.text}}>Total Dépenses</span><span style={{color:C.red}}>{fN(calc.totalDepense)} $</span></div>
</div>
<div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",fontSize:16,fontWeight:900,borderTop:`2px solid ${C.border}`}}><span style={{color:C.text}}>BÉNÉFICE NET</span><span style={{color:calc.profit>=0?C.green:C.red}}>{fN(calc.profit)} $</span></div>
</div>}

{/* BILAN */}
{tab==="bilan"&&<div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
<div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
<h3 style={{fontSize:14,fontWeight:800,color:C.blue,marginBottom:12}}>ACTIF</h3>
{COMPTES.actif.map(c=>{const v=calc.byCompte[c];return v?<div key={c} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.muted}}>{c}</span><span style={{color:C.text}}>{fN(v.debit-v.credit)} $</span></div>:null})}
<div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:13,fontWeight:800,borderTop:`1px solid ${C.border}`,marginTop:8}}><span>Total Actif</span><span style={{color:C.blue}}>{fN(calc.totalActif)} $</span></div>
</div>
<div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
<h3 style={{fontSize:14,fontWeight:800,color:C.orange,marginBottom:12}}>PASSIF</h3>
{COMPTES.passif.map(c=>{const v=calc.byCompte[c];return v?<div key={c} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:12}}><span style={{color:C.muted}}>{c}</span><span style={{color:C.text}}>{fN(v.credit-v.debit)} $</span></div>:null})}
<div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:13,fontWeight:800,borderTop:`1px solid ${C.border}`,marginTop:8}}><span>Total Passif</span><span style={{color:C.orange}}>{fN(calc.totalPassif)} $</span></div>
<div style={{marginTop:12,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
<h4 style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:4}}>CAPITAUX PROPRES</h4>
<div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:C.muted}}>Bénéfice net</span><span style={{color:C.green}}>{fN(calc.profit)} $</span></div>
</div>
</div>
</div>}

{/* COMPTES À RECEVOIR */}
{tab==="ar"&&<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"auto"}}>
<div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:12,fontWeight:700,color:C.muted}}>💳 Compte Client (À Recevoir)</div>
<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
<th style={Sty.th}>Client</th><th style={Sty.th}>Facture</th><th style={Sty.th}>Date</th><th style={{...Sty.th,textAlign:"right"}}>Montant</th><th style={Sty.th}>Statut</th>
</tr></thead><tbody>
{(data.factures||[]).map(f=>{const cli=(data.clients||[]).find(c=>c.id===f.clientId);return<tr key={f.id}>
<td style={Sty.td}>{cli?.nom||"—"}</td>
<td style={Sty.td}>{f.numero}</td>
<td style={Sty.td}>{fD(f.date)}</td>
<td style={{...Sty.td,textAlign:"right",fontWeight:700}}>{fN(f.total||0)} $</td>
<td style={Sty.td}><span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:f.statut==="Payée"?C.green+"22":f.statut==="Envoyée"?C.orange+"22":C.red+"22",color:f.statut==="Payée"?C.green:f.statut==="Envoyée"?C.orange:C.red}}>{f.statut||"Brouillon"}</span></td>
</tr>})}
</tbody></table>
<div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",fontSize:12,fontWeight:700}}>
<span style={{color:C.muted}}>Total à recevoir:</span><span style={{color:C.orange}}>{fN((data.factures||[]).filter(f=>f.statut!=="Payée").reduce((s,f)=>s+(f.total||0),0))} $</span>
</div>
</div>}

{/* TAXES */}
{tab==="taxes"&&<div style={{background:C.card,borderRadius:12,padding:20,border:`1px solid ${C.border}`}}>
<h3 style={{fontSize:15,fontWeight:800,color:C.text,marginBottom:16}}>🧾 Sommaire Taxes</h3>
<div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
<div style={{background:C.bg,borderRadius:10,padding:14}}>
<div style={{fontSize:11,color:C.dim,marginBottom:4}}>TPS Kolekte ({data.settings?.tpsNum||"N/A"})</div>
<div style={{fontSize:20,fontWeight:800,color:C.purple}}>{fN((data.factures||[]).reduce((s,f)=>s+(f.tps||0),0))} $</div>
</div>
<div style={{background:C.bg,borderRadius:10,padding:14}}>
<div style={{fontSize:11,color:C.dim,marginBottom:4}}>TVQ Kolekte ({data.settings?.tvqNum||"N/A"})</div>
<div style={{fontSize:20,fontWeight:800,color:C.purple}}>{fN((data.factures||[]).reduce((s,f)=>s+(f.tvq||0),0))} $</div>
</div>
</div>
<div style={{marginTop:16}}>
<div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Pa Fakti:</div>
{(data.factures||[]).map(f=><div key={f.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}22`,fontSize:11}}>
<span style={{color:C.text}}>{f.numero} ({fD(f.date)})</span>
<span><span style={{color:C.purple,marginRight:12}}>TPS: {fN(f.tps||0)} $</span><span style={{color:C.purple}}>TVQ: {fN(f.tvq||0)} $</span></span>
</div>)}
<div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontSize:13,fontWeight:800,borderTop:`1px solid ${C.border}`,marginTop:4}}>
<span style={{color:C.text}}>Total Taxes</span>
<span style={{color:C.purple}}>{fN((data.factures||[]).reduce((s,f)=>s+(f.tps||0)+(f.tvq||0),0))} $</span>
</div>
</div>
</div>}

{/* RAPPORTS MENSUELS */}
{tab==="rapport"&&<div>
<div style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.border}`,marginBottom:16}}>
<h3 style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>📅 Rapò Mansyèl — {periodM}</h3>
<div className="jw-grid3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginTop:12}}>
<div style={{background:C.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:C.dim}}>Revenu</div><div style={{fontSize:18,fontWeight:800,color:C.green}}>{fN(pCalc.rev)} $</div></div>
<div style={{background:C.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:C.dim}}>D\u00e9penses</div><div style={{fontSize:18,fontWeight:800,color:C.red}}>{fN(pCalc.dep)} $</div></div>
<div style={{background:C.bg,borderRadius:8,padding:12,textAlign:"center"}}><div style={{fontSize:10,color:C.dim}}>Profit</div><div style={{fontSize:18,fontWeight:800,color:pCalc.profit>=0?C.green:C.red}}>{fN(pCalc.profit)} $</div></div>
</div>
</div>
<div style={{background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"auto"}}>
<div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:12,fontWeight:700,color:C.muted}}>Tous les Mois</div>
<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>
<th style={Sty.th}>Mois</th><th style={{...Sty.th,textAlign:"right"}}>Revenu</th><th style={{...Sty.th,textAlign:"right"}}>D\u00e9penses</th><th style={{...Sty.th,textAlign:"right"}}>Profit</th><th style={{...Sty.th,textAlign:"right"}}>Marge %</th>
</tr></thead><tbody>
{Object.entries(calc.byMonth).sort().map(([m,v])=>{const p=v.rev-v.dep;return<tr key={m}>
<td style={Sty.td}>{m}</td>
<td style={{...Sty.td,textAlign:"right",color:C.green}}>{fN(v.rev)} $</td>
<td style={{...Sty.td,textAlign:"right",color:C.red}}>{fN(v.dep)} $</td>
<td style={{...Sty.td,textAlign:"right",fontWeight:700,color:p>=0?C.green:C.red}}>{fN(p)} $</td>
<td style={{...Sty.td,textAlign:"right",color:p>=0?C.green:C.red}}>{v.rev>0?(p/v.rev*100).toFixed(1):0}%</td>
</tr>})}
</tbody></table>
</div>
</div>}
</div>;}

function AjanIA({data,sv,ms}){
const[wk,setWk]=useState(gMon());const wd=useMemo(()=>gWk(wk),[wk]);
const st=data.settings||def.settings;const eI=st.entreprise||def.settings.entreprise;
const cls=data.clients||[];const facs=data.factures||[];
const wv=useMemo(()=>data.voyages.filter(v=>v.date>=wd[0]&&v.date<=wd[4]),[data.voyages,wd]);
const emps=useMemo(()=>data.chauffeurs.filter(c=>c.aktif).map(ch=>{let voyDetails=[];wv.forEach(v=>{if(v.chofè===ch.id||v.helpers?.includes(ch.id))(v.trips||[]).forEach(t=>{if(t.nbVoyages>0)voyDetails.push({date:v.date,zone:t.zone,nb:t.nbVoyages||0});});});const vy=voyDetails.reduce((s,d)=>s+d.nb,0);const tx=parseFloat(ch.tauxPersonnel)||(ch.role==="Chauffeur"?st.tauxChauffeur:st.tauxHelper);return{...ch,vy,tx,br:vy*tx,voyDetails};}).filter(c=>c.vy>0),[data.chauffeurs,wv,st]);
const totPaie=emps.reduce((s,e)=>s+e.br,0);
const calcF=(det,tps,tvq)=>{const s=det.reduce((s,d)=>{const q=parseFloat(d.quantite)||0;const p=parseFloat(d.prixUnitaire)||0;return s+q*p;},0);const tv=tps?Math.round(s*TPS_R*100)/100:0;const qv=tvq?Math.round(s*TVQ_R*100)/100:0;return{st:Math.round(s*100)/100,tv,qv,total:Math.round((s+tv+qv)*100)/100};};
const clientFacts=useMemo(()=>{return cls.map(cl=>{const details=[];["06","13"].forEach(zone=>{const zd=calcZW(data.voyages,wk,zone);if(zd.tp>0){const rate=ZR[zone]||0;const zName=zone==="06"?"Montréal":"Laval";details.push({id:gid(),zone,description:`Nbre fiches ${zName}: ${zd.nf}`,quantite:zd.tp.toString(),unite:"kg",prixUnitaire:rate.toString(),dt:zd.dt.join("\n")});}});const c=calcF(details,true,true);return{cl,details,calc:c,hasData:details.length>0};}).filter(cf=>cf.hasData);},[cls,data.voyages,wk]);
const[running,setRunning]=useState(false);const[log,setLog]=useState([]);const[step,setStep]=useState(0);const[total,setTotal]=useState(0);const[provider,setProvider]=useState("gmail");
const addLog=(msg,type="info")=>setLog(p=>[...p,{msg,type,time:new Date().toLocaleTimeString()}]);
const buildTalonHtml=(e)=>{const jours={};e.voyDetails.forEach(d=>{const k=d.date;if(!jours[k])jours[k]={date:k,zones:{}};if(!jours[k].zones[d.zone])jours[k].zones[d.zone]=0;jours[k].zones[d.zone]+=d.nb;});
const jourRows=Object.values(jours).sort((a,b)=>a.date.localeCompare(b.date)).map(j=>{const zList=Object.entries(j.zones).map(([z,n])=>`${ZM[z]||z}: ${n}`).join(", ");const dayTotal=Object.values(j.zones).reduce((s,n)=>s+n,0);return`<tr><td>${fD(j.date)}</td><td>${zList}</td><td style="text-align:right;font-weight:700">${dayTotal}</td></tr>`;}).join("");
return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Talon - ${e.nom}</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}body{background:#fff;color:#1a1a1a;padding:20px}.stub{max-width:700px;margin:0 auto;border:2px solid #1e293b;border-radius:8px;overflow:hidden}.header{background:#1e293b;color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:center}.header h2{font-size:18px}.co-info{font-size:10px;text-align:right;color:#94a3b8;line-height:1.6}.co-info strong{color:#fff;font-size:12px}.section{padding:16px 24px;border-bottom:1px solid #e2e8f0}.section-title{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;margin-bottom:10px}.row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px}.row .label{color:#64748b}.row .val{font-weight:600}table{width:100%;border-collapse:collapse;margin:8px 0}th{background:#f8fafc;padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase;color:#64748b;border:1px solid #e2e8f0}td{padding:6px 10px;font-size:11px;border:1px solid #e2e8f0}.net-box{background:#1e293b;color:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center}.net-box .label{font-size:12px;color:#94a3b8}.net-box .amount{font-size:24px;font-weight:900;color:#4ade80}.footer{background:#f8fafc;padding:12px 24px;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}@media print{body{padding:0}}</style></head><body><div class="stub"><div class="header"><div><h2>TALON DE PAIE</h2><div style="font-size:11px;color:#94a3b8;margin-top:2px">P\u00e9riode : ${fD(wd[0])} au ${fD(wd[4])}</div></div><div class="co-info"><strong>${eI.nom}</strong><br/>${eI.adresse||""}<br/>${eI.ville||""}<br/>${eI.telephone||""}<br/>${eI.courriel||""}</div></div><div class="section"><div class="section-title">Employ\u00e9</div><div class="row"><span class="label">Nom</span><span class="val">${e.nom}</span></div><div class="row"><span class="label">R\u00f4le</span><span class="val">${e.role}</span></div><div class="row"><span class="label">Taux/voyage</span><span class="val">${fM(e.tx)}</span></div></div><div class="section"><div class="section-title">D\u00e9tail voyages</div><table><thead><tr><th>Date</th><th>Zones</th><th style="text-align:right">Voy.</th></tr></thead><tbody>${jourRows}</tbody></table></div><div class="section"><div class="section-title">R\u00e9mun\u00e9ration</div><div class="row"><span class="label">${e.vy} voyages \u00d7 ${fM(e.tx)}</span><span class="val">${fM(e.br)}</span></div></div><div class="net-box"><span class="label">MONTANT NET</span><span class="amount">${fM(e.br)}</span></div><div class="footer"><span>${eI.nom}</span><span>${fD(today())}</span></div></div><script>window.onload=function(){window.print()}<\\/script></body></html>`;};
const openEmail=(provider,to,subject,body)=>{let url;const s=encodeURIComponent(subject);const b=encodeURIComponent(body);
if(provider==="gmail")url=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${s}&body=${b}`;
else if(provider==="outlook")url=`https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${s}&body=${b}`;
else url=`mailto:${to}?subject=${s}&body=${b}`;
window.open(url,"_blank");};
const runAgent=async()=>{setRunning(true);setLog([]);setStep(0);const tasks=[];
emps.forEach(e=>{if(e.courriel)tasks.push({type:"paie",emp:e});});
clientFacts.forEach(cf=>{if(cf.cl.courriel)tasks.push({type:"fact",cf});});
setTotal(tasks.length);
addLog(`\u{1F916} Agent IA d\u00e9mar\u00e9 — ${tasks.length} t\u00e2ches d\u00e9tect\u00e9es`,"start");
addLog(`\u{1F4C5} Semaine: ${fD(wd[0])} au ${fD(wd[4])}`);
const newFacs=[...facs];
for(let i=0;i<tasks.length;i++){const t=tasks[i];setStep(i+1);
if(t.type==="paie"){const e=t.emp;
addLog(`\u{1F4C4} G\u00e9n\u00e9ration talon paie: ${e.nom}...`);
const w=window.open("","_blank");if(w){w.document.write(buildTalonHtml(e));w.document.close();}
await new Promise(r=>setTimeout(r,800));
addLog(`\u{1F4E7} Ouverture email pour ${e.nom} (${e.courriel})...`,"email");
openEmail(provider,e.courriel,`Talon de paie - ${e.nom} - Sem. ${fD(wd[0])} au ${fD(wd[4])}`,`Bonjour ${e.nom},\n\nVeuillez trouver ci-joint votre talon de paie.\n\nP\u00e9riode : ${fD(wd[0])} au ${fD(wd[4])}\nVoyages : ${e.vy}\nMontant : ${fM(e.br)}\n\nCordialement,\n${eI.nom}`);
await new Promise(r=>setTimeout(r,1500));
addLog(`\u2705 ${e.nom} — talon + email pr\u00eat`,"ok");
}else if(t.type==="fact"){const{cf}=t;const cl=cf.cl;const c=cf.calc;
const num=`FAC-${(newFacs.length+1).toString().padStart(3,"0")}`;
const periode=`${fD(wd[0])} au ${fD(wd[4])}`;
addLog(`\u{1F4C4} G\u00e9n\u00e9ration facture ${num} pour ${cl.nom}...`);
const facObj={id:gid(),clientId:cl.id,date:today(),dateLimite:"",periode,details:cf.details,avecTPS:true,avecTVQ:true,statut:"Envoy\u00e9e",numero:num,sousTotal:c.st,tps:c.tv,tvq:c.qv,total:c.total};
newFacs.push(facObj);
await new Promise(r=>setTimeout(r,800));
addLog(`\u{1F4E7} Ouverture email facture ${num} pour ${cl.nom} (${cl.courriel})...`,"email");
openEmail(provider,cl.courriel,`Facture ${num} - ${eI.nom}`,`Bonjour ${cl.nom},\n\nVeuillez trouver ci-joint la facture ${num}.\n\nP\u00e9riode : ${periode}\nTotal : ${fM(c.total)}\n\nMerci pour votre confiance.\n\n${eI.nom}\n${eI.telephone||""}`);
await new Promise(r=>setTimeout(r,1500));
addLog(`\u2705 ${cl.nom} — facture ${num} + email pr\u00eat`,"ok");
}}
sv({...data,factures:newFacs});
addLog(`\u{1F389} Termin\u00e9! ${tasks.length} t\u00e2ches compl\u00e9t\u00e9es`,"done");
setRunning(false);};
const empReady=emps.filter(e=>e.courriel);const empNoEmail=emps.filter(e=>!e.courriel);
const clReady=clientFacts.filter(cf=>cf.cl.courriel);const clNoEmail=clientFacts.filter(cf=>!cf.cl.courriel);
return<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
<div><h1 style={{fontSize:22,fontWeight:800}}>{"🤖"} Agent IA</h1><div style={{fontSize:11,color:C.dim}}>Automatisation paie + factures fin de semaine</div></div>
</div>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
<In label="Semaine" type="date" value={wk} onChange={setWk} style={{maxWidth:180}}/>
<div style={{marginTop:18}}><span style={{fontSize:12,fontWeight:700,color:C.accentL}}>{fD(wd[0])} au {fD(wd[4])}</span></div>
</div>
<div style={{display:"flex",gap:10,marginBottom:16}}>
<button onClick={()=>setProvider("gmail")} style={{padding:"8px 16px",borderRadius:8,border:`2px solid ${provider==="gmail"?"#ea4335":C.border}`,background:provider==="gmail"?"#ea433515":"transparent",color:provider==="gmail"?"#ea4335":C.muted,cursor:"pointer",fontWeight:700,fontSize:12}}>Gmail</button>
<button onClick={()=>setProvider("outlook")} style={{padding:"8px 16px",borderRadius:8,border:`2px solid ${provider==="outlook"?"#0078d4":C.border}`,background:provider==="outlook"?"#0078d415":"transparent",color:provider==="outlook"?"#0078d4":C.muted,cursor:"pointer",fontWeight:700,fontSize:12}}>Outlook</button>
<button onClick={()=>setProvider("mailto")} style={{padding:"8px 16px",borderRadius:8,border:`2px solid ${provider==="mailto"?C.accent:C.border}`,background:provider==="mailto"?`${C.accent}15`:"transparent",color:provider==="mailto"?C.accentL:C.muted,cursor:"pointer",fontWeight:700,fontSize:12}}>App défaut</button>
</div>
<div className="jw-grid2" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
<div style={{fontSize:13,fontWeight:700,color:C.orange,marginBottom:10}}>{"📋"} Talons de Paie</div>
{empReady.length>0&&<div style={{marginBottom:8}}>{empReady.map(e=><div key={e.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11}}><span>{e.nom} <span style={{color:C.dim}}>({e.role})</span></span><span style={{color:C.green,fontWeight:700}}>{fM(e.br)}</span></div>)}<div style={{borderTop:`1px solid ${C.border}`,marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:12}}><span>Total</span><span style={{color:C.green}}>{fM(totPaie)}</span></div></div>}
{empNoEmail.length>0&&<div style={{background:`${C.orange}10`,borderRadius:6,padding:8,fontSize:10,color:C.orange}}>{"⚠️"} {empNoEmail.length} employé(s) sans courriel: {empNoEmail.map(e=>e.nom).join(", ")}</div>}
{emps.length===0&&<div style={{fontSize:11,color:C.dim}}>Aucun voyage cette semaine</div>}
</div>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
<div style={{fontSize:13,fontWeight:700,color:C.purple,marginBottom:10}}>{"🧾"} Factures Clients</div>
{clReady.length>0&&<div style={{marginBottom:8}}>{clReady.map(cf=><div key={cf.cl.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:11}}><span>{cf.cl.nom}</span><span style={{color:C.green,fontWeight:700}}>{fM(cf.calc.total)}</span></div>)}</div>}
{clNoEmail.length>0&&<div style={{background:`${C.orange}10`,borderRadius:6,padding:8,fontSize:10,color:C.orange}}>{"⚠️"} {clNoEmail.length} client(s) sans courriel: {clNoEmail.map(cf=>cf.cl.nom).join(", ")}</div>}
{clientFacts.length===0&&<div style={{fontSize:11,color:C.dim}}>Aucune donnée cette semaine</div>}
</div>
</div>
<div style={{marginBottom:16}}>
<button onClick={runAgent} disabled={running||(empReady.length===0&&clReady.length===0)} style={{width:"100%",padding:"14px 24px",borderRadius:10,border:"none",cursor:running?"wait":"pointer",background:running?C.dim:C.g1,color:"#fff",fontSize:16,fontWeight:900,opacity:(empReady.length===0&&clReady.length===0)?0.4:1}}>
{running?`⏳ En cours... (${step}/${total})`:`🚀 Lancer l'Agent IA — ${empReady.length} paie + ${clReady.length} factures`}
</button>
</div>
{log.length>0&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,maxHeight:350,overflowY:"auto"}}>
<div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Journal d'exécution</div>
{log.map((l,i)=><div key={i} style={{padding:"4px 0",fontSize:11,display:"flex",gap:8,borderBottom:i<log.length-1?`1px solid ${C.border}08`:"none"}}>
<span style={{color:C.dim,minWidth:65,fontSize:9}}>{l.time}</span>
<span style={{color:l.type==="ok"?C.green:l.type==="email"?C.cyan:l.type==="done"?C.green:l.type==="start"?C.accentL:C.text}}>{l.msg}</span>
</div>)}
</div>}
</div>;}

function RevAn({data}){
const st=data.settings||def.settings;const tare=st.tare||DEF_TARE;
const[year,setYear]=useState(new Date().getFullYear());
const MOIS=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const mData=useMemo(()=>{return MOIS.map((nom,i)=>{const m=String(i+1).padStart(2,"0");const deb=`${year}-${m}-01`;const last=new Date(year,i+1,0).getDate();const fin=`${year}-${m}-${last}`;
const mv=data.voyages.filter(v=>v.date>=deb&&v.date<=fin);
const ma=agg(mv,tare);
const mDeps=(data.depenses||[]).filter(d=>d.date>=deb&&d.date<=fin).reduce((s,d)=>s+(d.montant||0),0);
const mEnts=(data.entretiens||[]).filter(e=>e.date>=deb&&e.date<=fin).reduce((s,e)=>s+(e.cout||0),0);
const empCost=data.chauffeurs.filter(c=>c.aktif).reduce((s,ch)=>{let vy=0;mv.forEach(v=>{if(v.chofè===ch.id||v.helpers?.includes(ch.id))(v.trips||[]).forEach(t=>{vy+=(t.nbVoyages||0);});});const tx=parseFloat(ch.tauxPersonnel)||(ch.role==="Chauffeur"?st.tauxChauffeur:st.tauxHelper);return s+vy*tx;},0);
const tps=Math.round(ma.rev*TPS_R*100)/100;
const tvq=Math.round(ma.rev*TVQ_R*100)/100;
const totalTax=tps+tvq;
const profit=ma.rev-empCost-mDeps-mEnts;
return{id:m,nom,tv:ma.tv,tp:ma.tp,revHT:ma.rev,tps,tvq,totalTax,ttc:ma.ttc,empCost,deps:mDeps,ents:mEnts,profit};});},[year,data,tare,st]);
const totals=useMemo(()=>mData.reduce((t,m)=>({tv:t.tv+m.tv,tp:t.tp+m.tp,revHT:t.revHT+m.revHT,tps:t.tps+m.tps,tvq:t.tvq+m.tvq,totalTax:t.totalTax+m.totalTax,ttc:t.ttc+m.ttc,empCost:t.empCost+m.empCost,deps:t.deps+m.deps,ents:t.ents+m.ents,profit:t.profit+m.profit}),{tv:0,tp:0,revHT:0,tps:0,tvq:0,totalTax:0,ttc:0,empCost:0,deps:0,ents:0,profit:0}),[mData]);
return<div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
<h1 style={{fontSize:22,fontWeight:800}}>Rapport Annuel</h1>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<button onClick={()=>setYear(y=>y-1)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16}}>{"◀"}</button>
<span style={{fontSize:16,fontWeight:800,minWidth:60,textAlign:"center"}}>{year}</span>
<button onClick={()=>setYear(y=>y+1)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16}}>{"▶"}</button>
</div></div>
<div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
<St title="Voyages" value={totals.tv} grad={C.g1}/>
<St title="Poids total" value={`${totals.tp.toLocaleString()} kg`} grad={C.g2}/>
<St title="Rev. Ent" value={fM(totals.revHT)} color={C.cyan}/>
<St title="TPS+TVQ" value={fM(totals.totalTax)} color={C.purple}/>
<St title="Rev/Taxe" value={fM(totals.ttc)} grad={C.g4}/>
<St title="Profit/Ent" value={fM(totals.profit)} color={totals.profit>=0?C.green:C.red}/>
</div>
<div style={{overflowX:"auto",borderRadius:10,border:`1px solid ${C.border}`}}>
<table style={{width:"100%",borderCollapse:"collapse"}}>
<thead><tr style={{background:C.card2}}>
{["Mois","Voy.","Poids","Rev. Ent","TPS 5%","TVQ 9.975%","Total Taxes QC","Rev/Taxe","Emp.","Dép.","Entret.","Profit/Ent"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:h==="Mois"?"left":"right",fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>)}
</tr></thead>
<tbody>
{mData.map((m,i)=><tr key={m.id} style={{background:i%2?C.card2+"40":"transparent"}}>
<td style={{padding:"8px 10px",fontSize:12,fontWeight:700,color:C.text,borderBottom:`1px solid ${C.border}10`}}>{m.nom}</td>
<td style={{padding:"8px 10px",fontSize:12,textAlign:"right",color:m.tv>0?C.accent:C.dim,fontWeight:700,borderBottom:`1px solid ${C.border}10`}}>{m.tv||"—"}</td>
<td style={{padding:"8px 10px",fontSize:11,textAlign:"right",color:m.tp>0?C.green:C.dim,borderBottom:`1px solid ${C.border}10`}}>{m.tp>0?m.tp.toLocaleString()+" kg":"—"}</td>
<td style={{padding:"8px 10px",fontSize:11,textAlign:"right",color:m.revHT>0?C.cyan:C.dim,fontWeight:700,borderBottom:`1px solid ${C.border}10`}}>{m.revHT>0?fM(m.revHT):"—"}</td>
<td style={{padding:"8px 10px",fontSize:10,textAlign:"right",color:C.muted,borderBottom:`1px solid ${C.border}10`}}>{m.tps>0?fM(m.tps):"—"}</td>
<td style={{padding:"8px 10px",fontSize:10,textAlign:"right",color:C.muted,borderBottom:`1px solid ${C.border}10`}}>{m.tvq>0?fM(m.tvq):"—"}</td>
<td style={{padding:"8px 10px",fontSize:11,textAlign:"right",color:m.totalTax>0?C.purple:C.dim,fontWeight:600,borderBottom:`1px solid ${C.border}10`}}>{m.totalTax>0?fM(m.totalTax):"—"}</td>
<td style={{padding:"8px 10px",fontSize:11,textAlign:"right",color:m.ttc>0?C.text:C.dim,fontWeight:700,borderBottom:`1px solid ${C.border}10`}}>{m.ttc>0?fM(m.ttc):"—"}</td>
<td style={{padding:"8px 10px",fontSize:10,textAlign:"right",color:m.empCost>0?C.orange:C.dim,borderBottom:`1px solid ${C.border}10`}}>{m.empCost>0?fM(m.empCost):"—"}</td>
<td style={{padding:"8px 10px",fontSize:10,textAlign:"right",color:m.deps>0?C.red:C.dim,borderBottom:`1px solid ${C.border}10`}}>{m.deps>0?fM(m.deps):"—"}</td>
<td style={{padding:"8px 10px",fontSize:10,textAlign:"right",color:m.ents>0?C.cyan:C.dim,borderBottom:`1px solid ${C.border}10`}}>{m.ents>0?fM(m.ents):"—"}</td>
<td style={{padding:"8px 10px",fontSize:12,textAlign:"right",fontWeight:800,color:m.profit>0?C.green:m.profit<0?C.red:C.dim,borderBottom:`1px solid ${C.border}10`}}>{m.tv>0?fM(m.profit):"—"}</td>
</tr>)}
<tr style={{background:C.card,borderTop:`2px solid ${C.accent}`}}>
<td style={{padding:"10px",fontSize:13,fontWeight:900,color:C.accentL}}>TOTAL</td>
<td style={{padding:"10px",textAlign:"right",fontSize:13,fontWeight:800,color:C.accent}}>{totals.tv}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:12,fontWeight:700,color:C.green}}>{totals.tp.toLocaleString()} kg</td>
<td style={{padding:"10px",textAlign:"right",fontSize:12,fontWeight:800,color:C.cyan}}>{fM(totals.revHT)}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:11,color:C.muted}}>{fM(totals.tps)}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:11,color:C.muted}}>{fM(totals.tvq)}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:12,fontWeight:700,color:C.purple}}>{fM(totals.totalTax)}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:12,fontWeight:800,color:C.text}}>{fM(totals.ttc)}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:11,fontWeight:700,color:C.orange}}>{fM(totals.empCost)}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:11,fontWeight:700,color:C.red}}>{fM(totals.deps)}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:11,fontWeight:700,color:C.cyan}}>{fM(totals.ents)}</td>
<td style={{padding:"10px",textAlign:"right",fontSize:14,fontWeight:900,color:totals.profit>=0?C.green:C.red}}>{fM(totals.profit)}</td>
</tr>
</tbody></table></div>
<div style={{marginTop:16,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
<div style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:6}}>Poids à vide du camion (TARE)</div>
<div style={{fontSize:11,color:C.dim,marginBottom:8}}>Utilisé pour calculer le poids net : Poids chargé - TARE = Poids net</div>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<span style={{fontSize:24,fontWeight:900,color:C.accentL}}>{tare.toLocaleString()} kg</span>
<span style={{fontSize:11,color:C.dim}}>( Modifier dans Backup {"→"} Paramètres )</span>
</div></div>
</div>;}

function Back({data,sv,ms}){
const st=data.settings||def.settings;const[tare,setTare]=useState(st.tare||DEF_TARE);const[txC,setTxC]=useState(st.tauxChauffeur);const[txH,setTxH]=useState(st.tauxHelper);
const saveSt=()=>{sv({...data,settings:{...st,tare:parseInt(tare)||DEF_TARE,tauxChauffeur:parseFloat(txC)||80,tauxHelper:parseFloat(txH)||65}});ms("OK!");};
return<div><h1 style={{fontSize:22,fontWeight:800,marginBottom:14}}>Sauvegarde & Paramètres</h1>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:16}}>
<div style={{fontSize:13,fontWeight:700,color:C.muted,marginBottom:10}}>Paramètres</div>
<div className="jw-grid3" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
<In label="TARE (kg)" type="number" value={tare} onChange={setTare}/>
<In label="Taux Chauffeur Défaut ($)" type="number" value={txC} onChange={setTxC}/>
<In label="Taux Helper Défaut ($)" type="number" value={txH} onChange={setTxH}/>
</div>
<div style={{fontSize:10,color:C.dim,marginBottom:10,fontStyle:"italic"}}>💡 Taux défaut yo itilize lè yon employè pa gen taux personnel. Ale nan paj "Employés" pou mete taux endividyèl.</div>
<Bt onClick={saveSt} color={C.green} size="sm">Sauvegarder</Bt>
</div>
<div style={{display:"flex",gap:8}}><Bt onClick={()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=`jw_backup_${today()}.json`;a.click();ms("OK!");}}>JSON</Bt><Bt variant="outline" color={C.purple} onClick={()=>{const i=document.createElement("input");i.type="file";i.accept=".json";i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{sv({...def,...JSON.parse(ev.target.result)});ms("OK!");}catch{ms("Erreur!","error");}};r.readAsText(f);};i.click();}}>Importer</Bt></div></div>;}

function ChatBot({data,user}){
const[open,setOpen]=useState(false);
const[msgs,setMsgs]=useState([{role:"assistant",content:"Bonjour! Je suis l'assistant J&W Transport. 😊\n\nJe peux vous aider avec:\n• 📊 Statistiques de vos donn\u00e9es\n• 📋 Comment utiliser l'application\n• 💰 Calcul de revenus, d\u00e9penses, profit\n• 🧾 Factures et paie\n• 🚛 Informations sur les v\u00e9hicules\n• 📅 Dates de paiement\n\nPosez-moi une question!"}]);
const[input,setInput]=useState("");
const[loading,setLoading]=useState(false);
const[showKey,setShowKey]=useState(false);
const[apiKey,setApiKey]=useState(()=>localStorage.getItem("jw-api-key")||"");
const[aiMode,setAiMode]=useState(()=>!!localStorage.getItem("jw-api-key"));
const chatRef=useRef(null);
useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs]);

const saveKey=(k)=>{const clean=k.trim().replace(/[^\x20-\x7E]/g,"");if(clean){localStorage.setItem("jw-api-key",clean);setApiKey(clean);setAiMode(true);setShowKey(false);setMsgs(prev=>[...prev,{role:"assistant",content:"✅ Cl\u00e9 API enregistr\u00e9e! Maintenant j'utilise Claude AI pour vous r\u00e9pondre. 🧠"}]);}};
const removeKey=()=>{localStorage.removeItem("jw-api-key");setApiKey("");setAiMode(false);setShowKey(false);setMsgs(prev=>[...prev,{role:"assistant",content:"🔄 Cl\u00e9 API supprim\u00e9e. Retour en mode local."}]);};

const buildContext=()=>{
const s=data.settings||{};const ent=s.entreprise||{};
const voys=data.voyages||[];const deps=data.depenses||[];const facs=data.factures||[];
const emps=data.chauffeurs||[];const vehs=data.vehicules||[];const ents=data.entretiens||[];
const totTrips=voys.reduce((a,v)=>(v.trips||[]).reduce((b,t)=>b+(t.nbVoyages||0),a),0);
const totDep=deps.reduce((a,d)=>a+(d.montant||0),0);
const totFac=facs.reduce((a,f)=>a+(f.total||0),0);
const tare=s.tare||DEF_TARE;
let totRev=0;voys.forEach(v=>(v.trips||[]).forEach(t=>{const pN=Math.max(0,(t.poidsChaj||0)-tare);totRev+=pN*(ZR[t.zone]||0)*(t.nbVoyages||1);}));
return `Tu es l'assistant IA de J&W Transport. R\u00e9ponds toujours en fran\u00e7ais.
Entreprise: ${ent.nom||"J&W Transport"}, ${ent.adresse||""}, ${ent.ville||""}
TPS: ${s.tpsNum||"N/A"}, TVQ: ${s.tvqNum||"N/A"}, NEQ: ${ent.neq||"N/A"}
Taux défaut: Chauffeur ${s.tauxChauffeur||80}$/voy, Helper ${s.tauxHelper||65}$/voy, TARE: ${tare}kg
Employés et taux: ${emps.map(e=>`${e.nom}(${e.role})=${parseFloat(e.tauxPersonnel)||(e.role==="Chauffeur"?s.tauxChauffeur:s.tauxHelper)}$/voy`).join(", ")}
Stats: ${emps.length} employ\u00e9s (${emps.map(e=>e.nom+"="+e.role).join(", ")}), ${voys.length} jours/${totTrips} trajets, ${(data.clients||[]).length} clients, ${vehs.length} v\u00e9hicules, ${facs.length} factures(${totFac.toFixed(0)}$), ${deps.length} d\u00e9penses(${totDep.toFixed(0)}$), ${ents.length} entretiens, Revenu: ${totRev.toFixed(0)}$, Profit: ${(totRev-totDep).toFixed(0)}$
Fonctions: Dashboard, Voyages(zones 06=MTL/13=LAV), Employ\u00e9s, Clients, V\u00e9hicules+Entretiens, Paie(par semaine), 📅 Calendrier de Paie(dates de paiement), Factures(TPS/TVQ+email), Comptabilit\u00e9, Agent IA(automatise paie+factures), Rapport Annuel, Backup(JSON).
${(()=>{const ps=s.payrollSchedule||{frequency:"weekly",payDelay:2,payDay:5};const pds=getPayPeriods(today(),30,s,voys);const nx=pds.find(p=>p.payDate>=today());return`Calendrier Paie: fr\u00e9quence=${ps.frequency}, d\u00e9lai=${ps.payDelay} semaines, jour=${JRSK[ps.payDay]||"Vendredi"}. ${nx?`Prochaine paie: ${nx.payDate} pour semaine ${nx.weekMon} \u00e0 ${nx.weekFri}.`:""}`;})()}
Si on demande des dates de paie, quand je vais toucher, prochaine paie, etc: utilise les infos ci-dessus. L'utilisateur touche avec ${(s.payrollSchedule||{payDelay:2}).payDelay} semaines de d\u00e9lai.
Sois concis, utile, et utilise les donn\u00e9es r\u00e9elles ci-dessus.`;};

const analyze=(q)=>{
const lo=q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const s=data.settings||{};const ent=s.entreprise||{};
const voys=data.voyages||[];const deps=data.depenses||[];const facs=data.factures||[];
const clis=data.clients||[];const vehs=data.vehicules||[];const emps=data.chauffeurs||[];
const ents=data.entretiens||[];
const totTrips=voys.reduce((s,v)=>(v.trips||[]).reduce((s2,t)=>s2+(t.nbVoyages||0),s),0);
const totDep=deps.reduce((s,d)=>s+(d.montant||0),0);
const totFac=facs.reduce((s,f)=>s+(f.total||0),0);
const tare=s.tare||DEF_TARE;
let totRev=0;voys.forEach(v=>(v.trips||[]).forEach(t=>{const pN=Math.max(0,(t.poidsChaj||0)-tare);totRev+=pN*(ZR[t.zone]||0)*(t.nbVoyages||1);}));
const profit=totRev-totDep;
if(lo.match(/^(bonjou|bonswa|hello|hi|hey|salut|sak pase|sa k ap|koman ou ye)/))return`Bonjour ${user?.displayName||""}! 👋 Comment puis-je vous aider aujourd'hui?`;
if(lo.match(/stati|resume|rezime|sommaire|overview|dashboard|done mwen|tout bagay|general/))return`📊 R\u00e9sum\u00e9:\n👥 ${emps.length} Employ\u00e9(s): ${emps.map(e=>e.nom).join(", ")||"aucun"}\n🚛 ${vehs.length} V\u00e9hicule(s): ${vehs.map(v=>v.nom).join(", ")||"aucun"}\n👤 ${clis.length} Client(s): ${clis.map(c=>c.nom).join(", ")||"aucun"}\n📦 ${voys.length} jours de voyage (${totTrips} trajets)\n🧾 ${facs.length} Facture(s) (${fN(totFac)} $)\n💸 ${deps.length} D\u00e9pense(s) (${fN(totDep)} $)\n🔧 ${ents.length} Entretien(s)\n💰 Revenu: ${fN(totRev)} $ | Profit: ${fN(profit)} $`;
if(lo.match(/voyaj|voyage|trip|livrezon|combien voyage|konben voyage/)){const byM={};voys.forEach(v=>{const m=v.date?.substring(0,7);if(m){if(!byM[m])byM[m]=0;(v.trips||[]).forEach(t=>{byM[m]+=(t.nbVoyages||0);});}});return`📦 ${voys.length} jours, ${totTrips} trajets\n${Object.entries(byM).sort().map(([m,n])=>`  ${m}: ${n}`).join("\n")}\n➡️ Allez \u00e0 "Voyages"`;}
if(lo.match(/revni|revenu|revenue|lajan|konben mwen fe|konben m fe|gain|rantre/))return`💰 Revenu: ${fN(totRev)} $\nFactures: ${fN(totFac)} $ | D\u00e9penses: ${fN(totDep)} $\nProfit: ${fN(profit)} $ ${profit>=0?"✅":"⚠️"}\n➡️ "Rapport Annuel"`;
if(lo.match(/depans|depens|expense|essence|assuranc|cout|kou|konben m depanse/)){const byCat={};deps.forEach(d=>{byCat[d.categorie||"Autre"]=(byCat[d.categorie||"Autre"]||0)+(d.montant||0);});return`💸 ${deps.length} d\u00e9penses = ${fN(totDep)} $\n${Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([c,m])=>`  ${c}: ${fN(m)} $`).join("\n")}\n➡️ "Comptabilit\u00e9"`;}
if(lo.match(/fakti|factur|invoice/)){return`🧾 ${facs.length} factures = ${fN(totFac)} $\n${facs.map(f=>`  ${f.numero}: ${fN(f.total||0)} $ — ${f.statut}`).join("\n")}\n➡️ "Factures"`;}
if(lo.match(/kalandriye|calendrier|calendar|dat paie|next payday|kile.*touche|kile.*peye|prochen paie|prochen peman|prochaine paie|dat peman|jou paie|jour de paie|kile.*paye|touche kob|quand.*pay/)){const ps=s.payrollSchedule||{frequency:"weekly",payDelay:2,payDay:5};const pds=getPayPeriods(today(),30,s,voys);const upc=pds.filter(p=>p.payDate>=today()).slice(0,3);if(upc.length===0)return`📅 Aucune date de paie trouv\u00e9e. Allez \u00e0 "📅 Calendrier" pour configurer votre horaire de paie.`;const nx=upc[0];const du=Math.ceil((new Date(nx.payDate+"T12:00:00")-new Date(today()+"T12:00:00"))/86400000);let r=`📅 Prochaine Paie:\n💰 ${fD(nx.payDate)} (${JRSK[ps.payDay]||"Vendredi"})`;r+=du===0?" — AUJOURD'HUI! 🎉\n":` — dans ${du} jours\n`;r+=`   Pour la semaine: ${fDs(nx.weekMon)} → ${fDs(nx.weekFri)}\n`;if(upc.length>1){r+=`\n📆 Ensuite:\n`;upc.slice(1).forEach(p=>{r+=`   ${fD(p.payDate)} → sem. ${fDs(p.weekMon)}-${fDs(p.weekFri)}\n`;});}r+=`\n⚙️ D\u00e9lai: ${ps.payDelay} semaines | ${ps.frequency==="biweekly"?"Aux 2 sem.":"Chaque semaine"}`;r+=`\n➡️ "📅 Calendrier"`;return r;}
if(lo.match(/paie|pai|pay|salaire|saler|chofe|helper/))return`💵 Taux défaut: Chauffeur ${s.tauxChauffeur||80}$/voy, Helper ${s.tauxHelper||65}$/voy\n${emps.map(e=>`  ${e.nom} (${e.role}) → $${parseFloat(e.tauxPersonnel)||(e.role==="Chauffeur"?s.tauxChauffeur:s.tauxHelper)}/voy${e.tauxPersonnel?" (perso)":""}`).join("\n")}\n➡️ "Paie" ou "🤖 Agent IA"`;
if(lo.match(/kliyan|client/))return`👤 Clients:\n${clis.map(c=>`  ${c.nom} — ${c.telephone||""} — ${c.courriel||""}`).join("\n")||"Aucun"}\n➡️ "Clients"`;
if(lo.match(/vehic|camion|truck|auto|machin|plaque/))return`🚛 V\u00e9hicules:\n${vehs.map(v=>`  ${v.nom} | ${v.plaque||"—"} | ${v.annee||"—"}`).join("\n")||"Aucun"}\n🔧 ${ents.length} entretien(s) (${fN(ents.reduce((s,e)=>s+(e.cout||0),0))} $)\n➡️ "V\u00e9hicules"`;
if(lo.match(/entretien|maintenance|reparas|huile|filtre/))return`🔧 Entretiens:\n${ents.map(e=>{const v=vehs.find(x=>x.id===e.vehiculeId);return`  ${fD(e.date)} ${v?.nom||"?"}: ${e.type} — ${fN(e.cout||0)} $`;}).join("\n")||"Aucun"}\n➡️ "V\u00e9hicules"`;
if(lo.match(/employe|anplwaye|staff|ekip/))return`👥 Employ\u00e9s:\n${emps.map(e=>`  ${e.nom} — ${e.role} — ${e.courriel||"—"}`).join("\n")||"Aucun"}\n➡️ "Employ\u00e9s"`;
if(lo.match(/entreprise|compani|info|tps|tvq|neq|adres/))return`🏢 ${ent.nom||"—"}\n${ent.adresse||""}, ${ent.ville||""}\nT\u00e9l: ${ent.telephone||"—"} | Email: ${ent.courriel||"—"}\nTPS: ${s.tpsNum||"—"} | TVQ: ${s.tvqNum||"—"} | NEQ: ${ent.neq||"—"}`;
if(lo.match(/ajan|agent|otomatiz|automati/))return`🤖 Agent IA automatise:\n1. Calculer la paie\n2. Cr\u00e9er PDF talon\n3. Ouvrir email\n4. Cr\u00e9er facture\n5. Envoyer par email\n➡️ "🤖 Agent IA"`;
if(lo.match(/backup|save|sauvegard|restore|import|export/))return`💾 Allez \u00e0 "Backup" pour:\n📥 T\u00e9l\u00e9charger JSON | 📤 Importer backup\n⚠️ Faites des sauvegardes souvent!`;
if(lo.match(/kijan|koman|how|comment|tutorial|gid|guide|ede|help|eksplik/))return`📖 Guide: Voyages→Factures→Paie→Comptabilit\u00e9→Backup\nUtilisez "🤖 Agent IA" pour tout automatiser!`;
if(lo.match(/profi|profit|benef|margin|marge/))return`📈 Revenu: ${fN(totRev)} $ | D\u00e9penses: ${fN(totDep)} $\nProfit: ${fN(profit)} $ (${totRev>0?(profit/totRev*100).toFixed(1):0}%) ${profit>=0?"✅":"⚠️"}`;
if(lo.match(/tare|pwa|poid|weight|kilo/))return`⚖️ TARE: ${s.tare||DEF_TARE}kg\nZone MTL(06): ${RM}$/kg | LAV(13): ${RL}$/kg\nCalcul: (Poids − TARE) × Taux × Nb`;
if(lo.match(/mesi|merci|thanks/))return`Avec plaisir! 😊`;
return`Je n'ai pas bien compris "${q}".\n\nEssayez: "r\u00e9sum\u00e9", "voyages", "d\u00e9penses", "factures", "paie", "v\u00e9hicules", "clients", "profit", "backup", "comment utiliser l'app"`;
};

const sendMsg=async()=>{
if(!input.trim()||loading)return;
const userMsg={role:"user",content:input.trim()};
if(aiMode&&apiKey){
setMsgs(prev=>[...prev,userMsg]);setInput("");setLoading(true);
try{
const hist=[...msgs.filter(m=>m.role!=="system"),userMsg].slice(-10);
const cleanKey=apiKey.trim().replace(/[^\x20-\x7E]/g,"");
const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":cleanKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:buildContext(),messages:hist.map(m=>({role:m.role,content:m.content}))})});
const d=await res.json();
if(d.error)throw new Error(d.error.message||"API error");
const reply=d.content?.map(b=>b.text||"").join("")||"Excusez-moi, une erreur est survenue.";
setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
}catch(e){
setMsgs(prev=>[...prev,{role:"assistant",content:`⚠️ Erreur API: ${e.message}\n\nSolutions:\n• V\u00e9rifiez la cl\u00e9 API dans ⚙️\n• V\u00e9rifiez vos cr\u00e9dits sur console.anthropic.com\n\nR\u00e9ponse locale:\n${analyze(input.trim())}`}]);
}setLoading(false);
}else{
const reply=analyze(input.trim());
setMsgs(prev=>[...prev,userMsg,{role:"assistant",content:reply}]);setInput("");}
};

return<>
<button onClick={()=>setOpen(!open)} style={{position:"fixed",bottom:24,right:24,zIndex:99990,width:56,height:56,borderRadius:"50%",border:"none",cursor:"pointer",background:aiMode?C.g2:C.g1,color:"#fff",fontSize:24,boxShadow:`0 8px 24px rgba(${aiMode?"34,197,94":"99,102,241"},.5)`,display:"flex",alignItems:"center",justifyContent:"center"}}>{open?"✕":"💬"}</button>
{open&&<div className="jw-chat" style={{position:"fixed",bottom:90,right:24,zIndex:99990,width:370,maxWidth:"calc(100vw - 16px)",height:520,maxHeight:"calc(100vh - 120px)",background:C.card,border:`1px solid ${C.border}`,borderRadius:16,display:"flex",flexDirection:"column",boxShadow:"0 16px 48px rgba(0,0,0,.5)"}}>
<div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
<div style={{display:"flex",alignItems:"center",gap:10}}>
<div style={{width:32,height:32,borderRadius:8,background:aiMode?C.g2:C.g1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
<div><div style={{fontWeight:700,fontSize:13,color:C.text}}>Assistant JW</div><div style={{fontSize:9,color:aiMode?C.green:C.dim}}>{aiMode?"🟢 Claude AI actif":"⚡ Mode local"}</div></div>
</div>
<div style={{display:"flex",gap:6}}>
<button onClick={()=>setShowKey(!showKey)} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:10}}>⚙️</button>
<button onClick={()=>setMsgs([{role:"assistant",content:"Bonjour! Comment puis-je vous aider? 😊"}])} style={{background:"none",border:"none",cursor:"pointer",color:C.dim,fontSize:10}}>🔄</button>
</div>
</div>
{showKey&&<div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:C.bg}}>
<div style={{fontSize:10,color:C.muted,marginBottom:6}}>🔑 Cl\u00e9 API Anthropic (optionnel — pour Claude AI)</div>
<div style={{display:"flex",gap:6}}>
<input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..." style={{flex:1,background:C.card,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 10px",fontSize:11,outline:"none"}}/>
<button onClick={()=>saveKey(apiKey)} style={{padding:"6px 10px",borderRadius:6,border:"none",cursor:"pointer",background:C.green,color:"#fff",fontSize:10,fontWeight:700}}>✓</button>
</div>
{aiMode&&<button onClick={removeKey} style={{marginTop:6,background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10}}>✕ Supprimer la cl\u00e9 / Retour local</button>}
<div style={{fontSize:9,color:C.dim,marginTop:6}}>🔒 La cl\u00e9 reste uniquement dans votre navigateur</div>
</div>}
<div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
{msgs.map((m,i)=><div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"85%"}}>
<div style={{background:m.role==="user"?C.accent:C.card2,color:m.role==="user"?"#fff":C.text,padding:"8px 12px",borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",fontSize:12,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.content}</div>
</div>)}
{loading&&<div style={{alignSelf:"flex-start"}}><div style={{background:C.card2,padding:"8px 16px",borderRadius:12,fontSize:12,color:C.dim}}>🧠 Claude r\u00e9fl\u00e9chit...</div></div>}
</div>
<div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
<input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg();}} placeholder={aiMode?"Posez n'importe quelle question...":"Posez votre question..."} style={{flex:1,background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12,outline:"none"}}/>
<button onClick={sendMsg} disabled={!input.trim()||loading} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",background:aiMode?C.g2:C.g1,color:"#fff",fontSize:14,fontWeight:700,opacity:(!input.trim()||loading?0.5:1)}}>➤</button>
</div>
</div>}
</>;}

function App(){
const[user,setUser]=useState(null);const[authMode,setAuthMode]=useState("login");
const[aUser,setAUser]=useState("");const[aPass,setAPass]=useState("");const[aPass2,setAPass2]=useState("");const[aErr,setAErr]=useState("");
const[pg,setPg]=useState("dashboard");const[data,setData]=useState(def);const[ld,setLd]=useState(true);const[toast,setToast]=useState(null);const[menuOpen,setMenuOpen]=useState(false);const[saveStatus,setSaveStatus]=useState(null);

// === API helpers (SQLite backend) ===
const API_URL=process.env.REACT_APP_API_URL||'';
const getToken=()=>localStorage.getItem('jw-token');
const setToken=(t)=>t?localStorage.setItem('jw-token',t):localStorage.removeItem('jw-token');
const api=async(path,options={})=>{const token=getToken();const res=await fetch(`${API_URL}${path}`,{headers:{'Content-Type':'application/json',...(token?{'Authorization':`Bearer ${token}`}:{})},...options});if(res.status===401){setToken(null);setUser(null);throw new Error('Session expirée');}if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error||'Erreur serveur');}return res.json();};

useEffect(()=>{if(!document.querySelector('meta[name="viewport"]')){const m=document.createElement("meta");m.name="viewport";m.content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no";document.head.appendChild(m);}
(async()=>{try{
const token=getToken();
if(token){
  const r=await api('/api/auth/me');
  setUser(r.user);
  const d=await api('/api/data');
  setData({...def,...d});
}
}catch(e){setToken(null);}setLd(false);})();},[]);

const doRegister=async()=>{setAErr("");if(!aUser.trim()||aUser.length<3){setAErr("Nom d'utilisateur: 3 caractères min.");return;}
if(!aPass||aPass.length<4){setAErr("Mot de passe: 4 caractères min.");return;}
if(aPass!==aPass2){setAErr("Les mots de passe ne correspondent pas.");return;}
try{const res=await api('/api/auth/register',{method:'POST',body:JSON.stringify({username:aUser,password:aPass,displayName:aUser})});
setToken(res.token);setUser(res.user);setData(def);setAErr("");}catch(e){setAErr(e.message||"Erreur!");}};

const doLogin=async()=>{setAErr("");if(!aUser.trim()||!aPass){setAErr("Remplir tous les champs.");return;}
try{const res=await api('/api/auth/login',{method:'POST',body:JSON.stringify({username:aUser,password:aPass})});
setToken(res.token);setUser(res.user);
const d=await api('/api/data');setData({...def,...d});
setAErr("");}catch(e){setAErr(e.message||"Nom d'utilisateur ou mot de passe incorrect.");}};

const doLogout=async()=>{setUser(null);setData(def);setPg("dashboard");setAUser("");setAPass("");setAPass2("");setToken(null);};

const sv=useCallback(nd=>{setData(nd);(async()=>{let ok=false;for(let i=0;i<3;i++){try{await api('/api/data',{method:'PUT',body:JSON.stringify(nd)});ok=true;setSaveStatus({ok:true,t:new Date().toLocaleTimeString()});break;}catch(e){console.error(`Save attempt ${i+1} failed:`,e);if(i<2)await new Promise(r=>setTimeout(r,2000));}}if(!ok){setSaveStatus({ok:false,t:new Date().toLocaleTimeString()});setToast({m:"Erè sovgad! Done yo pa ka sovgade.",t:"error"});setTimeout(()=>setToast(null),5000);}})();},[]);
const ms=(m,t="ok")=>{setToast({m,t});setTimeout(()=>setToast(null),3000);};
const nav=[{id:"dashboard",label:"Dashboard"},{id:"voyages",label:"Voyages"},{id:"chauffeurs",label:"Employés"},{id:"clients",label:"Clients"},{id:"vehicules",label:"Véhicules"},{id:"paie",label:"Paie"},{id:"kalandriye",label:"\uD83D\uDCC5 Calendrier"},{id:"factures",label:"Factures"},{id:"comptabilite",label:"Comptabilité"},{id:"livrecomptable",label:"📒 Livre Compta"},{id:"agent",label:"🤖 Agent IA"},{id:"revenus",label:"Rapport Annuel"},{id:"backup",label:"Backup"}];
const goPage=(id)=>{setPg(id);setMenuOpen(false);};

if(ld)return<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:40,fontWeight:900,background:C.g1,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>J&W Transport</div></div>;

if(!user)return<div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:16}}>
<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"40px 36px",width:"100%",maxWidth:420}}>
<div style={{textAlign:"center",marginBottom:28}}>
<div style={{width:56,height:56,borderRadius:14,background:C.g1,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:22,color:"#fff",marginBottom:12}}>JW</div>
<h1 style={{fontSize:22,fontWeight:900,color:C.text}}>J&W Transport</h1>
<p style={{fontSize:12,color:C.dim,marginTop:4}}>{authMode==="login"?"Connectez-vous à votre compte":"Créer un nouveau compte"}</p>
</div>
<div style={{display:"flex",marginBottom:20,borderRadius:8,overflow:"hidden",border:`1px solid ${C.border}`}}>
<button onClick={()=>{setAuthMode("login");setAErr("");}} style={{flex:1,padding:"10px",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:authMode==="login"?C.accent:"transparent",color:authMode==="login"?"#fff":C.muted}}>Connexion</button>
<button onClick={()=>{setAuthMode("register");setAErr("");}} style={{flex:1,padding:"10px",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:authMode==="register"?C.accent:"transparent",color:authMode==="register"?"#fff":C.muted}}>Inscription</button>
</div>
<In label="Nom d'utilisateur" value={aUser} onChange={setAUser} placeholder="ex: jean" style={{marginBottom:12}}/>
<div style={{marginBottom:12}}><label style={{fontSize:11,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Mot de passe</label><input type="password" value={aPass} onChange={e=>setAPass(e.target.value)} placeholder="••••••" style={{background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:16,outline:"none",width:"100%",minHeight:40}} onKeyDown={e=>{if(e.key==="Enter"&&authMode==="login")doLogin();}}/></div>
{authMode==="register"&&<div style={{marginBottom:12}}><label style={{fontSize:11,color:C.muted,fontWeight:600,display:"block",marginBottom:4}}>Confirmer mot de passe</label><input type="password" value={aPass2} onChange={e=>setAPass2(e.target.value)} placeholder="••••••" style={{background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:16,outline:"none",width:"100%",minHeight:40}} onKeyDown={e=>{if(e.key==="Enter")doRegister();}}/></div>}
{aErr&&<div style={{background:`${C.red}15`,border:`1px solid ${C.red}30`,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:C.red,fontWeight:600}}>{aErr}</div>}
<button onClick={authMode==="login"?doLogin:doRegister} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",cursor:"pointer",background:C.g1,color:"#fff",fontSize:14,fontWeight:800,marginBottom:12}}>{authMode==="login"?"Se connecter":"Créer le compte"}</button>
<p style={{textAlign:"center",fontSize:11,color:C.dim}}>{authMode==="login"?"Pas encore de compte? ":"Déjà un compte? "}<button onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setAErr("");}} style={{background:"none",border:"none",cursor:"pointer",color:C.accentL,fontWeight:700,fontSize:11}}>{authMode==="login"?"S'inscrire":"Se connecter"}</button></p>
</div></div>;

return<div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,sans-serif",color:C.text}}>
<div className="jw-desk" style={{display:"flex",minHeight:"100vh"}}>
<nav className="jw-sidebar" style={{width:185,background:C.card,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
<div style={{padding:"14px 12px",borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:32,height:32,borderRadius:8,background:C.g1,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,color:"#fff"}}>JW</div><div><div style={{fontWeight:800,fontSize:13}}>J&W Transport</div><div style={{fontSize:8,color:C.dim}}>v7.2</div></div></div></div>
<div style={{padding:"6px 5px",flex:1,overflowY:"auto"}}>{nav.map(it=>{const a=pg===it.id;return<button key={it.id} onClick={()=>goPage(it.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:5,padding:"8px 10px",borderRadius:7,border:"none",cursor:"pointer",background:a?`${C.accent}15`:"transparent",color:a?C.accentL:C.muted,fontSize:11,fontWeight:a?700:500,marginBottom:1,textAlign:"left"}}>{it.label}</button>;})}</div>
<div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
<div style={{width:28,height:28,borderRadius:7,background:C.g4,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,color:"#fff"}}>{user.displayName.charAt(0).toUpperCase()}</div>
<div style={{flex:1,minWidth:0}}><div style={{fontSize:11,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.displayName}</div></div>
</div>
{saveStatus&&<div style={{fontSize:9,padding:"4px 6px",borderRadius:5,marginBottom:6,background:saveStatus.ok?`${C.green||'#22c55e'}15`:`${C.red}15`,color:saveStatus.ok?(C.green||'#22c55e'):C.red,fontWeight:600,textAlign:"center"}}>{saveStatus.ok?`✓ Sovgade ${saveStatus.t}`:`✗ Erè sovgad ${saveStatus.t}`}</div>}
<button onClick={doLogout} style={{width:"100%",padding:"6px",borderRadius:6,border:`1px solid ${C.red}30`,background:"transparent",cursor:"pointer",color:C.red,fontSize:10,fontWeight:600}}>Déconnexion</button>
</div>
</nav>
<main className="jw-main" style={{flex:1,overflowY:"auto",height:"100vh",padding:"20px 24px"}}>
<div className="jw-mobile-header" style={{display:"none",alignItems:"center",justifyContent:"space-between",padding:"10px 0",marginBottom:10}}>
<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:6,background:C.g1,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:10,color:"#fff"}}>JW</div><span style={{fontWeight:800,fontSize:14}}>J&W</span><span style={{fontSize:10,color:C.dim}}>{user.displayName}</span></div>
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<button onClick={doLogout} style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:10,fontWeight:600}}>{"↪"}</button>
<button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"none",border:"none",cursor:"pointer",color:C.text,fontSize:22,padding:4}}>{"☰"}</button>
</div>
</div>
{menuOpen&&<div className="jw-mobile-menu" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:8,marginBottom:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
{nav.map(it=>{const a=pg===it.id;return<button key={it.id} onClick={()=>goPage(it.id)} style={{padding:"10px 8px",borderRadius:7,border:"none",cursor:"pointer",background:a?`${C.accent}15`:"transparent",color:a?C.accentL:C.muted,fontSize:11,fontWeight:a?700:500,textAlign:"left"}}>{it.label}</button>;})}
<button onClick={doLogout} style={{padding:"10px 8px",borderRadius:7,border:`1px solid ${C.red}30`,cursor:"pointer",background:"transparent",color:C.red,fontSize:11,fontWeight:700,textAlign:"left",gridColumn:"1/3"}}>Déconnexion ({user.displayName})</button>
</div>}
{pg==="dashboard"&&<Dash data={data} go={goPage}/>}
{pg==="voyages"&&<Voy data={data} sv={sv} ms={ms}/>}
{pg==="chauffeurs"&&<Chauf data={data} sv={sv} ms={ms}/>}
{pg==="clients"&&<Clients data={data} sv={sv} ms={ms}/>}
{pg==="vehicules"&&<Vehic data={data} sv={sv} ms={ms}/>}
{pg==="paie"&&<Paie data={data}/>}
{pg==="kalandriye"&&<KalandryePaie data={data} sv={sv} ms={ms}/>}
{pg==="factures"&&<Fact data={data} sv={sv} ms={ms}/>}
{pg==="comptabilite"&&<Compta data={data} sv={sv} ms={ms}/>}
{pg==="livrecomptable"&&<LivreComptable data={data} sv={sv} ms={ms}/>}
{pg==="agent"&&<AjanIA data={data} sv={sv} ms={ms}/>}
{pg==="revenus"&&<RevAn data={data}/>}
{pg==="backup"&&<Back data={data} sv={sv} ms={ms}/>}
</main>
</div>
{user&&<ChatBot data={data} user={user}/>}
{toast&&<div style={{position:"fixed",bottom:20,right:20,zIndex:99999,background:toast.t==="ok"?C.green:toast.t==="error"?C.red:C.accent,color:"#fff",padding:"10px 22px",borderRadius:10,fontSize:13,fontWeight:700,boxShadow:"0 8px 24px rgba(0,0,0,.4)"}}>{toast.m}</div>}
<style>{`
*{box-sizing:border-box;margin:0}select option{background:${C.card};color:${C.text}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
@media(max-width:768px){
input,select,textarea{font-size:16px!important}
.jw-sidebar{display:none!important}
.jw-desk{display:block!important}
.jw-main{height:auto!important;min-height:100vh!important;padding:12px 10px!important;overflow-x:hidden!important;overflow-y:visible!important}
.jw-mobile-header{display:flex!important}
h1{font-size:18px!important}
table{font-size:10px!important}
th,td{padding:4px 6px!important}
.jw-st{padding:10px 12px!important;min-width:80px!important;flex:1 1 80px!important}
.jw-st div:last-child div:last-child{font-size:14px!important}
.jw-grid2{grid-template-columns:1fr!important}
.jw-grid3{grid-template-columns:1fr!important}
.jw-grid2c{grid-template-columns:1fr!important}
.jw-wrap{flex-wrap:wrap!important}
.jw-tbl-wrap{overflow-x:auto!important;-webkit-overflow-scrolling:touch}
.jw-tbl-wrap table{min-width:500px}
}
@media(min-width:769px){
.jw-mobile-header{display:none!important}
.jw-mobile-menu{display:none!important}
}
@media(max-width:480px){
.jw-main{padding:8px 6px!important}
.jw-st{padding:8px 10px!important;min-width:65px!important;flex:1 1 65px!important}
.jw-st div:last-child div:last-child{font-size:11px!important}
.jw-st div:first-child{font-size:8px!important}
table{font-size:9px!important}
th,td{padding:3px 4px!important}
.jw-grid2{grid-template-columns:1fr!important}
.jw-grid3{grid-template-columns:1fr!important}
button{font-size:11px!important}
.jw-chat{right:8px!important;bottom:80px!important;width:calc(100vw - 16px)!important;height:calc(100vh - 100px)!important;border-radius:12px!important}
}
`}</style>
</div>;}

export default App;