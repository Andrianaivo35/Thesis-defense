/* =====================================================================
   PEUPLEMENT : CV, candidatures, réponses au QCM, profils incomplets

   Usage : node scripts/seed-candidatures.mjs

   POURQUOI

   La table "Candidature" était vide. Toute la boucle fonctionnelle en
   dépendait sans rien avoir à montrer : tableau de bord entreprise à
   zéro, « Mes candidatures » vide, candidats suggérés sans historique,
   messagerie sans motif de conversation.

   ⚠️  AVERTISSEMENT — CES DONNÉES NE SONT PAS UNE VÉRITÉ TERRAIN ⚠️

   Les issues de candidature engendrées ici sont SYNTHÉTIQUES. Elles
   suivent un modèle de comportement écrit à la main, qui fait
   nécessairement des hypothèses proches de celles du moteur de
   recommandation : un étudiant postule dans son domaine, une note de QCM
   élevée aide à être retenu.

   Les utiliser pour évaluer les recommandations reviendrait à mesurer le
   système contre ses propres hypothèses. Le résultat serait flatteur et
   sans valeur. Le protocole d'évaluation
   ([MD/6 - EVALUATION.md](../MD/6%20-%20EVALUATION.md)) s'appuie
   délibérément sur l'ablation de compétences déclarées, PAS sur cette
   table.

   Ce peuplement sert à la démonstration et au développement. Rien d'autre.

   CE QUI EST ENGENDRÉ

     1. Un CV réel par étudiant, repris du corpus de test — dont des CV
        numérisés, pour que la lecture automatique soit démontrable
        immédiatement.
     2. Des candidatures, avec lettre, note de QCM et issue.
     3. Les réponses au QCM, cohérentes avec la note affichée.
     4. Les parcours et centres d'intérêt manquants.
   ===================================================================== */
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { randomUUID } from 'crypto';
import { trouverOuCreerPromotion, anneeUniversitaireCourante } from '../../src/lib/promotions.js';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

/* Le script vit dans scripts/base/ : il faut remonter DEUX niveaux
   pour atteindre la racine du projet. */
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CORPUS = path.join(RACINE, 'scripts', 'corpus', 'cv-test');
const CONTENEUR = process.env.CONTENEUR_APP || 'stage-share-app';

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});

/* Générateur reproductible : deux exécutions donnent le même jeu de
   données, sans quoi une capture d'écran de démonstration ne
   correspondrait plus à la base au rechargement suivant. */
let graine = 20260829;
const hasard = () => {
  graine = (graine * 1103515245 + 12345) & 0x7fffffff;
  return graine / 0x7fffffff;
};
const entre = (a, b) => a + Math.floor(hasard() * (b - a + 1));
const piocher = liste => liste[Math.floor(hasard() * liste.length)];
const melanger = liste => {
  const c = [...liste];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

const client = await pool.connect();

/* =====================================================================
   1. REMISE À ZÉRO
   ===================================================================== */
await client.query('BEGIN');
await client.query('DELETE FROM "ReponseEtudiant"');
await client.query('DELETE FROM "Candidature"');
/* Les CV déposés par les essais de bout en bout : leurs fichiers ne sont
   plus référencés par personne. */
await client.query('DELETE FROM "CompetenceDetectee"');
await client.query('DELETE FROM "CV"');
await client.query('COMMIT');
console.log('1. Tables remises à zéro');

/* =====================================================================
   2. UN CV RÉEL PAR ÉTUDIANT

   Le corpus de test a été engendré À PARTIR des profils de la base : le
   CV de chaque étudiant contient bien ses compétences déclarées. On le
   lui attribue donc comme véritable CV.

   L'intérêt dépasse le remplissage : une partie du corpus est numérisée,
   donc la lecture automatique (Lot 5.4) est démontrable sur des données
   de démonstration, sans avoir à déposer un fichier à la main.
   ===================================================================== */
const verite = JSON.parse(fs.readFileSync(path.join(CORPUS, 'verite.json'), 'utf8'));

const misEnScene = path.join(RACINE, '.cv-a-copier');
fs.rmSync(misEnScene, { recursive: true, force: true });
fs.mkdirSync(misEnScene, { recursive: true });

const etudiantsAvecCV = new Set();
let cvCrees = 0;

await client.query('BEGIN');
for (const cv of verite.cvs) {
  if (etudiantsAvecCV.has(cv.idEtudiant)) continue;   // un CV principal suffit
  const source = path.join(CORPUS, cv.fichier);
  if (!fs.existsSync(source)) continue;

  /* Le nom de stockage est engendré par le serveur, jamais repris du
     client : c'est la règle de src/lib/stockage.js, on la respecte. */
  const nomFichier = `cv-${randomUUID()}.pdf`;
  fs.copyFileSync(source, path.join(misEnScene, nomFichier));

  const libelle = cv.nature === 'scanne' ? 'CV (numérisé)'
                : cv.nature === 'mixte'  ? 'CV et attestation'
                : 'CV principal';

  await client.query(
    `INSERT INTO "CV" ("idEtudiant", "libelle", "nomFichier",
                       "nomFichierOriginal", "tailleOctets", "estPrincipal", "dateAjout")
     VALUES ($1, $2, $3, $4, $5, true, now() - ($6 || ' days')::interval)`,
    [cv.idEtudiant, libelle, nomFichier, cv.fichier,
     fs.statSync(source).size, entre(30, 180)]
  );
  etudiantsAvecCV.add(cv.idEtudiant);
  cvCrees++;
}
await client.query('COMMIT');

/* Les fichiers vivent sur un volume Docker, hors de public/. On les y
   dépose des deux côtés : dans le conteneur pour l'application, et dans
   ./uploads pour un `npm run dev` local. */
const localUploads = path.join(RACINE, 'uploads', 'cv');
fs.mkdirSync(localUploads, { recursive: true });
for (const f of fs.readdirSync(misEnScene)) {
  fs.copyFileSync(path.join(misEnScene, f), path.join(localUploads, f));
}
let copieConteneur = 'non tenté';
try {
  execFileSync('docker', ['cp', `${misEnScene}/.`, `${CONTENEUR}:/app/uploads/cv/`],
    { stdio: 'pipe' });
  copieConteneur = 'OK';
} catch (erreur) {
  copieConteneur = `échec (${String(erreur.stderr || erreur.message).trim().slice(0, 80)})`;
}
fs.rmSync(misEnScene, { recursive: true, force: true });
console.log(`2. ${cvCrees} CV attribués — volume conteneur : ${copieConteneur}`);

/* =====================================================================
   3. PROFILS INCOMPLETS

   Neuf étudiants n'avaient ni parcours ni centre d'intérêt. Leur fiche
   s'affichait vide, et le score de filière ne disposait d'aucun signal
   d'intérêt pour eux.
   ===================================================================== */
const PARCOURS = {
  'Informatique et Numérique': [
    ['Projet', 'Application de gestion', "Développement d'une application interne de suivi des stocks."],
    ['Stage', 'Stage découverte en développement', 'Participation à la maintenance corrective du site web du service.']
  ],
  'Gestion et Commerce': [
    ['Projet', 'Étude de marché', "Analyse de la concurrence sur le marché local des produits laitiers."],
    ['Stage', 'Stage en service commercial', "Suivi de la relation client et mise à jour du fichier prospects."]
  ],
  'Génie Civil et BTP': [
    ['Projet', 'Étude de structure', "Dimensionnement d'une passerelle piétonne en béton armé."],
    ['Stage', 'Stage de chantier', "Suivi quotidien d'un chantier de logements et relevés de conformité."]
  ],
  'Agro-industrie et Agronomie': [
    ['Projet', 'Essai en parcelle', "Comparaison de trois itinéraires techniques sur la culture du riz."],
    ['Stage', 'Stage en coopérative', "Appui au contrôle qualité à la réception des récoltes."]
  ],
  'Télécommunications': [
    ['Projet', 'Étude de couverture réseau', "Simulation de la couverture d'un site relais en zone périurbaine."],
    ['Stage', 'Stage en support réseau', "Assistance aux techniciens sur les interventions de maintenance."]
  ],
  'Communication et Médias': [
    ['Projet', 'Campagne de sensibilisation', "Conception d'une campagne sur le tri des déchets pour un public étudiant."],
    ['Stage', 'Stage en agence', "Rédaction de contenus et animation des réseaux sociaux."]
  ],
  'Tourisme et Hôtellerie': [
    ['Projet', 'Circuit touristique', "Conception d'un circuit de trois jours dans la région Vakinankaratra."],
    ['Stage', 'Stage en réception', "Accueil des clients et gestion des réservations en haute saison."]
  ],
  'Pêche et Ressources Marines': [
    ['Projet', 'Suivi de bassin', "Relevés de croissance sur un bassin d'aquaculture expérimental."],
    ['Stage', 'Stage en unité de transformation', "Contrôle des températures et traçabilité des lots."]
  ],
  'Génie Industriel et Énergie': [
    ['Projet', 'Optimisation de ligne', "Analyse des temps de cycle sur une ligne de conditionnement."],
    ['Stage', 'Stage en maintenance', "Participation aux opérations de maintenance préventive."]
  ]
};
const PARCOURS_DEFAUT = [
  ['Projet', 'Projet de fin de cycle', "Travail de groupe sur un cas pratique, avec restitution orale."],
  ['Stage', "Stage d'observation", "Découverte du fonctionnement quotidien d'une structure."]
];
const MISSIONS = [
  'Travailler en équipe sur un projet concret',
  'Être formé par un tuteur expérimenté',
  'Découvrir le fonctionnement réel du métier',
  'Prendre des responsabilités sur une mission identifiée',
  'Contribuer à une mission utile à la structure'
];

const sansParcours = (await client.query(`
  SELECT e."idEtudiant", e."filiere" FROM etudiant e
   WHERE NOT EXISTS (SELECT 1 FROM "parcours-realisation" p
                      WHERE p."idEtudiant" = e."idEtudiant")`)).rows;
const sansInteret = (await client.query(`
  SELECT e."idEtudiant", e."filiere", e."specialisation" FROM etudiant e
   WHERE NOT EXISTS (SELECT 1 FROM "centre-interet" c
                      WHERE c."idEtudiant" = e."idEtudiant")`)).rows;

await client.query('BEGIN');
for (const e of sansParcours) {
  for (const [type, titre, description] of (PARCOURS[e.filiere] || PARCOURS_DEFAUT)) {
    const debut = new Date(2025, entre(0, 8), entre(1, 28));
    const fin = new Date(debut.getTime() + entre(45, 150) * 86400000);
    await client.query(
      `INSERT INTO "parcours-realisation"
         ("idEtudiant", type, titre, description, entreprise, "dateDebut", "dateFin")
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [e.idEtudiant, type, titre, description,
       type === 'Stage' ? piocher(['Structure locale', 'Entreprise partenaire', 'Cabinet local']) : null,
       debut, fin]
    );
  }
}
for (const e of sansInteret) {
  await client.query(
    `INSERT INTO "centre-interet" ("idEtudiant", "domaineInteret", "missionPreferee")
     VALUES ($1, $2, $3)`,
    [e.idEtudiant, e.specialisation || e.filiere, piocher(MISSIONS)]
  );
}
await client.query('COMMIT');
console.log(`3. ${sansParcours.length} parcours et ${sansInteret.length} centres d'intérêt ajoutés`);

/* =====================================================================
   3bis. PROMOTIONS

   Les étudiants existaient avant l'entité « promotion » (Lot 6.4) : ils
   sont tous rattachés à un établissement, mais à aucun groupe. L'écran
   université, qui s'organise autour des promotions, n'aurait donc rien à
   montrer.

   On les regroupe par établissement, niveau et filière — exactement ce
   qu'une promotion est dans la réalité.

   SEULS LES GROUPES D'AU MOINS DEUX ÉTUDIANTS deviennent des promotions.
   Le corpus compte 38 étudiants répartis sur 15 universités : regrouper
   sans condition produirait une trentaine de « promotions » d'un seul
   inscrit, ce qui ne ressemble à rien et n'illustre pas la notion.

   Les autres restent sans promotion, état que l'écran affiche
   explicitement. C'est plus honnête que de fabriquer des étudiants pour
   la photo — et cela montre les deux cas de l'interface. Une promotion
   réaliste se crée en démonstration par l'import du Lot 6.3, qui est de
   toute façon le chemin prévu.
   ===================================================================== */
const groupes = (await client.query(`
  SELECT e."idUniversite", e."niveauAcademique", e."filiere",
         array_agg(e."idEtudiant") AS etudiants
    FROM etudiant e
   WHERE e."idUniversite" IS NOT NULL
     AND e."niveauAcademique" IS NOT NULL
     AND e."filiere" IS NOT NULL
     AND e."idPromotion" IS NULL
   GROUP BY 1,2,3
  HAVING count(*) >= 2
`)).rows;

const annee = anneeUniversitaireCourante();
let promotionsCreees = 0, rattaches = 0;

await client.query('BEGIN');
for (const g of groupes) {
  const promotion = await trouverOuCreerPromotion(client, {
    idUniversite: g.idUniversite,
    libelle: `${g.niveauAcademique} ${g.filiere}`,
    annee,
    niveauAcademique: g.niveauAcademique,
    filiere: g.filiere
  });
  promotionsCreees++;
  await client.query(
    'UPDATE etudiant SET "idPromotion" = $1 WHERE "idEtudiant" = ANY($2::int[])',
    [promotion.idPromotion, g.etudiants]
  );
  rattaches += g.etudiants.length;
}
await client.query('COMMIT');
const isoles = (await client.query(
  `SELECT count(*)::int AS n FROM etudiant
    WHERE "idUniversite" IS NOT NULL AND "idPromotion" IS NULL`)).rows[0].n;
console.log(`3bis. ${promotionsCreees} promotions, ${rattaches} étudiants rattachés, ` +
            `${isoles} sans promotion (groupes d'un seul inscrit)`);

/* =====================================================================
   3ter. UNE PROMOTION DÉJÀ DIPLÔMÉE

   L'écran université sépare les actifs des anciens (Lot 6.5). Sans un
   seul ancien, la moitié de cet écran est vide et la fonctionnalité
   invisible en démonstration.

   On clôt donc la plus petite promotion : ses membres deviennent des
   « anciens étudiants », restent sur la plateforme et continuent de
   candidater — ce qui est précisément l'intention du statut.
   ===================================================================== */
await client.query(`UPDATE etudiant SET "statutRattachement" = 'Valide',
                       "dateFinRattachement" = NULL, "motifFinRattachement" = NULL
                     WHERE "statutRattachement" IN ('Diplome', 'Sorti')`);
await client.query(`UPDATE "Promotion" SET "statut" = 'Active'`);

const aClore = (await client.query(`
  SELECT p."idPromotion", p."libelle", p."annee", count(e.*)::int AS n
    FROM "Promotion" p JOIN etudiant e ON e."idPromotion" = p."idPromotion"
   GROUP BY 1,2,3 ORDER BY n ASC LIMIT 1`)).rows[0];

if (aClore) {
  await client.query('BEGIN');
  await client.query(
    `UPDATE etudiant SET "statutRattachement" = 'Diplome', "dateFinRattachement" = now()
      WHERE "idPromotion" = $1`, [aClore.idPromotion]);
  await client.query(
    `UPDATE "Promotion" SET "statut" = 'Diplomee' WHERE "idPromotion" = $1`,
    [aClore.idPromotion]);
  await client.query('COMMIT');
  console.log(`3ter. Promotion « ${aClore.libelle} — ${aClore.annee} » diplômée ` +
              `(${aClore.n} anciens étudiants)`);
}

/* =====================================================================
   4. CANDIDATURES

   MODÈLE DE COMPORTEMENT — écrit à la main, jamais dérivé du score.

   Un étudiant postule surtout dans son domaine, parfois à côté. Tous ne
   postulent pas : certains n'ont rien envoyé, quelques-uns ont beaucoup
   postulé. C'est cette dispersion qui rend un jeu de démonstration
   crédible ; une distribution uniforme ne l'est jamais.
   ===================================================================== */
const offres = (await client.query('SELECT "idOffre", "domaine", "titre" FROM offre')).rows;
const etudiants = (await client.query(
  'SELECT "idEtudiant", "filiere", "prenomEtudiant", "nomEtudiant" FROM etudiant')).rows;
const cvParEtudiant = new Map(
  (await client.query('SELECT "idCV", "idEtudiant" FROM "CV"')).rows
    .map(r => [r.idEtudiant, r.idCV])
);

const competencesOffre = new Map();
for (const r of (await client.query(
  'SELECT "idOffre", "idCompetenceReference", "estObligatoire" FROM "CompetenceOffre"')).rows) {
  if (!competencesOffre.has(r.idOffre)) competencesOffre.set(r.idOffre, []);
  competencesOffre.get(r.idOffre).push(r);
}
const competencesEtudiant = new Map();
for (const r of (await client.query(
  'SELECT "idEtudiant", "idCompetenceReference" FROM "CompetenceEtudiant"')).rows) {
  if (!competencesEtudiant.has(r.idEtudiant)) competencesEtudiant.set(r.idEtudiant, new Set());
  competencesEtudiant.get(r.idEtudiant).add(r.idCompetenceReference);
}

/* Questions et bonnes réponses de chaque QCM, pour engendrer des
   réponses cohérentes avec la note affichée. */
const qcmParOffre = new Map();
for (const r of (await client.query(`
  SELECT q."idOffre", qu."idQuestion", qu."points", qu."ordre",
         c."idChoix", c."estCorrect", c."enonce"
    FROM "QCM" q
    JOIN "Question" qu ON qu."idQCM" = q."idQCM"
    JOIN "ChoixReponse" c ON c."idQuestion" = qu."idQuestion"
   ORDER BY q."idOffre", qu."ordre", c."ordre"`)).rows) {
  if (!qcmParOffre.has(r.idOffre)) qcmParOffre.set(r.idOffre, new Map());
  const questions = qcmParOffre.get(r.idOffre);
  if (!questions.has(r.idQuestion)) {
    questions.set(r.idQuestion, { points: r.points, ordre: r.ordre, choix: [] });
  }
  questions.get(r.idQuestion).choix.push(
    { idChoix: r.idChoix, estCorrect: r.estCorrect, enonce: r.enonce });
}

const LETTRES = [
  "Actuellement étudiant, je souhaite mettre en pratique les connaissances acquises durant ma formation. Votre offre correspond au domaine dans lequel je souhaite me spécialiser.",
  "Je vous adresse ma candidature pour ce stage. Mon parcours m'a permis d'acquérir des bases solides que je souhaite désormais confronter au terrain.",
  "Votre annonce a retenu mon attention car elle rejoint directement le projet professionnel que je construis depuis le début de mon cursus.",
  "Motivé et curieux, je recherche un stage formateur au sein d'une structure qui accepte d'accompagner un étudiant. Je reste disponible pour un entretien.",
  "Ce stage représenterait pour moi une première expérience professionnelle dans un domaine qui m'intéresse depuis plusieurs années."
];

/* Combien de candidatures pour cet étudiant. Volontairement inégal. */
function nombreCandidatures() {
  const d = hasard();
  if (d < 0.17) return 0;          // n'a pas encore postulé
  if (d < 0.55) return entre(1, 2);
  if (d < 0.85) return entre(3, 4);
  return entre(5, 7);              // quelques-uns postulent beaucoup
}

let creees = 0, reponsesCreees = 0;
const parStatut = { 'En attente': 0, 'Recruté': 0, 'Refusé': 0 };

await client.query('BEGIN');
for (const etudiant of etudiants) {
  const combien = nombreCandidatures();
  if (combien === 0) continue;

  const dansSonDomaine = offres.filter(o => o.domaine === etudiant.filiere);
  const ailleurs = offres.filter(o => o.domaine !== etudiant.filiere);

  /* Environ quatre candidatures sur cinq dans le domaine de l'étudiant.
     Les autres sont opportunistes — ce qui existe dans la réalité, et ce
     qui donne au jeu de données des cas où le profil colle mal. */
  const choisies = [
    ...melanger(dansSonDomaine).slice(0, Math.ceil(combien * 0.8)),
    ...melanger(ailleurs).slice(0, Math.floor(combien * 0.2) + (hasard() < 0.25 ? 1 : 0))
  ].slice(0, combien);

  for (const offre of choisies) {
    /* Couverture réelle des compétences exigées : sert de base
       plausible à la note de QCM et à la décision. */
    const exigees = (competencesOffre.get(offre.idOffre) || []);
    const possedees = competencesEtudiant.get(etudiant.idEtudiant) || new Set();
    const couverture = exigees.length === 0 ? 0.5
      : exigees.filter(c => possedees.has(c.idCompetenceReference)).length / exigees.length;

    const questions = [...(qcmParOffre.get(offre.idOffre) || new Map()).entries()];

    /* Nombre de bonnes réponses : la couverture pèse, le hasard aussi.
       Un profil pertinent peut rater son QCM, et l'inverse arrive. */
    let bonnes = 0;
    for (const [, q] of questions) {
      if (hasard() < 0.35 + couverture * 0.5) bonnes++;
      void q;
    }
    const pointsTotal = questions.reduce((s, [, q]) => s + (q.points || 1), 0);
    const pointsObtenus = questions.slice(0, bonnes)
      .reduce((s, [, q]) => s + (q.points || 1), 0);
    const noteQCM = pointsTotal > 0 ? Math.round((pointsObtenus / pointsTotal) * 100) : null;

    const ilYaJours = entre(2, 90);

    /* Une candidature récente n'a pas encore été traitée. Mais une
       candidature ancienne non plus, souvent : les entreprises laissent
       dormir les dossiers. Sans cette seconde source d'attente, le
       tableau de bord entreprise n'aurait presque rien « à traiter »,
       alors que c'est son action principale.

       Au-delà, la décision est prise : la note de QCM pèse, la
       couverture des compétences aussi, aucune ne décide seule. */
    let statut;
    if (ilYaJours < 25 || hasard() < 0.30) {
      statut = 'En attente';
    } else {
      /* Un stage se décroche rarement : environ une candidature traitée
         sur quatre aboutit. */
      const chance = (noteQCM ?? 50) / 100 * 0.55 + couverture * 0.25;
      statut = hasard() < chance * 0.42 ? 'Recruté' : 'Refusé';
    }
    parStatut[statut]++;

    const { rows } = await client.query(
      `INSERT INTO "Candidature"
         ("idEtudiant", "idOffre", "lettreMotivation", "idCV",
          "dateCandidature", "statut", "noteQCM")
       VALUES ($1, $2, $3, $4, now() - ($5 || ' days')::interval, $6, $7)
       ON CONFLICT ("idEtudiant", "idOffre") DO NOTHING
       RETURNING "idCandidature"`,
      [etudiant.idEtudiant, offre.idOffre, piocher(LETTRES),
       cvParEtudiant.get(etudiant.idEtudiant) || null, ilYaJours, statut, noteQCM]
    );
    if (rows.length === 0) continue;
    creees++;

    /* Les réponses doivent refléter la note : un QCM affichant 67 % avec
       zéro bonne réponse enregistrée serait incohérent dès qu'on ouvre
       le détail. */
    let restantes = bonnes;
    for (const [idQuestion, q] of questions) {
      const bonChoix = q.choix.find(c => c.estCorrect);
      const mauvais = q.choix.filter(c => !c.estCorrect);
      const juste = restantes > 0 && bonChoix;
      if (juste) restantes--;
      const choisi = juste ? bonChoix : (mauvais.length ? piocher(mauvais) : bonChoix);
      if (!choisi) continue;

      await client.query(
        `INSERT INTO "ReponseEtudiant"
           ("idCandidature", "idQuestion", "idChoixOffre", "enonce", "estCorrecte", "ordre")
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT ("idCandidature", "idQuestion") DO NOTHING`,
        [rows[0].idCandidature, idQuestion, choisi.idChoix,
         choisi.enonce, !!choisi.estCorrect, q.ordre]
      );
      reponsesCreees++;
    }
  }
}
await client.query('COMMIT');

console.log(`4. ${creees} candidatures et ${reponsesCreees} réponses au QCM`);
console.log(`   ${JSON.stringify(parStatut)}`);

/* =====================================================================
   Bilan
   ===================================================================== */
const bilan = await client.query(`
  SELECT
    (SELECT count(*)::int FROM "Candidature")                              AS candidatures,
    (SELECT count(DISTINCT "idEtudiant")::int FROM "Candidature")          AS etudiants_actifs,
    (SELECT count(DISTINCT "idOffre")::int FROM "Candidature")             AS offres_pourvues,
    (SELECT count(*)::int FROM "CV")                                       AS cv,
    (SELECT count(*)::int FROM "ReponseEtudiant")                          AS reponses,
    (SELECT round(avg("noteQCM"))::int FROM "Candidature")                 AS note_moyenne`);
console.log('\nBilan :');
console.table(bilan.rows);

const entreprises = await client.query(`
  SELECT e."nomEntreprise", count(c.*)::int AS candidatures
    FROM entreprise e
    JOIN offre o ON o."idEntreprise" = e."idEntreprise"
    LEFT JOIN "Candidature" c ON c."idOffre" = o."idOffre"
   GROUP BY 1 HAVING count(c.*) > 0 ORDER BY 2 DESC LIMIT 6`);
console.log('Entreprises les plus sollicitées :');
console.table(entreprises.rows);

client.release();
await pool.end();
