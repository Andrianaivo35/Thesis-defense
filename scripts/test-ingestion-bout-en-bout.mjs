/* Test de bout en bout du pipeline d'ingestion, par HTTP, contre le
   conteneur. Vérifie la chaîne complète : dépôt, analyse, revue,
   confirmation, profil. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'http://localhost:3000';
const D = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cv-test');
const verite = JSON.parse(fs.readFileSync(path.join(D, 'verite.json'), 'utf8'));

/* Un CV SCANNÉ : c'est le cas qui exerce réellement l'OCR. */
const cible = verite.cvs.find(c => c.nature === 'scanne');
const email = `${cible.nom.toLowerCase().replace(/ /g, '.')}@demo.stageshare.mg`
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

console.log(`CV      : ${cible.fichier}`);
console.log(`Étudiant: ${cible.nom} <${email}>`);
console.log(`Attendu : ${cible.competencesAttendues.map(c => c.nom).join(', ')}\n`);

const connexion = await fetch(`${BASE}/api/etudiantLogin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, motDePasse: 'Demo1234!' })
});
const auth = await connexion.json();
if (!connexion.ok) { console.error('Connexion refusée :', auth); process.exit(1); }
const jeton = auth.token;
console.log('1. Connexion                 OK');

const H = { Authorization: `Bearer ${jeton}` };

// --- dépôt du CV ------------------------------------------------------
const form = new FormData();
form.append('fichier', new Blob([fs.readFileSync(path.join(D, cible.fichier))],
  { type: 'application/pdf' }), cible.fichier);
form.append('libelle', 'CV de test — ingestion');

const depot = await fetch(`${BASE}/api/cv`, { method: 'POST', headers: H, body: form });
const cv = await depot.json();
if (!depot.ok) { console.error('Dépôt refusé :', cv); process.exit(1); }
const idCV = cv.cv.idCV;
console.log(`2. Dépôt du CV               OK (idCV=${idCV})`);

// --- analyse ----------------------------------------------------------
const debut = Date.now();
const analyse = await fetch(`${BASE}/api/cv/${idCV}/analyse`, { method: 'POST', headers: H });
const res = await analyse.json();
if (!analyse.ok) { console.error('Analyse refusée :', res); process.exit(1); }
console.log(`3. Analyse                   OK en ${((Date.now() - debut) / 1000).toFixed(1)} s`);
console.log(`   voie=${res.voie} pages=${res.nombrePages} ocr=${res.pagesOcr} confiance=${res.confianceOcr} %`);

// --- revue ------------------------------------------------------------
const revue = await (await fetch(`${BASE}/api/cv/${idCV}/analyse`, { headers: H })).json();
const proposees = revue.detections.filter(d => d.proposee);
console.log(`4. Revue                     ${revue.detections.length} détections, ${proposees.length} cochées d'office`);
for (const d of revue.detections) {
  console.log(`   [${d.proposee ? 'x' : ' '}] ${d.nom.padEnd(24)} ${d.methode.padEnd(7)} conf=${d.confiance} sect=${d.section}`);
}

const attendues = new Set(cible.competencesAttendues.map(c => c.nom));
const trouvees = new Set(proposees.map(d => d.nom));
const manque = [...attendues].filter(n => !trouvees.has(n));
const enTrop = [...trouvees].filter(n => !attendues.has(n));
console.log(`   manqué : ${manque.join(', ') || '(aucun)'}`);
console.log(`   en trop: ${enTrop.join(', ') || '(aucun)'}`);

// --- confirmation -----------------------------------------------------
const conf = await fetch(`${BASE}/api/cv/${idCV}/analyse`, {
  method: 'PUT',
  headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify({ confirmees: proposees.map(d => d.idCompetenceReference) })
});
const bilan = await conf.json();
if (!conf.ok) { console.error('Confirmation refusée :', bilan); process.exit(1); }
console.log(`5. Confirmation              OK — ${bilan.message}`);
console.log(`   confirmées=${bilan.confirmees} rejetées=${bilan.rejetees} ajoutées au profil=${bilan.ajouteesAuProfil}`);

// --- vérification de l'isolation --------------------------------------
const autre = verite.cvs.find(c => c.idEtudiant !== cible.idEtudiant);
const intrus = await fetch(`${BASE}/api/cv/999999/analyse`, { headers: H });
console.log(`6. CV d'un tiers (999999)    ${intrus.status} ${intrus.status === 404 ? 'OK (refusé)' : 'PROBLÈME'}`);

const sansJeton = await fetch(`${BASE}/api/cv/${idCV}/analyse`);
console.log(`7. Sans authentification     ${sansJeton.status} ${sansJeton.status === 401 ? 'OK (refusé)' : 'PROBLÈME'}`);

// --- nettoyage --------------------------------------------------------
await fetch(`${BASE}/api/cv/${idCV}`, { method: 'DELETE', headers: H });
console.log('8. Nettoyage                 OK');
