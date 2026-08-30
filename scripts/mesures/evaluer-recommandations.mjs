/* =====================================================================
   ÉVALUATION DES RECOMMANDATIONS — Lot 5.5

   Usage : node scripts/evaluer-recommandations.mjs [--detail]

   LA QUESTION

   La plateforme appariait étudiants et offres par correspondance EXACTE
   de compétences. Le Lot 5.1 a remplacé cette correspondance par une
   structure de similarité apprise du corpus lui-même. Cette substitution
   apporte-t-elle quelque chose de mesurable, ou seulement de
   l'apparence ?

   LA DIFFICULTÉ : IL N'Y A PAS DE VÉRITÉ TERRAIN

   Le plan prévoyait de tirer la vérité terrain de l'historique des
   candidatures — qui a postulé, qui a été retenu. Cet historique
   n'existe pas : la table "Candidature" est vide.

   Fabriquer des candidatures serait pire que de ne rien faire. Si on les
   engendrait avec notre propre fonction de score, on mesurerait le
   score contre lui-même : le résultat serait garanti d'avance et ne
   vaudrait rien. Si on les tirait au hasard, elles ne diraient rien.

   LA SOLUTION : L'ABLATION

   On s'appuie sur ce que la base contient réellement — les compétences
   déclarées — et sur une définition de la pertinence qui n'emprunte
   RIEN au modèle évalué :

     une offre est PERTINENTE pour un étudiant si celui-ci possède
     toutes ses compétences obligatoires, au sens strict de l'égalité
     d'identifiant.

   C'est de la correspondance exacte : la définition favorise donc la
   baseline, pas la co-occurrence. Tout gain mesuré sera conservateur.

   On dégrade ensuite le profil en retirant UNE compétence, et l'on
   demande aux deux systèmes de retrouver le classement d'origine. C'est
   la situation réelle : un profil incomplet, ce qui est le cas normal
   d'un étudiant qui n'a pas tout saisi.

     Baseline      ne peut plus voir l'offre : la compétence exigée a
                   disparu du profil.
     Co-occurrence peut la retrouver, si le corpus lui a appris qu'une
                   compétence restante en est proche.

   CONTRE LA FUITE

   La matrice apprend des offres ET des profils étudiants. Elle voit donc
   le profil qu'on s'apprête à évaluer. Deux protocoles :

     A. matrice reconstruite pour chaque étudiant, SANS son profil ;
     B. matrice apprise sur la moitié des offres, évaluation sur l'autre
        moitié — aucune des offres classées n'a servi à l'apprentissage.

   B est le contrôle sévère. Si A et B concordent, le gain n'est pas un
   artefact de mémorisation.
   ===================================================================== */
import pg from 'pg';
import { construireMatrice } from '../../src/lib/cooccurrence.js';
import { evaluerCouple, POIDS } from '../../src/lib/appariement.js';

const DETAIL = process.argv.includes('--detail');
const RANGS = [1, 3, 5, 10];

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});
const client = await pool.connect();

/* ---------------------------------------------------------------------
   Chargement
   --------------------------------------------------------------------- */
const offres = (await client.query('SELECT * FROM offre')).rows;
const etudiants = (await client.query('SELECT * FROM etudiant')).rows;
const preferences = (await client.query('SELECT * FROM "preference-stage"')).rows;
const interets = (await client.query('SELECT * FROM "centre-interet"')).rows;

const competencesOffre = new Map();
for (const r of (await client.query('SELECT * FROM "CompetenceOffre"')).rows) {
  if (!competencesOffre.has(r.idOffre)) competencesOffre.set(r.idOffre, []);
  competencesOffre.get(r.idOffre).push(r);
}
const competencesEtudiant = new Map();
for (const r of (await client.query('SELECT * FROM "CompetenceEtudiant"')).rows) {
  if (!competencesEtudiant.has(r.idEtudiant)) competencesEtudiant.set(r.idEtudiant, []);
  competencesEtudiant.get(r.idEtudiant).push(r);
}
const preferenceDe = new Map(preferences.map(p => [p.idEtudiant, p]));
const interetsDe = new Map();
for (const i of interets) {
  if (!interetsDe.has(i.idEtudiant)) interetsDe.set(i.idEtudiant, []);
  interetsDe.get(i.idEtudiant).push(i);
}

/* ---------------------------------------------------------------------
   Pertinence — définie sur le profil COMPLET, par correspondance exacte

   Aucune notion de similarité n'intervient ici. C'est volontaire : la
   vérité terrain ne doit rien devoir au système qu'elle sert à juger.
   --------------------------------------------------------------------- */
function offresPertinentes(idEtudiant, universOffres) {
  const possedees = new Set(
    (competencesEtudiant.get(idEtudiant) || []).map(c => c.idCompetenceReference)
  );
  const pertinentes = new Set();
  for (const o of universOffres) {
    const exigees = (competencesOffre.get(o.idOffre) || []).filter(c => c.estObligatoire);
    if (exigees.length === 0) continue;            // sans exigence, pas de signal
    if (exigees.every(c => possedees.has(c.idCompetenceReference))) {
      pertinentes.add(o.idOffre);
    }
  }
  return pertinentes;
}

/* ---------------------------------------------------------------------
   Classement et métriques
   --------------------------------------------------------------------- */

/* Départage déterministe et IDENTIQUE dans les deux bras : sans cela,
   l'ordre des ex aequo suffirait à créer un écart illusoire. */
/* Recompose le score global avec un autre poids pour les compétences,
   les quatre autres composantes conservant leurs proportions relatives.
   Sert à l'analyse de sensibilité : on ne modifie rien en production. */
function recombiner(scores, poidsCompetence) {
  const restant = 100 - poidsCompetence;
  const sommeAutres = POIDS.filiere + POIDS.niveau + POIDS.localisation + POIDS.preference;
  const f = restant / sommeAutres;
  return Math.round((
    scores.competence * poidsCompetence +
    scores.filiere * POIDS.filiere * f +
    scores.niveau * POIDS.niveau * f +
    scores.localisation * POIDS.localisation * f +
    scores.preference * POIDS.preference * f
  ) / 100);
}

function classer(etudiant, universOffres, competencesDegradees, matrice,
                 composanteSeule = false, poidsCompetence = null) {
  const notes = universOffres.map(offre => {
    const r = evaluerCouple({
      offre,
      etudiant,
      competencesOffre: competencesOffre.get(offre.idOffre) || [],
      competencesEtudiant: competencesDegradees,
      preference: preferenceDe.get(etudiant.idEtudiant) || null,
      centresInteret: interetsDe.get(etudiant.idEtudiant) || [],
      matrice
    });
    return {
      idOffre: offre.idOffre,
      /* Classer sur la seule composante compétences isole le mécanisme :
         les quatre autres composantes sont identiques dans les deux bras
         et y masquent son effet. */
      score: composanteSeule ? r.scores.competence
           : (poidsCompetence === null ? r.global : recombiner(r.scores, poidsCompetence))
    };
  });
  notes.sort((a, b) => b.score - a.score || a.idOffre - b.idOffre);
  return notes.map(n => n.idOffre);
}

function precisionAuRang(classement, pertinentes, k) {
  const tete = classement.slice(0, k);
  return tete.filter(id => pertinentes.has(id)).length / k;
}
function rappelAuRang(classement, pertinentes, k) {
  if (pertinentes.size === 0) return 0;
  const tete = classement.slice(0, k);
  return tete.filter(id => pertinentes.has(id)).length / pertinentes.size;
}
/* NDCG à pertinence binaire. */
function ndcgAuRang(classement, pertinentes, k) {
  let dcg = 0;
  for (let i = 0; i < Math.min(k, classement.length); i++) {
    if (pertinentes.has(classement[i])) dcg += 1 / Math.log2(i + 2);
  }
  let idcg = 0;
  for (let i = 0; i < Math.min(k, pertinentes.size); i++) idcg += 1 / Math.log2(i + 2);
  return idcg === 0 ? 0 : dcg / idcg;
}
/* Rang réciproque moyen : à quelle position apparaît la première offre
   réellement pertinente. Complète les métriques au rang fixe, qui ne
   distinguent pas la 1re de la 5e place. */
function rangReciproque(classement, pertinentes) {
  for (let i = 0; i < classement.length; i++) {
    if (pertinentes.has(classement[i])) return 1 / (i + 1);
  }
  return 0;
}

function accumulateur() {
  const a = { essais: 0, mrr: 0 };
  for (const k of RANGS) { a[`p${k}`] = 0; a[`r${k}`] = 0; a[`n${k}`] = 0; }
  return a;
}
function accumuler(a, classement, pertinentes) {
  a.essais++;
  a.mrr += rangReciproque(classement, pertinentes);
  for (const k of RANGS) {
    a[`p${k}`] += precisionAuRang(classement, pertinentes, k);
    a[`r${k}`] += rappelAuRang(classement, pertinentes, k);
    a[`n${k}`] += ndcgAuRang(classement, pertinentes, k);
  }
}
const moyenne = (a, cle) => a.essais ? a[cle] / a.essais : 0;

/* ---------------------------------------------------------------------
   Protocole d'ablation, commun aux deux expériences
   --------------------------------------------------------------------- */
/* `cibler` restreint la vérité terrain, pour chaque ablation, aux seules
   offres que cette ablation rend inatteignables par correspondance
   exacte — celles qui exigeaient précisément la compétence retirée.

   C'est la situation que la co-occurrence prétend traiter. La mesurer
   séparément n'est pas de la sélection favorable : la sous-population
   est définie a priori par la fonction annoncée du mécanisme, et le
   résultat global est rapporté à côté. */
async function executerProtocole({ nom, universOffres, matricePourEtudiant,
                                   cibler = false, composanteSeule = false,
                                   poidsCompetence = null, silencieux = false }) {
  const base = accumulateur();
  const cooc = accumulateur();
  let etudiantsRetenus = 0;
  const gains = [];

  for (const etudiant of etudiants) {
    const skills = competencesEtudiant.get(etudiant.idEtudiant) || [];
    if (skills.length < 2) continue;               // l'ablation exige un reste

    const pertinentes = offresPertinentes(etudiant.idEtudiant, universOffres);
    if (pertinentes.size === 0) continue;          // rien à retrouver

    etudiantsRetenus++;
    const matrice = await matricePourEtudiant(etudiant.idEtudiant);

    for (const retiree of skills) {
      const degradees = skills.filter(
        c => c.idCompetenceReference !== retiree.idCompetenceReference
      );

      let cible = pertinentes;
      if (cibler) {
        cible = new Set([...pertinentes].filter(id =>
          (competencesOffre.get(id) || []).some(c =>
            c.estObligatoire &&
            c.idCompetenceReference === retiree.idCompetenceReference)
        ));
        if (cible.size === 0) continue;   // cette ablation ne prouve rien
      }

      const clB = classer(etudiant, universOffres, degradees, null, composanteSeule, poidsCompetence);
      const clC = classer(etudiant, universOffres, degradees, matrice, composanteSeule, poidsCompetence);

      accumuler(base, clB, cible);
      accumuler(cooc, clC, cible);

      if (DETAIL) {
        const nB = ndcgAuRang(clB, cible, 5);
        const nC = ndcgAuRang(clC, cible, 5);
        if (Math.abs(nC - nB) > 0.01) {
          gains.push({
            etudiant: `${etudiant.prenomEtudiant} ${etudiant.nomEtudiant}`,
            retiree: retiree.idCompetenceReference,
            ndcgBase: nB.toFixed(3), ndcgCooc: nC.toFixed(3)
          });
        }
      }
    }
  }

  return { nom, base, cooc, etudiantsRetenus, universTaille: universOffres.length, gains };
}

function afficher(resultat) {
  const { nom, base, cooc, etudiantsRetenus, universTaille } = resultat;
  console.log(`\n${'='.repeat(66)}`);
  console.log(nom);
  console.log('='.repeat(66));
  console.log(`  ${etudiantsRetenus} étudiants retenus, ${base.essais} ablations, ` +
              `${universTaille} offres classées\n`);

  const ligne = (libelle, cle, pct = true) => {
    const b = moyenne(base, cle), c = moyenne(cooc, cle);
    const ecart = c - b;
    const fmt = v => pct ? (v * 100).toFixed(1).padStart(6) + ' %' : v.toFixed(3).padStart(8);
    const signe = Math.abs(ecart) < 0.0005 ? '   =   '
                : (ecart > 0 ? '  +' : '  ') + (pct ? (ecart * 100).toFixed(1) + ' pt' : ecart.toFixed(3));
    console.log(`  ${libelle.padEnd(14)} ${fmt(b)}   ${fmt(c)}   ${signe}`);
  };

  console.log(`  ${'métrique'.padEnd(14)} ${'baseline'.padStart(8)}   ${'co-occ.'.padStart(8)}   écart`);
  console.log(`  ${'-'.repeat(52)}`);
  for (const k of RANGS) ligne(`Précision@${k}`, `p${k}`);
  console.log();
  for (const k of RANGS) ligne(`Rappel@${k}`, `r${k}`);
  console.log();
  for (const k of RANGS) ligne(`NDCG@${k}`, `n${k}`);
  console.log();
  ligne('MRR', 'mrr', false);
}

/* ---------------------------------------------------------------------
   PROTOCOLE A — corpus complet, matrice sans le profil évalué
   --------------------------------------------------------------------- */
const cacheMatrice = new Map();
async function matriceSansEtudiant(idEtudiant) {
  if (!cacheMatrice.has(idEtudiant)) {
    cacheMatrice.set(idEtudiant, await construireMatrice(client, new Set([`e${idEtudiant}`])));
  }
  return cacheMatrice.get(idEtudiant);
}

const A = await executerProtocole({
  nom: 'PROTOCOLE A — corpus complet, matrice privée du profil évalué',
  universOffres: offres,
  matricePourEtudiant: matriceSansEtudiant
});

/* ---------------------------------------------------------------------
   PROTOCOLE B — apprentissage et évaluation sur des offres disjointes

   Le contrôle sévère. La matrice n'a jamais vu les offres qu'elle
   contribue à classer : aucun gain ne peut venir d'une mémorisation de
   leurs exigences.

   Partage déterministe par parité d'identifiant, pour que la mesure soit
   reproductible à l'identique.
   --------------------------------------------------------------------- */
const offresTest = offres.filter(o => o.idOffre % 2 === 0);
const offresApprentissage = offres.filter(o => o.idOffre % 2 !== 0);

const cacheMatriceB = new Map();
async function matriceSansTest(idEtudiant) {
  if (!cacheMatriceB.has(idEtudiant)) {
    const exclus = new Set(offresTest.map(o => `o${o.idOffre}`));
    exclus.add(`e${idEtudiant}`);
    cacheMatriceB.set(idEtudiant, await construireMatrice(client, exclus));
  }
  return cacheMatriceB.get(idEtudiant);
}

const B = await executerProtocole({
  nom: 'PROTOCOLE B — matrice apprise hors des offres évaluées (anti-fuite)',
  universOffres: offresTest,
  matricePourEtudiant: matriceSansTest
});

/* ---------------------------------------------------------------------
   PROTOCOLE C — mesure ciblée du mécanisme

   A et B mesurent l'effet sur le classement ENTIER. Or les compétences
   ne pèsent que 40 % du score : les 60 % restants — filière, niveau,
   localisation, préférences — sont identiques dans les deux bras et
   classent déjà correctement une bonne part des offres. L'effet du
   mécanisme y est dilué.

   C ne conserve, pour chaque ablation, que les offres exigeant la
   compétence retirée. Ce sont exactement celles que la correspondance
   exacte vient de perdre, et que la co-occurrence est censée retrouver.
   --------------------------------------------------------------------- */
const C = await executerProtocole({
  nom: "PROTOCOLE C — offres rendues inatteignables par l’ablation (ciblé)",
  universOffres: offres,
  matricePourEtudiant: matriceSansEtudiant,
  cibler: true
});

/* ---------------------------------------------------------------------
   PROTOCOLE D — le mécanisme seul, sans dilution

   Le diagnostic décisif. On classe sur la seule composante
   « compétences », qui est la seule que la matrice influence. Si le gain
   n'apparaît pas ici, il n'existe pas : ce n'est plus une question de
   dilution par les autres composantes du score.
   --------------------------------------------------------------------- */
const D = await executerProtocole({
  nom: 'PROTOCOLE D — classement sur la seule composante compétences',
  universOffres: offres,
  matricePourEtudiant: matriceSansEtudiant,
  cibler: true,
  composanteSeule: true
});

afficher(A);
afficher(B);
afficher(C);
afficher(D);

/* ---------------------------------------------------------------------
   SENSIBILITÉ AU POIDS DES COMPÉTENCES

   D montre que le mécanisme fonctionne isolé ; A montre qu'il disparaît
   dans le score complet. Reste à établir que c'est bien la PONDÉRATION
   qui l'absorbe, et non un hasard du corpus.

   On rejoue donc la mesure ciblée en faisant varier le seul poids des
   compétences, les autres composantes conservant leurs proportions.
   Rien n'est modifié en production : le but est de décrire un
   comportement, pas de régler le système sur son propre jeu d'essai —
   ce serait ajuster les paramètres sur les données de test.
   --------------------------------------------------------------------- */
console.log(`
${'='.repeat(66)}`);
console.log('SENSIBILITÉ — NDCG@5 ciblé selon le poids des compétences');
console.log('='.repeat(66));
console.log(`  ${'poids'.padStart(6)}   ${'baseline'.padStart(8)}   ${'co-occ.'.padStart(8)}   écart`);
console.log(`  ${'-'.repeat(46)}`);
for (const poids of [40, 55, 70, 85, 100]) {
  const r = await executerProtocole({
    nom: '', universOffres: offres, matricePourEtudiant: matriceSansEtudiant,
    cibler: true, poidsCompetence: poids
  });
  const b = moyenne(r.base, 'n5'), c = moyenne(r.cooc, 'n5');
  const ecart = (c - b) * 100;
  console.log(`  ${String(poids).padStart(5)} %   ${(b * 100).toFixed(1).padStart(6)} %   ` +
              `${(c * 100).toFixed(1).padStart(6)} %   ${(ecart >= 0 ? '+' : '') + ecart.toFixed(1)} pt`);
}
console.log(`
  Poids réellement en vigueur : ${POIDS.competence} %`);

console.log(`\n${'='.repeat(66)}`);
console.log('CONTEXTE DE LA MESURE');
console.log('='.repeat(66));
console.log(`  offres au corpus            : ${offres.length}`);
console.log(`  dont apprentissage / test B : ${offresApprentissage.length} / ${offresTest.length}`);
console.log(`  étudiants au corpus         : ${etudiants.length}`);
console.log(`  compétences au référentiel  : 56`);
console.log(`
  Ces effectifs sont faibles. Les écarts rapportés indiquent une
  direction, pas une performance. Toute décimale au-delà du dixième de
  point serait du bruit.`);

if (DETAIL && A.gains.length) {
  console.log(`\n  Ablations où le NDCG@5 diffère (protocole A) : ${A.gains.length}`);
  for (const g of A.gains.slice(0, 20)) {
    console.log(`    ${g.etudiant.padEnd(30)} base=${g.ndcgBase} cooc=${g.ndcgCooc}`);
  }
}

client.release();
await pool.end();
