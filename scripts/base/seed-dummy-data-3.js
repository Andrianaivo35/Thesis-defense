/*
 * Troisième vague de données de démonstration : densification du corpus.
 *
 * Motivation
 *   La matrice de co-occurrence (Lot 5.1) se calcule sur les compétences
 *   partageant un même contexte. Or 25 compétences du référentiel sur 56
 *   apparaissaient dans deux contextes ou moins, et 8 dans aucun (Vue.js,
 *   Angular, C++, Symfony, NoSQL, Cloud, Malagasy, Français rédactionnel).
 *   Une compétence sans contexte n'a aucun voisin : le signal de
 *   co-occurrence ne peut rien en dire.
 *
 *   Cette vague ajoute des offres et des étudiants ciblant précisément ces
 *   compétences sous-représentées, afin que la matrice repose sur des
 *   observations et non sur le seul signal textuel.
 *
 * Comme les vagues précédentes : entreprises et universités réelles,
 * coordonnées fictives.
 *
 * Exécution : node scripts/seed-dummy-data-3.js
 * Rejouable : chaque insertion est précédée d'un contrôle d'existence.
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});

const DEMO_PASSWORD = 'Demo1234!';
const EMAIL_DOMAIN = 'demo.stageshare.mg';

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');
function slugify(s) {
  return s.toString().toLowerCase().normalize('NFD').replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
}

/* Offres ciblant les compétences sous-représentées.
   Les combinaisons sont réalistes : on ne force pas des associations
   arbitraires, sans quoi la matrice apprendrait des relations fausses. */
const OFFRES = [
  { entreprise: 'Ingenosya Madagascar', titre: 'Stagiaire Développeur Front-End Vue.js',
    domaine: 'Informatique et Numérique', niveau: 'Licence 3', duree: '4 mois', ville: 'Antananarivo',
    description: "Développer des interfaces web avec Vue.js pour des clients européens.",
    competences: [['Vue.js','Avancé',true],['Javascript','Avancé',true],['HTML/CSS','Intermédiaire',true],['Git','Débutant',false]] },
  { entreprise: 'Ennov IT', titre: 'Stagiaire Développeur Angular',
    domaine: 'Informatique et Numérique', niveau: 'Licence 3', duree: '4 mois', ville: 'Antananarivo',
    description: "Construire des interfaces web avec Angular et TypeScript.",
    competences: [['Angular','Avancé',true],['TypeScript','Intermédiaire',true],['HTML/CSS','Intermédiaire',true],['Git','Débutant',false]] },
  { entreprise: 'Ingenosya Madagascar', titre: 'Stagiaire Développeur Back-End Symfony',
    domaine: 'Informatique et Numérique', niveau: 'Master 1', duree: '6 mois', ville: 'Antananarivo',
    description: "Développer des services applicatifs en PHP avec Symfony.",
    competences: [['Symfony','Avancé',true],['PHP','Avancé',true],['MySQL','Intermédiaire',true],['Git','Intermédiaire',false]] },
  { entreprise: 'Ennov IT', titre: 'Stagiaire Développeur Laravel',
    domaine: 'Informatique et Numérique', niveau: 'Licence 3', duree: '4 mois', ville: 'Antananarivo',
    description: "Développer des applications côté serveur en PHP avec Laravel.",
    competences: [['Laravel','Avancé',true],['PHP','Avancé',true],['MySQL','Intermédiaire',true]] },
  { entreprise: 'Orange Madagascar', titre: 'Stagiaire Ingénieur Cloud',
    domaine: 'Informatique et Numérique', niveau: 'Master 1', duree: '6 mois', ville: 'Antananarivo',
    description: "Déployer et superviser des infrastructures hébergées.",
    competences: [['Cloud (AWS/Azure)','Avancé',true],['Docker','Intermédiaire',true],['Linux','Intermédiaire',true]] },
  { entreprise: 'Telma', titre: 'Stagiaire Ingénieur DevOps',
    domaine: 'Informatique et Numérique', niveau: 'Master 1', duree: '6 mois', ville: 'Antananarivo',
    description: "Automatiser le déploiement des applications sur des environnements isolés.",
    competences: [['Docker','Avancé',true],['Linux','Avancé',true],['Cloud (AWS/Azure)','Intermédiaire',false],['Git','Avancé',true]] },
  { entreprise: 'BNI Madagascar', titre: 'Stagiaire Développeur .NET',
    domaine: 'Informatique et Numérique', niveau: 'Licence 3', duree: '4 mois', ville: 'Antananarivo',
    description: "Maintenir des applications d'entreprise sur la plateforme .NET.",
    competences: [['.NET','Avancé',true],['SQL','Intermédiaire',true],['Git','Débutant',false]] },
  { entreprise: 'NOSYCOM', titre: 'Stagiaire Développeur Base de Données NoSQL',
    domaine: 'Informatique et Numérique', niveau: 'Master 1', duree: '4 mois', ville: 'Antananarivo',
    description: "Concevoir des schémas de stockage non relationnels pour de gros volumes.",
    competences: [['NoSQL (MongoDB)','Avancé',true],['Node.js','Intermédiaire',true],['PostgreSQL','Débutant',false]] },
  { entreprise: 'Ambatovy', titre: 'Stagiaire Ingénieur Systèmes Embarqués',
    domaine: 'Génie Industriel et Énergie', niveau: 'Master 1', duree: '6 mois', ville: 'Toamasina',
    description: "Développer des logiciels embarqués pour équipements industriels.",
    competences: [['C++','Avancé',true],['Linux','Intermédiaire',true],['Génie électrique','Intermédiaire',false]] },
  { entreprise: 'Groupe SOCOTA', titre: 'Stagiaire Maintenance Industrielle',
    domaine: 'Génie Industriel et Énergie', niveau: 'Licence 3', duree: '4 mois', ville: 'Antsirabe',
    description: "Assurer la maintenance des machines de production textile.",
    competences: [['Génie mécanique','Avancé',true],['Génie textile','Intermédiaire',true],['Contrôle qualité','Débutant',false]] },
  { entreprise: 'Sahanala Madagascar', titre: 'Stagiaire Technicien Agronome',
    domaine: 'Agro-industrie et Agronomie', niveau: 'Licence 3', duree: '4 mois', ville: 'Sambava',
    description: "Suivre les itinéraires techniques des cultures et les rendements.",
    competences: [['Agronomie','Avancé',true],['Contrôle qualité','Intermédiaire',false],['Malagasy','Avancé',true]] },
  { entreprise: 'Hôtel Carlton Madagascar', titre: 'Stagiaire Chargé de Communication',
    domaine: 'Communication et Médias', niveau: 'Licence 3', duree: '3 mois', ville: 'Antananarivo',
    description: "Rédiger les supports de communication de l'établissement.",
    competences: [['Français rédactionnel','Avancé',true],['Communication','Avancé',true],['Marketing digital','Intermédiaire',false]] },
  { entreprise: 'ARO Compagnie d\'Assurances', titre: 'Stagiaire Chargé RH',
    domaine: 'Gestion et Commerce', niveau: 'Master 1', duree: '4 mois', ville: 'Antananarivo',
    description: "Participer au recrutement et à la gestion administrative du personnel.",
    competences: [['Ressources humaines','Avancé',true],['Communication','Intermédiaire',true],['Excel avancé','Intermédiaire',false]] },
  { entreprise: 'Jumbo Score (Groupe SOCOMAD)', titre: 'Stagiaire Chef de Rayon',
    domaine: 'Gestion et Commerce', niveau: 'Licence 3', duree: '4 mois', ville: 'Antananarivo',
    description: "Animer un rayon, suivre les stocks et la mise en valeur des produits.",
    competences: [['Merchandising','Avancé',true],['Gestion de stocks','Avancé',true],['Relation client','Intermédiaire',false]] },
  { entreprise: 'NY HAVANA Assurances', titre: 'Stagiaire Actuaire Junior',
    domaine: 'Banque, Finance et Assurance', niveau: 'Master 1', duree: '6 mois', ville: 'Antananarivo',
    description: "Modéliser les risques et participer à la tarification des produits.",
    competences: [['Actuariat','Avancé',true],['Statistiques','Avancé',true],['Excel avancé','Intermédiaire',false]] },
  { entreprise: 'Ambatovy', titre: 'Stagiaire Prévention des Risques',
    domaine: 'Mines et Métallurgie', niveau: 'Master 1', duree: '6 mois', ville: 'Toamasina',
    description: "Appliquer et contrôler les règles de sécurité sur le site minier.",
    competences: [['Sécurité minière','Avancé',true],['Contrôle qualité','Intermédiaire',false],['Malagasy','Intermédiaire',false]] },
];

/* Étudiants dont les profils renforcent les mêmes compétences. */
const ETUDIANTS = [
  { nom: 'Rakotobe', prenom: 'Mialy', genre: 'Féminin', filiere: 'Informatique et Numérique',
    spec: 'Développement Web', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Vue.js','Avancé'],['Javascript','Avancé'],['HTML/CSS','Avancé'],['Git','Intermédiaire']] },
  { nom: 'Andriantsoa', prenom: 'Rado', genre: 'Masculin', filiere: 'Informatique et Numérique',
    spec: 'Développement Web', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Angular','Avancé'],['TypeScript','Avancé'],['HTML/CSS','Intermédiaire'],['Git','Avancé']] },
  { nom: 'Ravoninahitra', prenom: 'Faniry', genre: 'Féminin', filiere: 'Informatique et Numérique',
    spec: 'Génie Logiciel', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Symfony','Avancé'],['PHP','Avancé'],['MySQL','Avancé'],['Git','Intermédiaire']] },
  { nom: 'Rakotoson', prenom: 'Tsiky', genre: 'Masculin', filiere: 'Informatique et Numérique',
    spec: 'Réseaux et Systèmes', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Cloud (AWS/Azure)','Avancé'],['Docker','Avancé'],['Linux','Avancé'],['Git','Intermédiaire']] },
  { nom: 'Randriamanana', prenom: 'Haja', genre: 'Masculin', filiere: 'Informatique et Numérique',
    spec: 'Génie Logiciel', niveau: 'Master 2', ville: 'Antananarivo',
    comp: [['C++','Avancé'],['Linux','Intermédiaire'],['Python','Intermédiaire']] },
  { nom: 'Rasoarimalala', prenom: 'Hanta', genre: 'Féminin', filiere: 'Communication et Médias',
    spec: 'Communication d\'Entreprise', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Français rédactionnel','Avancé'],['Communication','Avancé'],['Malagasy','Avancé']] },
  { nom: 'Andrianina', prenom: 'Koto', genre: 'Masculin', filiere: 'Gestion et Commerce',
    spec: 'Ressources Humaines', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Ressources humaines','Avancé'],['Communication','Intermédiaire'],['Excel avancé','Intermédiaire']] },
  { nom: 'Ratsimba', prenom: 'Lalaina', genre: 'Féminin', filiere: 'Génie Industriel et Énergie',
    spec: 'Génie Mécanique', niveau: 'Licence 3', ville: 'Antsirabe',
    comp: [['Génie mécanique','Avancé'],['Génie textile','Intermédiaire'],['Contrôle qualité','Intermédiaire']] },
];

const QCM = {
  titre: 'QCM de présélection',
  questions: [
    { enonce: 'Que signifie l\'acronyme API ?', choix: [
      ['Interface de programmation applicative', true], ['Analyse par indicateur', false],
      ['Automatisation des processus internes', false], ['Application publique intégrée', false]] },
    { enonce: 'Quelle pratique améliore la qualité d\'un livrable ?', choix: [
      ['La relecture et le contrôle avant livraison', true], ['Livrer sans vérification', false],
      ['Ignorer les retours du client', false], ['Supprimer la documentation', false]] },
    { enonce: 'Qu\'est-ce qu\'un cahier des charges ?', choix: [
      ['Un document décrivant les besoins et contraintes', true], ['Une facture client', false],
      ['Un contrat de travail', false], ['Un bilan comptable', false]] },
  ]
};

async function main() {
  const client = await pool.connect();
  const bilan = { offres: 0, etudiants: 0, ignorees: 0 };

  try {
    await client.query('BEGIN');

    // Référentiel de compétences : par nom, aucune création à la volée
    const refs = await client.query(
      'SELECT "idCompetenceReference" AS id, "nomCompetenceReference" AS nom FROM "CompetenceReference"'
    );
    const parNom = new Map(refs.rows.map(r => [r.nom, r.id]));

    const entreprises = await client.query(
      'SELECT "idEntreprise" AS id, "nomEntreprise" AS nom FROM entreprise'
    );
    const entrepriseParNom = new Map(entreprises.rows.map(r => [r.nom, r.id]));

    const universites = await client.query(
      'SELECT "idUniversite" AS id, "nomUniversite" AS nom FROM universite ORDER BY "idUniversite"'
    );

    /* ---------- Offres ---------- */
    for (const o of OFFRES) {
      const idEntreprise = entrepriseParNom.get(o.entreprise);
      if (!idEntreprise) { bilan.ignorees++; continue; }

      const existe = await client.query(
        'SELECT 1 FROM offre WHERE "idEntreprise" = $1 AND titre = $2',
        [idEntreprise, o.titre]
      );
      if (existe.rows.length > 0) continue;

      const offre = await client.query(`
        INSERT INTO offre (
          "idEntreprise", titre, description, domaine, "niveauRequis", duree,
          "dateDebut", "dateFin", remuneration, lieu, ville, "accepteTeletravail",
          "typeStage", statut, "datePublication", "dateLimites"
        ) VALUES ($1,$2,$3,$4,$5,$6, CURRENT_DATE + INTERVAL '1 month',
          CURRENT_DATE + INTERVAL '7 months', $7,$8,$9,$10,$11,'Active',
          CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '2 months')
        RETURNING "idOffre"`,
        [idEntreprise, o.titre, o.description, o.domaine, o.niveau, o.duree,
         '250 000 Ar / mois', o.ville, o.ville, 'Non', 'Stage professionnel']
      );
      const idOffre = offre.rows[0].idOffre;
      bilan.offres++;

      for (const [nom, niveau, obligatoire] of o.competences) {
        const idComp = parNom.get(nom);
        if (!idComp) continue;
        await client.query(
          `INSERT INTO "CompetenceOffre" ("idOffre","idCompetenceReference","niveauSouhaitee","estObligatoire")
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [idOffre, idComp, niveau, obligatoire]
        );
      }

      const qcm = await client.query(`
        INSERT INTO "QCM" ("idOffre", titre, description, duree, "noteMinimal", "dateCreation", "estActif")
        VALUES ($1,$2,$3,20,50,CURRENT_TIMESTAMP,true) RETURNING "idQCM"`,
        [idOffre, QCM.titre, `QCM de présélection pour : ${o.titre}`]
      );
      for (let i = 0; i < QCM.questions.length; i++) {
        const q = QCM.questions[i];
        const question = await client.query(
          `INSERT INTO "Question" ("idQCM", enonce, ordre, points) VALUES ($1,$2,$3,1) RETURNING "idQuestion"`,
          [qcm.rows[0].idQCM, q.enonce, i]
        );
        for (let k = 0; k < q.choix.length; k++) {
          await client.query(
            `INSERT INTO "ChoixReponse" ("idQuestion", enonce, ordre, "estCorrect") VALUES ($1,$2,$3,$4)`,
            [question.rows[0].idQuestion, q.choix[k][0], k, q.choix[k][1]]
          );
        }
      }
    }

    /* ---------- Étudiants ---------- */
    let index = 200;
    for (const e of ETUDIANTS) {
      index++;
      const email = `${slugify(e.prenom)}.${slugify(e.nom)}@${EMAIL_DOMAIN}`;

      const existe = await client.query(
        'SELECT 1 FROM utilisateur WHERE "emailUtilisateur" = $1', [email]
      );
      if (existe.rows.length > 0) continue;

      const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
      const utilisateur = await client.query(
        `INSERT INTO utilisateur ("typeUtilisateur","emailUtilisateur","motDePasse")
         VALUES ('Etudiant',$1,$2) RETURNING "idUtilisateur"`, [email, hash]
      );
      const universite = universites.rows[index % universites.rows.length];

      const etudiant = await client.query(`
        INSERT INTO etudiant (
          "idUtilisateur","nomEtudiant","prenomEtudiant","telephoneEtudiant",genre,
          adresse,"idUniversite","nomUniversiteSaisi",matricule,filiere,specialisation,
          "niveauAcademique","dateInscription","estActif","statutRattachement","dateRattachement"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_DATE,true,'Valide',now())
        RETURNING "idEtudiant"`,
        [utilisateur.rows[0].idUtilisateur, e.nom, e.prenom, `+261 32 ${String(3000000 + index).slice(0, 7)}`,
         e.genre, `${e.ville}, Madagascar`, universite.id, universite.nom,
         `MAT-26-${String(index).padStart(4, '0')}`, e.filiere, e.spec, e.niveau]
      );
      const idEtudiant = etudiant.rows[0].idEtudiant;
      bilan.etudiants++;

      await client.query(`
        INSERT INTO "preference-stage" ("idEtudiant","villePreferee","accepteTeletravail",
          "mobiliteNational","typeStagePreferee","dureeSouhaitee","disponibiliteImmediate")
        VALUES ($1,$2,'Hybride',true,'Stage professionnel','4 mois',true)`,
        [idEtudiant, e.ville]
      );

      for (const [nom, niveau] of e.comp) {
        const idComp = parNom.get(nom);
        if (!idComp) continue;
        await client.query(
          `INSERT INTO "CompetenceEtudiant" ("idEtudiant","idCompetenceReference",niveau)
           VALUES ($1,$2,$3) ON CONFLICT ("idEtudiant","idCompetenceReference") DO NOTHING`,
          [idEtudiant, idComp, niveau]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Densification terminée.');
    console.log(bilan);
    console.log(`\nMot de passe des comptes créés : ${DEMO_PASSWORD}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur, rollback effectué :', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
