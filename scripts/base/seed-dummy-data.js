/*
 * Seeds Stage Share with realistic French-language dummy data: real Madagascar-based
 * universities and enterprises (names/sectors are real; contact emails, phone numbers,
 * tax/STAT numbers are fabricated placeholders for demo purposes only), plus fictional
 * students, offers, skills, and QCMs.
 *
 * Run with:  node scripts/seed-dummy-data.js
 * (uses the same DB_HOST/DB_USER/... env vars as src/lib/db.js — works against the
 *  docker-compose Postgres exposed on localhost:5432)
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
const EMAIL_DOMAIN = 'demo.stageshare.mg'; // clearly-fictional domain, not a real org's mailbox

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g');

function slugify(s) {
  return s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

/* ===================================================================== */
/* DATA                                                                   */
/* ===================================================================== */

const COMPETENCES = [
  ['HTML/CSS', 'Technique'], ['TypeScript', 'Technique'], ['Node.js', 'Technique'],
  ['PHP', 'Technique'], ['Python', 'Technique'], ['Java', 'Technique'], ['C++', 'Technique'],
  ['Vue.js', 'Technique'], ['Angular', 'Technique'], ['Laravel', 'Technique'],
  ['Symfony', 'Technique'], ['.NET', 'Technique'], ['Git', 'Technique'], ['Docker', 'Technique'],
  ['Linux', 'Technique'], ['MySQL', 'Donnees'], ['PostgreSQL', 'Donnees'],
  ['NoSQL (MongoDB)', 'Donnees'], ['Analyse de données', 'Donnees'], ['Power BI', 'Donnees'],
  ['Excel avancé', 'Donnees'], ['Machine Learning', 'Donnees'], ['Statistiques', 'Donnees'],
  ['Administration réseau', 'Reseaux'], ['Cybersécurité', 'Reseaux'],
  ['Cloud (AWS/Azure)', 'Reseaux'], ['Télécommunications', 'Reseaux'],
  ['Gestion de projet', 'Gestion'], ['Comptabilité', 'Gestion'], ['Marketing digital', 'Gestion'],
  ['Communication', 'Gestion'], ['Ressources humaines', 'Gestion'],
  ['Audit financier', 'Gestion'], ['Actuariat', 'Gestion'], ['Relation client', 'Gestion'],
  ['Anglais professionnel', 'Langue'], ['Malagasy', 'Langue'], ['Français rédactionnel', 'Langue'],
  ['Génie électrique', 'Industrie'], ['Génie civil', 'Industrie'],
  ['Génie des procédés', 'Industrie'], ['Sécurité minière', 'Industrie'],
  ['Génie mécanique', 'Industrie'], ['Contrôle qualité', 'Industrie'],
];

const UNIVERSITES = [
  { nom: 'Université d\'Antananarivo', sigle: 'UA', ville: 'Antananarivo',
    adresse: 'Ankatso, BP 566, Antananarivo 101', site: 'https://www.univ-antananarivo.mg' },
  { nom: 'École Supérieure Polytechnique d\'Antananarivo', sigle: 'ESPA', ville: 'Antananarivo',
    adresse: 'Ambohitsaina, BP 1500, Antananarivo 101', site: 'https://espa.mg' },
  { nom: 'École Nationale d\'Informatique', sigle: 'ENI', ville: 'Fianarantsoa',
    adresse: 'Route Universitaire, Fianarantsoa 301', site: 'https://eni.mg' },
  { nom: 'Institut National Supérieur d\'Informatique', sigle: 'INSI', ville: 'Antananarivo',
    adresse: 'Ampasampito, Antananarivo 101', site: 'https://www.insi.mg' },
  { nom: 'Université de Toamasina', sigle: 'UT', ville: 'Toamasina',
    adresse: 'Barikadimy, BP 604, Toamasina 501', site: 'https://univ-toamasina.mg' },
];

const ENTREPRISES = [
  { nom: 'Telma', secteur: 'Télécommunications', forme: 'SA',
    adresse: 'Ankorondrano, Antananarivo 101', ville: 'Antananarivo', site: 'https://telma.mg',
    desc: 'Opérateur historique de télécommunications à Madagascar (mobile, internet, TV).' },
  { nom: 'Airtel Madagascar', secteur: 'Télécommunications', forme: 'SA',
    adresse: 'Ankorondrano, Antananarivo 101', ville: 'Antananarivo', site: 'https://airtel.mg',
    desc: 'Filiale malgache du groupe Airtel Africa, opérateur mobile.' },
  { nom: 'Orange Madagascar', secteur: 'Télécommunications', forme: 'SA',
    adresse: 'Ankorondrano, Antananarivo 101', ville: 'Antananarivo', site: 'https://orange.mg',
    desc: 'Filiale malgache du groupe Orange, opérateur télécom et services digitaux.' },
  { nom: 'Groupe STAR (Brasseries STAR Madagascar)', secteur: 'Agroalimentaire / Brasserie',
    forme: 'SA', adresse: 'Andraharo, Antananarivo 101', ville: 'Antananarivo',
    site: 'https://groupestar.mg',
    desc: 'Conglomérat malgache historique dans la brasserie, les boissons et la distribution.' },
  { nom: 'BNI Madagascar', secteur: 'Banque', forme: 'SA',
    adresse: 'Ankorondrano, Antananarivo 101', ville: 'Antananarivo', site: 'https://bni.mg',
    desc: 'Banque commerciale malgache proposant des services bancaires aux particuliers et entreprises.' },
  { nom: 'Ingenosya Madagascar', secteur: 'Développement logiciel / ESN', forme: 'SARL',
    adresse: 'Ambatobe, Antananarivo 103', ville: 'Antananarivo', site: 'https://ingenosya.com',
    desc: 'Entreprise de services du numérique (ESN) franco-malgache, plus de 150 ingénieurs logiciels.' },
  { nom: 'Ennov IT', secteur: 'Développement logiciel offshore', forme: 'SARL',
    adresse: 'Antsahavola, Antananarivo 101', ville: 'Antananarivo', site: 'https://www.ennov.io',
    desc: 'Société offshore de développement web et mobile (Java, PHP, .NET, JavaScript).' },
  { nom: 'NOSYCOM', secteur: 'Centre d\'appels / BPO', forme: 'SARL',
    adresse: 'Andraharo, Antananarivo 101', ville: 'Antananarivo', site: 'https://nosycom.mg',
    desc: 'Centre de contacts spécialisé dans la gestion des appels entrants/sortants depuis 1997.' },
  { nom: 'Ambatovy', secteur: 'Mines / Métallurgie (Nickel-Cobalt)', forme: 'SA',
    adresse: 'Route Toamasina-Moramanga, Moramanga 514', ville: 'Toamasina', site: 'https://ambatovy.com',
    desc: 'Projet minier intégré nickel-cobalt, un des plus grands employeurs industriels du pays.' },
  { nom: 'ARO Compagnie d\'Assurances', secteur: 'Assurance', forme: 'SA',
    adresse: 'Antaninarenina, Antananarivo 101', ville: 'Antananarivo', site: 'https://aro.mg',
    desc: 'Compagnie d\'assurances malgache historique (dommages, vie, santé).' },
];

// index into UNIVERSITES (0-based) — students are distributed across all 5 new universities
const ETUDIANTS = [
  { nom: 'Rakotomalala', prenom: 'Njaka', genre: 'Masculin', uni: 1, filiere: 'Informatique',
    spec: 'Génie Logiciel', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Javascript', 'Intermédiaire'], ['React', 'Débutant'], ['SQL', 'Intermédiaire'], ['Git', 'Débutant']],
    interet: 'Développement web', mission: 'Construire des applications web modernes' },
  { nom: 'Andriamampianina', prenom: 'Fenosoa', genre: 'Féminin', uni: 3, filiere: 'Informatique',
    spec: 'Data Science', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Python', 'Avancé'], ['Analyse de données', 'Avancé'], ['Machine Learning', 'Intermédiaire'], ['SQL', 'Avancé'], ['Power BI', 'Intermédiaire']],
    interet: 'Intelligence artificielle', mission: 'Analyser des données pour la prise de décision' },
  { nom: 'Razafindrakoto', prenom: 'Tojo', genre: 'Masculin', uni: 1, filiere: 'Télécommunications',
    spec: 'Réseaux Mobiles', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Télécommunications', 'Avancé'], ['Administration réseau', 'Intermédiaire'], ['Anglais professionnel', 'Intermédiaire'], ['Cybersécurité', 'Débutant']],
    interet: 'Réseaux mobiles', mission: 'Déployer et superviser des infrastructures réseau' },
  { nom: 'Ravaomanana', prenom: 'Miora', genre: 'Féminin', uni: 0, filiere: 'Gestion',
    spec: 'Finance', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Comptabilité', 'Intermédiaire'], ['Excel avancé', 'Avancé'], ['Audit financier', 'Débutant'], ['Communication', 'Intermédiaire']],
    interet: 'Finance d\'entreprise', mission: 'Participer à des missions d\'audit et de contrôle' },
  { nom: 'Randriamampionona', prenom: 'Hery', genre: 'Masculin', uni: 2, filiere: 'Informatique',
    spec: 'Réseaux et Systèmes', niveau: 'Licence 3', ville: 'Fianarantsoa',
    comp: [['Administration réseau', 'Avancé'], ['Linux', 'Intermédiaire'], ['Cybersécurité', 'Intermédiaire'], ['Git', 'Débutant']],
    interet: 'Administration systèmes', mission: 'Sécuriser des infrastructures IT' },
  { nom: 'Rasoanaivo', prenom: 'Vonjy', genre: 'Féminin', uni: 0, filiere: 'Gestion',
    spec: 'Comptabilité', niveau: 'Master 1', ville: 'Antsirabe',
    comp: [['Comptabilité', 'Avancé'], ['Audit financier', 'Intermédiaire'], ['Excel avancé', 'Avancé'], ['Communication', 'Débutant']],
    interet: 'Comptabilité générale', mission: 'Tenir une comptabilité fiable et conforme' },
  { nom: 'Andrianjafy', prenom: 'Fanomezana', genre: 'Masculin', uni: 4, filiere: 'Génie Industriel',
    spec: 'Mines et Métallurgie', niveau: 'Master 1', ville: 'Toamasina',
    comp: [['Sécurité minière', 'Avancé'], ['Génie des procédés', 'Intermédiaire'], ['Contrôle qualité', 'Débutant'], ['Anglais professionnel', 'Intermédiaire']],
    interet: 'Industrie minière', mission: 'Superviser la sécurité sur site industriel' },
  { nom: 'Ratovoson', prenom: 'Ny Aina', genre: 'Féminin', uni: 3, filiere: 'Informatique',
    spec: 'Développement Web', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Javascript', 'Avancé'], ['React', 'Avancé'], ['HTML/CSS', 'Avancé'], ['Node.js', 'Débutant'], ['Git', 'Intermédiaire']],
    interet: 'Développement front-end', mission: 'Créer des interfaces utilisateur soignées' },
  { nom: 'Zafindraibe', prenom: 'Mamy', genre: 'Masculin', uni: 0, filiere: 'Gestion',
    spec: 'Marketing', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Marketing digital', 'Avancé'], ['Communication', 'Avancé'], ['Excel avancé', 'Débutant']],
    interet: 'Marketing digital', mission: 'Piloter des campagnes sur les réseaux sociaux' },
  { nom: 'Rasolofoson', prenom: 'Tahiry', genre: 'Masculin', uni: 0, filiere: 'Gestion',
    spec: 'Actuariat', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Actuariat', 'Avancé'], ['Statistiques', 'Avancé'], ['Excel avancé', 'Intermédiaire']],
    interet: 'Assurance et gestion des risques', mission: 'Modéliser des risques financiers' },
  { nom: 'Rakotoarisoa', prenom: 'Fitia', genre: 'Féminin', uni: 1, filiere: 'Informatique',
    spec: 'Génie Logiciel', niveau: 'Master 2', ville: 'Antananarivo',
    comp: [['Node.js', 'Avancé'], ['React', 'Avancé'], ['PostgreSQL', 'Intermédiaire'], ['Docker', 'Débutant'], ['Git', 'Avancé']],
    interet: 'Architecture logicielle', mission: 'Concevoir des applications robustes et scalables' },
  { nom: 'Randrianasolo', prenom: 'Toky', genre: 'Masculin', uni: 1, filiere: 'Génie Industriel',
    spec: 'Génie des Procédés', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Génie des procédés', 'Intermédiaire'], ['Génie mécanique', 'Intermédiaire'], ['Contrôle qualité', 'Débutant']],
    interet: 'Procédés industriels', mission: 'Optimiser des lignes de production' },
  { nom: 'Rabemananjara', prenom: 'Sitraka', genre: 'Féminin', uni: 3, filiere: 'Informatique',
    spec: 'Data Science', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Python', 'Avancé'], ['Machine Learning', 'Avancé'], ['Statistiques', 'Intermédiaire'], ['SQL', 'Intermédiaire']],
    interet: 'Science des données', mission: 'Construire des modèles prédictifs' },
  { nom: 'Rakotondrabe', prenom: 'Andry', genre: 'Masculin', uni: 2, filiere: 'Télécommunications',
    spec: 'Réseaux et Télécoms', niveau: 'Licence 3', ville: 'Fianarantsoa',
    comp: [['Télécommunications', 'Intermédiaire'], ['Administration réseau', 'Intermédiaire'], ['Linux', 'Débutant']],
    interet: 'Infrastructures télécoms', mission: 'Maintenir des réseaux mobiles' },
  { nom: 'Andriamahefa', prenom: 'Voahangy', genre: 'Féminin', uni: 0, filiere: 'Gestion',
    spec: 'Ressources Humaines', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Ressources humaines', 'Avancé'], ['Communication', 'Avancé'], ['Gestion de projet', 'Intermédiaire']],
    interet: 'Gestion des talents', mission: 'Accompagner le recrutement et la formation' },
  { nom: 'Razanadrakoto', prenom: 'Lova', genre: 'Féminin', uni: 0, filiere: 'Gestion',
    spec: 'Comptabilité et Finance', niveau: 'Licence 3', ville: 'Antsirabe',
    comp: [['Comptabilité', 'Intermédiaire'], ['Excel avancé', 'Intermédiaire'], ['Audit financier', 'Débutant']],
    interet: 'Gestion financière', mission: 'Assister la clôture comptable mensuelle' },
  { nom: 'Ranaivoson', prenom: 'Jaona', genre: 'Masculin', uni: 3, filiere: 'Informatique',
    spec: 'Développement Mobile', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Java', 'Avancé'], ['TypeScript', 'Intermédiaire'], ['Git', 'Intermédiaire'], ['SQL', 'Débutant']],
    interet: 'Applications mobiles', mission: 'Développer des apps mobiles multiplateformes' },
  { nom: 'Andriatsimialona', prenom: 'Nomena', genre: 'Féminin', uni: 0, filiere: 'Gestion',
    spec: 'Marketing Digital', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Marketing digital', 'Intermédiaire'], ['Communication', 'Avancé'], ['Anglais professionnel', 'Intermédiaire']],
    interet: 'Communication digitale', mission: 'Gérer une présence de marque sur les réseaux sociaux' },
];

const PREF_VILLES = ['Antananarivo', 'Toamasina', 'Fianarantsoa', 'Antsirabe', 'Mahajanga'];
const PREF_TELETRAVAIL = ['Oui', 'Non', 'Hybride'];
const PREF_TYPE_STAGE = ['Stage académique', 'Stage professionnel'];
const PREF_DUREE = ['3 mois', '4 mois', '6 mois'];
const PREF_TYPE_ENTREPRISE = ['PME', 'Grande entreprise', 'Startup'];

const QCM_TEMPLATES = {
  info: {
    titre: 'QCM Technique - Informatique',
    questions: [
      { enonce: 'Que signifie l\'acronyme SQL ?', choix: [
        ['Structured Query Language', true], ['System Query Logic', false],
        ['Software Quality Level', false], ['Simple Query List', false] ] },
      { enonce: 'Quel outil est utilisé pour le versionning de code ?', choix: [
        ['Docker', false], ['Git', true], ['Figma', false], ['Postman', false] ] },
      { enonce: 'Que fait une requête HTTP de type GET ?', choix: [
        ['Elle supprime une ressource', false], ['Elle récupère une ressource', true],
        ['Elle crée une ressource', false], ['Elle authentifie un utilisateur', false] ] },
    ],
  },
  finance: {
    titre: 'QCM Technique - Finance & Gestion',
    questions: [
      { enonce: 'Que représente le bilan comptable ?', choix: [
        ['La rentabilité annuelle', false], ['Le patrimoine de l\'entreprise à un instant donné', true],
        ['Le chiffre d\'affaires mensuel', false], ['La liste des employés', false] ] },
      { enonce: 'Qu\'est-ce qu\'un audit financier ?', choix: [
        ['Un examen indépendant des comptes', true], ['Une campagne publicitaire', false],
        ['Un plan marketing', false], ['Un contrat de travail', false] ] },
      { enonce: 'Que mesure le ratio de solvabilité ?', choix: [
        ['La capacité à honorer ses dettes', true], ['Le nombre de clients', false],
        ['La satisfaction des employés', false], ['Le taux de change', false] ] },
    ],
  },
  ingenierie: {
    titre: 'QCM Technique - Ingénierie & Industrie',
    questions: [
      { enonce: 'Quel équipement est essentiel sur un site industriel à risque ?', choix: [
        ['Equipement de protection individuelle (EPI)', true], ['Un tableau blanc', false],
        ['Un vidéoprojecteur', false], ['Un logiciel de facturation', false] ] },
      { enonce: 'Que signifie "contrôle qualité" en production ?', choix: [
        ['Vérifier la conformité des produits aux normes', true],
        ['Compter les employés présents', false],
        ['Planifier les congés', false], ['Gérer la paie', false] ] },
      { enonce: 'Qu\'est-ce qu\'un procédé métallurgique ?', choix: [
        ['Un processus de transformation des métaux', true],
        ['Un logiciel de comptabilité', false],
        ['Une stratégie marketing', false], ['Un type de contrat', false] ] },
    ],
  },
  business: {
    titre: 'QCM Technique - Marketing & Relation Client',
    questions: [
      { enonce: 'Qu\'est-ce que le marketing digital ?', choix: [
        ['La promotion via des canaux numériques', true], ['La gestion des stocks', false],
        ['La comptabilité analytique', false], ['La maintenance informatique', false] ] },
      { enonce: 'Quel est un indicateur clé en relation client ?', choix: [
        ['Le taux de satisfaction client', true], ['Le taux d\'humidité', false],
        ['Le taux de change', false], ['Le taux d\'imposition', false] ] },
      { enonce: 'Que désigne le terme "prospect" ?', choix: [
        ['Un client potentiel', true], ['Un fournisseur historique', false],
        ['Un actionnaire', false], ['Un concurrent direct', false] ] },
    ],
  },
};

const OFFRES = [
  { entreprise: 0, titre: 'Assistant(e) Ingénieur Réseaux Mobiles', domaine: 'Télécommunications',
    niveauRequis: 'Master 1', duree: '6 mois', remuneration: '350 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Participer au déploiement et à la supervision des infrastructures réseau mobile (2G/3G/4G) de Telma.',
    competences: [['Télécommunications', 'Avancé', true], ['Administration réseau', 'Intermédiaire', true], ['Anglais professionnel', 'Intermédiaire', false]] },
  { entreprise: 0, titre: 'Stagiaire Développeur Applications Mobiles', domaine: 'Informatique',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '250 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Hybride', typeStage: 'Stage académique', cat: 'info',
    description: 'Développer et maintenir des fonctionnalités de l\'application mobile Telma (Java/Kotlin).',
    competences: [['Java', 'Intermédiaire', true], ['Git', 'Débutant', false], ['SQL', 'Débutant', false]] },

  { entreprise: 1, titre: 'Stagiaire Support Technique Télécom', domaine: 'Télécommunications',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '220 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Assister l\'équipe technique dans le diagnostic et la résolution d\'incidents réseau.',
    competences: [['Administration réseau', 'Intermédiaire', true], ['Télécommunications', 'Débutant', true], ['Communication', 'Intermédiaire', false]] },
  { entreprise: 1, titre: 'Stagiaire Marketing Digital', domaine: 'Marketing',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '200 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Hybride', typeStage: 'Stage académique', cat: 'business',
    description: 'Contribuer aux campagnes digitales et à l\'animation des réseaux sociaux d\'Airtel Madagascar.',
    competences: [['Marketing digital', 'Avancé', true], ['Communication', 'Intermédiaire', true], ['Excel avancé', 'Débutant', false]] },

  { entreprise: 2, titre: 'Stagiaire Data Analyst Réseaux', domaine: 'Data',
    niveauRequis: 'Master 1', duree: '4 mois', remuneration: '300 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Hybride', typeStage: 'Stage professionnel', cat: 'info',
    description: 'Analyser les données de trafic réseau pour optimiser la qualité de service Orange Madagascar.',
    competences: [['Analyse de données', 'Avancé', true], ['Power BI', 'Intermédiaire', true], ['SQL', 'Intermédiaire', true], ['Statistiques', 'Débutant', false]] },
  { entreprise: 2, titre: 'Stagiaire Développeur Web - Espace Client', domaine: 'Informatique',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '250 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Oui', typeStage: 'Stage académique', cat: 'info',
    description: 'Développer des évolutions de l\'espace client web self-care d\'Orange Madagascar.',
    competences: [['Javascript', 'Avancé', true], ['React', 'Intermédiaire', true], ['HTML/CSS', 'Intermédiaire', true], ['Git', 'Débutant', false]] },

  { entreprise: 3, titre: 'Stagiaire Contrôle Qualité Production', domaine: 'Industrie Agroalimentaire',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '220 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Assister le service qualité sur les lignes de production des Brasseries STAR Madagascar.',
    competences: [['Contrôle qualité', 'Avancé', true], ['Statistiques', 'Intermédiaire', false], ['Communication', 'Débutant', false]] },
  { entreprise: 3, titre: 'Stagiaire Assistant Comptable', domaine: 'Comptabilité',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '230 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage académique', cat: 'finance',
    description: 'Assister le service comptable dans la saisie et le suivi des opérations courantes.',
    competences: [['Comptabilité', 'Avancé', true], ['Excel avancé', 'Intermédiaire', true], ['Audit financier', 'Débutant', false]] },

  { entreprise: 4, titre: 'Stagiaire Analyste Crédit', domaine: 'Banque',
    niveauRequis: 'Master 1', duree: '6 mois', remuneration: '320 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage professionnel', cat: 'finance',
    description: 'Participer à l\'analyse des dossiers de crédit particuliers et entreprises pour BNI Madagascar.',
    competences: [['Comptabilité', 'Avancé', true], ['Analyse de données', 'Intermédiaire', true], ['Excel avancé', 'Avancé', true]] },
  { entreprise: 4, titre: 'Stagiaire Développeur Informatique Bancaire', domaine: 'Informatique',
    niveauRequis: 'Licence 3', duree: '4 mois', remuneration: '270 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage professionnel', cat: 'info',
    description: 'Contribuer à la maintenance des applications internes du système d\'information bancaire.',
    competences: [['Java', 'Avancé', true], ['SQL', 'Avancé', true], ['.NET', 'Intermédiaire', false], ['Cybersécurité', 'Débutant', false]] },

  { entreprise: 5, titre: 'Stagiaire Développeur Full Stack (React/Node.js)', domaine: 'Informatique',
    niveauRequis: 'Licence 3', duree: '4 mois', remuneration: '280 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Hybride', typeStage: 'Stage professionnel', cat: 'info',
    description: 'Rejoindre une équipe produit Ingenosya pour développer des applications web full stack.',
    competences: [['Javascript', 'Avancé', true], ['React', 'Avancé', true], ['Node.js', 'Intermédiaire', true], ['PostgreSQL', 'Intermédiaire', false]] },
  { entreprise: 5, titre: 'Stagiaire Ingénieur QA / Testeur Logiciel', domaine: 'Informatique',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '250 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Hybride', typeStage: 'Stage académique', cat: 'info',
    description: 'Concevoir et exécuter des plans de tests fonctionnels pour des applications web.',
    competences: [['Git', 'Intermédiaire', true], ['SQL', 'Débutant', true], ['Communication', 'Intermédiaire', false], ['Anglais professionnel', 'Intermédiaire', false]] },

  { entreprise: 6, titre: 'Stagiaire Développeur PHP/Laravel', domaine: 'Informatique',
    niveauRequis: 'Licence 3', duree: '4 mois', remuneration: '260 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Oui', typeStage: 'Stage professionnel', cat: 'info',
    description: 'Développer des modules back-end en PHP/Laravel pour des clients internationaux d\'Ennov IT.',
    competences: [['PHP', 'Avancé', true], ['Laravel', 'Avancé', true], ['MySQL', 'Intermédiaire', true]] },
  { entreprise: 6, titre: 'Stagiaire Développeur Mobile (Flutter/React Native)', domaine: 'Informatique',
    niveauRequis: 'Licence 3', duree: '4 mois', remuneration: '260 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Oui', typeStage: 'Stage professionnel', cat: 'info',
    description: 'Développer des applications mobiles multiplateformes pour des clients offshore.',
    competences: [['Java', 'Intermédiaire', true], ['TypeScript', 'Débutant', false], ['Git', 'Débutant', false]] },

  { entreprise: 7, titre: 'Stagiaire Superviseur Centre d\'Appels', domaine: 'Relation Client',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '210 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage académique', cat: 'business',
    description: 'Assister le management d\'un plateau d\'appels entrants/sortants chez NOSYCOM.',
    competences: [['Relation client', 'Avancé', true], ['Communication', 'Avancé', true], ['Anglais professionnel', 'Intermédiaire', false]] },
  { entreprise: 7, titre: 'Stagiaire Analyste Data Client', domaine: 'Data',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '220 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Hybride', typeStage: 'Stage académique', cat: 'info',
    description: 'Analyser les données d\'appels et de satisfaction client pour produire des tableaux de bord.',
    competences: [['Analyse de données', 'Intermédiaire', true], ['Excel avancé', 'Avancé', true], ['Power BI', 'Débutant', false]] },

  { entreprise: 8, titre: 'Stagiaire Ingénieur Sécurité Minière', domaine: 'Mines',
    niveauRequis: 'Master 1', duree: '6 mois', remuneration: '400 000 Ar / mois', ville: 'Toamasina',
    teletravail: 'Non', typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Participer aux audits sécurité sur le site industriel intégré nickel-cobalt d\'Ambatovy.',
    competences: [['Sécurité minière', 'Avancé', true], ['Génie des procédés', 'Intermédiaire', false], ['Communication', 'Débutant', false]] },
  { entreprise: 8, titre: 'Stagiaire Génie des Procédés Métallurgiques', domaine: 'Mines',
    niveauRequis: 'Master 1', duree: '6 mois', remuneration: '400 000 Ar / mois', ville: 'Toamasina',
    teletravail: 'Non', typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Suivre les procédés de traitement métallurgique et proposer des optimisations.',
    competences: [['Génie des procédés', 'Avancé', true], ['Génie mécanique', 'Intermédiaire', false], ['Contrôle qualité', 'Débutant', false]] },

  { entreprise: 9, titre: 'Stagiaire Actuariat', domaine: 'Assurance',
    niveauRequis: 'Master 1', duree: '4 mois', remuneration: '300 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage professionnel', cat: 'finance',
    description: 'Participer au calcul des provisions techniques et à la tarification des produits d\'assurance ARO.',
    competences: [['Actuariat', 'Avancé', true], ['Statistiques', 'Avancé', true], ['Excel avancé', 'Intermédiaire', false]] },
  { entreprise: 9, titre: 'Stagiaire Gestion Sinistres', domaine: 'Assurance',
    niveauRequis: 'Licence 3', duree: '3 mois', remuneration: '230 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Non', typeStage: 'Stage académique', cat: 'finance',
    description: 'Assister le service sinistres dans le traitement et le suivi des dossiers clients.',
    competences: [['Relation client', 'Intermédiaire', true], ['Comptabilité', 'Débutant', false], ['Communication', 'Intermédiaire', true]] },
];

/* ===================================================================== */
/* HELPERS                                                                */
/* ===================================================================== */

async function getOrCreateUtilisateur(client, typeUtilisateur, email, plainPassword) {
  const existing = await client.query(
    'SELECT "idUtilisateur" FROM utilisateur WHERE "emailUtilisateur" = $1', [email]
  );
  if (existing.rows.length > 0) return { id: existing.rows[0].idUtilisateur, created: false };

  const hash = await bcrypt.hash(plainPassword, 10);
  const res = await client.query(
    `INSERT INTO utilisateur ("typeUtilisateur", "emailUtilisateur", "motDePasse")
     VALUES ($1, $2, $3) RETURNING "idUtilisateur"`,
    [typeUtilisateur, email, hash]
  );
  return { id: res.rows[0].idUtilisateur, created: true };
}

async function getOrCreateCompetence(client, nom, categorie) {
  const existing = await client.query(
    'SELECT "idCompetenceReference" FROM "CompetenceReference" WHERE LOWER("nomCompetenceReference") = LOWER($1)',
    [nom]
  );
  if (existing.rows.length > 0) return existing.rows[0].idCompetenceReference;

  const res = await client.query(
    `INSERT INTO "CompetenceReference" ("nomCompetenceReference", "categorieCompetenceReference")
     VALUES ($1, $2) RETURNING "idCompetenceReference"`,
    [nom, categorie]
  );
  return res.rows[0].idCompetenceReference;
}

/* ===================================================================== */
/* MAIN                                                                   */
/* ===================================================================== */

async function main() {
  const client = await pool.connect();
  const summary = { universites: 0, entreprises: 0, etudiants: 0, offres: 0, competences: 0 };

  try {
    await client.query('BEGIN');

    /* ---------- 1. Compétences de référence ---------- */
    const competenceIds = new Map();
    for (const [nom, categorie] of COMPETENCES) {
      const before = await client.query(
        'SELECT 1 FROM "CompetenceReference" WHERE LOWER("nomCompetenceReference") = LOWER($1)', [nom]
      );
      const id = await getOrCreateCompetence(client, nom, categorie);
      competenceIds.set(nom, id);
      if (before.rows.length === 0) summary.competences++;
    }
    // make sure pre-existing ones (Javascript, React, SQL) are in the map too
    for (const nom of ['Javascript', 'React', 'SQL']) {
      if (!competenceIds.has(nom)) {
        const r = await client.query(
          'SELECT "idCompetenceReference" FROM "CompetenceReference" WHERE LOWER("nomCompetenceReference") = LOWER($1)', [nom]
        );
        if (r.rows.length > 0) competenceIds.set(nom, r.rows[0].idCompetenceReference);
      }
    }

    /* ---------- 2. Universités ---------- */
    const universiteIds = [];
    for (const u of UNIVERSITES) {
      const email = `contact@${slugify(u.sigle)}.${EMAIL_DOMAIN}`;
      const { id: idUtilisateur, created } = await getOrCreateUtilisateur(client, 'Universite', email, DEMO_PASSWORD);

      const existing = await client.query('SELECT "idUniversite" FROM universite WHERE "idUtilisateur" = $1', [idUtilisateur]);
      let idUniversite;
      if (existing.rows.length > 0) {
        idUniversite = existing.rows[0].idUniversite;
      } else {
        const res = await client.query(
          `INSERT INTO universite (
            "idUtilisateur", "nomUniversite", "sigleUniversitaire", "telephoneUniversite",
            "adresseUniversite", ville, "siteWeb", "dateInscription", "estVerifie", "dateVerification"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_DATE, true, CURRENT_DATE)
          RETURNING "idUniversite"`,
          [idUtilisateur, u.nom, u.sigle, '+261 20 22 000 00', u.adresse, u.ville, u.site]
        );
        idUniversite = res.rows[0].idUniversite;
        summary.universites++;
      }
      universiteIds.push(idUniversite);
    }

    /* ---------- 3. Entreprises ---------- */
    const entrepriseIds = [];
    let entIdx = 0;
    for (const e of ENTREPRISES) {
      entIdx++;
      const email = `contact@${slugify(e.nom).slice(0, 20)}.${EMAIL_DOMAIN}`;
      const { id: idUtilisateur } = await getOrCreateUtilisateur(client, 'Entreprise', email, DEMO_PASSWORD);

      const existing = await client.query('SELECT "idEntreprise" FROM entreprise WHERE "idUtilisateur" = $1', [idUtilisateur]);
      let idEntreprise;
      if (existing.rows.length > 0) {
        idEntreprise = existing.rows[0].idEntreprise;
      } else {
        const res = await client.query(
          `INSERT INTO entreprise (
            "idUtilisateur", "nomEntreprise", "numeroIdentificationFiscal", "numeroStat",
            "formeJuridique", "secteurActivitePrincipal", "adresseSiegeSocial",
            "telephonePrincipal", "telephoneSecondaire", "siteWeb", "reseauxSociaux",
            "description", "logo", "dateInscription", "estVerifie", "dateVerification"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, CURRENT_DATE, true, CURRENT_DATE)
          RETURNING "idEntreprise"`,
          [
            idUtilisateur, e.nom,
            `NIF-DEMO-${String(entIdx).padStart(4, '0')}`, `STAT-DEMO-${String(entIdx).padStart(4, '0')}`,
            e.forme, e.secteur, e.adresse, '+261 20 22 111 11', null, e.site, null,
            e.desc, null,
          ]
        );
        idEntreprise = res.rows[0].idEntreprise;
        summary.entreprises++;
      }
      entrepriseIds.push(idEntreprise);
    }

    /* ---------- 4. Étudiants ---------- */
    const etudiantIds = [];
    let etIdx = 0;
    for (const e of ETUDIANTS) {
      etIdx++;
      const email = `${slugify(e.prenom)}.${slugify(e.nom)}@${EMAIL_DOMAIN}`;
      const { id: idUtilisateur } = await getOrCreateUtilisateur(client, 'Etudiant', email, DEMO_PASSWORD);

      const existing = await client.query('SELECT "idEtudiant" FROM etudiant WHERE "idUtilisateur" = $1', [idUtilisateur]);
      let idEtudiant;
      if (existing.rows.length > 0) {
        idEtudiant = existing.rows[0].idEtudiant;
      } else {
        const idUniversite = universiteIds[e.uni];
        const res = await client.query(
          `INSERT INTO etudiant (
            "idUtilisateur", "nomEtudiant", "prenomEtudiant", "telephoneEtudiant", genre,
            adresse, "photoProfil", bio, "idUniversite", matricule, filiere, specialisation,
            "niveauAcademique", "dateInscription", "estActif", "nomUniversiteSaisi"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, CURRENT_DATE, true, $14)
          RETURNING "idEtudiant"`,
          [
            idUtilisateur, e.nom, e.prenom, `+261 34 ${String(10000000 + etIdx).slice(0, 7)}`,
            e.genre, `${e.ville}, Madagascar`, null,
            `Étudiant(e) en ${e.spec}, ${e.niveau}.`, idUniversite,
            `MAT-${String(2020 + (etIdx % 5)).slice(2)}-${String(etIdx).padStart(4, '0')}`,
            e.filiere, e.spec, e.niveau, UNIVERSITES[e.uni].nom,
          ]
        );
        idEtudiant = res.rows[0].idEtudiant;
        summary.etudiants++;

        // preference-stage
        await client.query(
          `INSERT INTO "preference-stage" (
            "idEtudiant", "villePreferee", "accepteTeletravail", "rayonDeplacement",
            "mobiliteNational", "typeStagePreferee", "dureeSouhaitee",
            "dateDebutDisponibilite", "dateFinDisponibilite", "typeEntreprisePreferee",
            "disponibiliteImmediate"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', $8, $9)`,
          [
            idEtudiant,
            PREF_VILLES[etIdx % PREF_VILLES.length],
            PREF_TELETRAVAIL[etIdx % PREF_TELETRAVAIL.length],
            '50 km',
            etIdx % 3 === 0,
            PREF_TYPE_STAGE[etIdx % PREF_TYPE_STAGE.length],
            PREF_DUREE[etIdx % PREF_DUREE.length],
            PREF_TYPE_ENTREPRISE[etIdx % PREF_TYPE_ENTREPRISE.length],
            etIdx % 2 === 0,
          ]
        );

        // centre-interet
        await client.query(
          `INSERT INTO "centre-interet" ("idEtudiant", "domaineInteret", "missionPreferee")
           VALUES ($1, $2, $3)`,
          [idEtudiant, e.interet, e.mission]
        );

        // parcours-realisation
        await client.query(
          `INSERT INTO "parcours-realisation" (
            "idEtudiant", type, titre, description, entreprise, "dateDebut", "dateFin", lien
          ) VALUES ($1,$2,$3,$4,$5, CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '10 months', NULL)`,
          [
            idEtudiant, 'Projet académique',
            `Projet de fin d'année - ${e.spec}`,
            `Réalisation d'un projet en ${e.spec} dans le cadre du cursus ${e.filiere}.`,
            UNIVERSITES[e.uni].nom,
          ]
        );

        // compétences
        for (const [nomComp, niveau] of e.comp) {
          const idComp = competenceIds.get(nomComp);
          if (!idComp) continue;
          await client.query(
            `INSERT INTO "CompetenceEtudiant" ("idEtudiant", "idCompetenceReference", niveau)
             VALUES ($1, $2, $3) ON CONFLICT ("idEtudiant", "idCompetenceReference") DO NOTHING`,
            [idEtudiant, idComp, niveau]
          );
        }
      }
      etudiantIds.push(idEtudiant);
    }

    /* ---------- 5. Offres + compétences + QCM ---------- */
    for (const o of OFFRES) {
      const idEntreprise = entrepriseIds[o.entreprise];

      const existing = await client.query(
        'SELECT "idOffre" FROM offre WHERE "idEntreprise" = $1 AND titre = $2', [idEntreprise, o.titre]
      );
      if (existing.rows.length > 0) continue; // already seeded, skip

      const offreRes = await client.query(
        `INSERT INTO offre (
          "idEntreprise", titre, description, domaine, "niveauRequis", duree,
          "dateDebut", "dateFin", remuneration, lieu, ville, "accepteTeletravail",
          "typeStage", statut, "datePublication", "dateLimites"
        ) VALUES ($1,$2,$3,$4,$5,$6, CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '7 months',
          $7,$8,$9,$10,$11,'Active', CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '2 months')
        RETURNING "idOffre"`,
        [
          idEntreprise, o.titre, o.description, o.domaine, o.niveauRequis, o.duree,
          o.remuneration, o.ville, o.ville, o.teletravail, o.typeStage,
        ]
      );
      const idOffre = offreRes.rows[0].idOffre;
      summary.offres++;

      for (const [nomComp, niveauSouhaitee, obligatoire] of o.competences) {
        const idComp = competenceIds.get(nomComp);
        if (!idComp) continue;
        await client.query(
          `INSERT INTO "CompetenceOffre" ("idOffre", "idCompetenceReference", "niveauSouhaitee", "estObligatoire")
           VALUES ($1, $2, $3, $4)`,
          [idOffre, idComp, niveauSouhaitee, obligatoire]
        );
      }

      const template = QCM_TEMPLATES[o.cat];
      const qcmRes = await client.query(
        `INSERT INTO "QCM" ("idOffre", titre, description, duree, "noteMinimal", "dateCreation", "estActif")
         VALUES ($1, $2, $3, 20, 50, CURRENT_TIMESTAMP, true) RETURNING "idQCM"`,
        [idOffre, template.titre, `QCM de présélection pour: ${o.titre}`]
      );
      const idQCM = qcmRes.rows[0].idQCM;

      for (let i = 0; i < template.questions.length; i++) {
        const q = template.questions[i];
        const qRes = await client.query(
          `INSERT INTO "Question" ("idQCM", enonce, ordre, points) VALUES ($1,$2,$3,1) RETURNING "idQuestion"`,
          [idQCM, q.enonce, i]
        );
        const idQuestion = qRes.rows[0].idQuestion;
        for (let j = 0; j < q.choix.length; j++) {
          const [texte, estCorrect] = q.choix[j];
          await client.query(
            `INSERT INTO "ChoixReponse" ("idQuestion", enonce, ordre, "estCorrect") VALUES ($1,$2,$3,$4)`,
            [idQuestion, texte, j, estCorrect]
          );
        }
      }
    }

    await client.query('COMMIT');

    console.log('Seed terminé avec succès.');
    console.log(summary);
    console.log(`\nMot de passe unique pour tous les comptes créés : ${DEMO_PASSWORD}`);
    console.log(`Domaine des emails générés : @${EMAIL_DOMAIN} (ex: rakoto.njaka@${EMAIL_DOMAIN})`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erreur pendant le seed, rollback effectué:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
