/* Mesure du pipeline d'ingestion de CV sur le corpus de vérité terrain.
   Usage : node scripts/test-ingestion-cv.mjs [--detail]

   Le corpus (scripts/corpus/cv-test) a été généré à partir des profils réels de
   la base : on sait donc exactement quelles compétences chaque CV
   contient, et quels termes il contient SANS qu'ils soient des
   compétences. Les deux sont nécessaires :

     - les compétences attendues mesurent le RAPPEL (en a-t-on manqué ?)
     - les termes parasites mesurent la PRÉCISION (en a-t-on inventé ?)
*/
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { extraireTexteCV } from '../../src/lib/extractionTexte.js';
import { construireIndex, extraireCompetences, SEUIL_RETENTION } from '../../src/lib/appariementFlou.js';
import { libererOcr } from '../../src/lib/ocr.js';

const DOSSIER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'corpus', 'cv-test');
const DETAIL = process.argv.includes('--detail');

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});

const reference = await pool.query(
  `SELECT "idCompetenceReference", "nomCompetenceReference", "categorieCompetenceReference"
     FROM "CompetenceReference"`
);
const index = construireIndex(reference.rows);
await pool.end();

const verite = JSON.parse(fs.readFileSync(path.join(DOSSIER, 'verite.json'), 'utf8'));

let vraisPositifs = 0, fauxPositifs = 0, fauxNegatifs = 0;
let routageJuste = 0;
const confiancesOcr = [];
const manquees = new Map();
const inventees = new Map();
const parNature = {};

console.log(`Analyse de ${verite.cvs.length} CV...\n`);
const depart = Date.now();

for (const cv of verite.cvs) {
  const fichier = fs.readFileSync(path.join(DOSSIER, cv.fichier));
  const extraction = await extraireTexteCV(fichier);

  /* Le routage est-il celui qu'on attendait ? La vérité terrain connaît
     la nature de chaque CV puisqu'elle l'a fabriquée. */
  if (extraction.voie === cv.nature.replace('scanne', 'ocr').replace('natif', 'native')) {
    routageJuste++;
  }
  if (extraction.confianceOcr !== null) confiancesOcr.push(extraction.confianceOcr);

  const detections = new Map();
  for (const page of extraction.pages) {
    for (const d of extraireCompetences(page.texte, index, page.numero)) {
      const existante = detections.get(d.nom);
      if (!existante || d.confiance > existante.confiance) detections.set(d.nom, d);
    }
  }
  /* On ne compte que ce que le pipeline propose d'office. Ce qui reste
     sous le seuil est visible dans l'écran de revue mais non coché : le
     retenir ici gonflerait artificiellement le rappel. */
  const retenues = new Set(
    [...detections.values()].filter(d => d.confiance >= SEUIL_RETENTION).map(d => d.nom)
  );
  const attendues = new Set(cv.competencesAttendues.map(c => c.nom));

  const vp = [...attendues].filter(n => retenues.has(n));
  const fn = [...attendues].filter(n => !retenues.has(n));
  const fp = [...retenues].filter(n => !attendues.has(n));

  vraisPositifs += vp.length;
  fauxNegatifs += fn.length;
  fauxPositifs += fp.length;
  for (const n of fn) manquees.set(n, (manquees.get(n) || 0) + 1);
  for (const n of fp) inventees.set(n, (inventees.get(n) || 0) + 1);

  const s = parNature[cv.nature] || (parNature[cv.nature] = { n: 0, vp: 0, fn: 0, fp: 0 });
  s.n++; s.vp += vp.length; s.fn += fn.length; s.fp += fp.length;

  if (DETAIL) {
    console.log(`${cv.fichier}`);
    console.log(`   voie=${extraction.voie} pages=${extraction.nombrePages} ocr=${extraction.pagesOcr}` +
                ` confiance=${extraction.confianceOcr ?? '—'}`);
    console.log(`   attendu : ${[...attendues].join(', ') || '(rien)'}`);
    console.log(`   trouvé  : ${[...retenues].join(', ') || '(rien)'}`);
    if (fn.length) console.log(`   MANQUÉ  : ${fn.join(', ')}`);
    if (fp.length) console.log(`   INVENTÉ : ${fp.join(', ')}`);
    console.log();
  } else {
    process.stdout.write(fn.length === 0 && fp.length === 0 ? '.' : (fp.length ? '!' : '?'));
  }
}

await libererOcr();

const precision = vraisPositifs / (vraisPositifs + fauxPositifs || 1);
const rappel = vraisPositifs / (vraisPositifs + fauxNegatifs || 1);
const f1 = 2 * precision * rappel / (precision + rappel || 1);

console.log(`\n\n=== Routage ===`);
console.log(`   nature correctement détectée : ${routageJuste}/${verite.cvs.length}`);
console.log(`   confiance OCR moyenne        : ${
  confiancesOcr.length
    ? (confiancesOcr.reduce((s, c) => s + c, 0) / confiancesOcr.length).toFixed(1) + ' %'
    : '—'} (sur ${confiancesOcr.length} CV)`);

console.log(`\n=== Extraction de compétences ===`);
console.log(`   vrais positifs : ${vraisPositifs}`);
console.log(`   faux négatifs  : ${fauxNegatifs}  (compétences manquées)`);
console.log(`   faux positifs  : ${fauxPositifs}  (compétences inventées)`);
console.log(`   précision      : ${(precision * 100).toFixed(1)} %`);
console.log(`   rappel         : ${(rappel * 100).toFixed(1)} %`);
console.log(`   F1             : ${(f1 * 100).toFixed(1)} %`);

console.log(`\n=== Par nature de PDF ===`);
for (const [nature, s] of Object.entries(parNature)) {
  const p = s.vp / (s.vp + s.fp || 1), r = s.vp / (s.vp + s.fn || 1);
  console.log(`   ${nature.padEnd(8)} ${String(s.n).padStart(2)} CV` +
              ` | précision ${(p * 100).toFixed(1).padStart(5)} %` +
              ` | rappel ${(r * 100).toFixed(1).padStart(5)} %`);
}

if (manquees.size) {
  console.log(`\n=== Compétences les plus manquées ===`);
  for (const [n, c] of [...manquees].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`   ${String(c).padStart(3)} × ${n}`);
  }
}
if (inventees.size) {
  console.log(`\n=== Compétences les plus inventées ===`);
  for (const [n, c] of [...inventees].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`   ${String(c).padStart(3)} × ${n}`);
  }
}
console.log(`\nDurée : ${((Date.now() - depart) / 1000).toFixed(1)} s`);
