/*
 * Second seeding wave: broadens the dummy dataset beyond IT/telecom to cover many more
 * real Madagascar economic sectors (banking, microfinance, insurance, energy/utilities,
 * BTP/construction, air transport, textile/agro-industry, fisheries/aquaculture,
 * vanilla/spice export, hospitality/tourism, retail/distribution), plus many more real
 * Malagasy universities/institutes (public regional universities + specialized schools).
 *
 * As with scripts/seed-dummy-data.js: real names/sectors, but contact emails, phone
 * numbers, and NIF/STAT numbers are fabricated placeholders for demo purposes only.
 *
 * Run with: node scripts/seed-dummy-data-2.js
 * Safe to re-run: every insert is guarded by an existence check first.
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

/* ===================================================================== */
/* DATA                                                                   */
/* ===================================================================== */

const NEW_COMPETENCES = [
  ['Microfinance', 'Gestion'],
  ['Énergies renouvelables', 'Industrie'],
  ['Génie textile', 'Industrie'],
  ['Aquaculture', 'Industrie'],
  ['Agronomie', 'Industrie'],
  ['Hôtellerie et Tourisme', 'Gestion'],
  ['Gestion de stocks', 'Gestion'],
  ['Merchandising', 'Gestion'],
  ['Logistique', 'Gestion'],
];

const NEW_UNIVERSITES = [
  { nom: 'Université de Mahajanga', sigle: 'UM', ville: 'Mahajanga',
    adresse: 'Ambondrona, BP 652, Mahajanga 401', site: 'https://univ-mahajanga.mg' },
  { nom: 'Université de Toliara', sigle: 'UT-TLR', ville: 'Toliara',
    adresse: 'Route du Port, BP 18, Toliara 601', site: 'https://univ-toliara.mg' },
  { nom: 'Université d\'Antsiranana', sigle: 'UA-DIE', ville: 'Antsiranana',
    adresse: 'Ambondrona, BP 0, Antsiranana 201', site: 'https://univ-antsiranana.mg' },
  { nom: 'Institut Supérieur de Technologie d\'Antananarivo', sigle: 'IST-T', ville: 'Antananarivo',
    adresse: 'Iadiambola Ampasampito, Antananarivo 101', site: 'https://ist-t.mg' },
  { nom: 'Institut National des Sciences Comptables et de l\'Administration d\'Entreprises', sigle: 'INSCAE',
    ville: 'Antananarivo', adresse: 'Ankatso, Antananarivo 101', site: 'https://inscae.mg' },
  { nom: 'Institut Supérieur de la Communication, des Affaires et du Management', sigle: 'ISCAM',
    ville: 'Antananarivo', adresse: 'Ambodivoanjo, Antananarivo 101', site: 'https://iscam.mg' },
  { nom: 'Université Catholique de Madagascar', sigle: 'UCM', ville: 'Antananarivo',
    adresse: 'Ambatobe, Antananarivo 103', site: 'https://ucm.mg' },
  { nom: 'Institut Supérieur Polytechnique de Madagascar', sigle: 'ISPM', ville: 'Antananarivo',
    adresse: 'Ankadikely Ilafy, Antananarivo 105', site: 'https://ispm.mg' },
  { nom: 'Institut Halieutique et des Sciences Marines', sigle: 'IH.SM', ville: 'Toliara',
    adresse: 'Route du Port, Toliara 601', site: 'https://ihsm.mg' },
];

const NEW_ENTREPRISES = [
  { nom: 'BOA Madagascar (Bank of Africa)', secteur: 'Banque', forme: 'SA',
    adresse: 'Ankorondrano, Antananarivo 101', ville: 'Antananarivo', site: 'https://boa.mg',
    desc: 'Première banque de Madagascar par le nombre d\'agences et de distributeurs.' },
  { nom: 'BFV Société Générale Madagascar', secteur: 'Banque', forme: 'SA',
    adresse: 'Ankorondrano, Antananarivo 101', ville: 'Antananarivo', site: 'https://bfv-sg.mg',
    desc: 'Filiale malgache de Société Générale, deuxième réseau bancaire du pays.' },
  { nom: 'Access Banque Madagascar', secteur: 'Microfinance', forme: 'SA',
    adresse: 'Antaninarenina, Antananarivo 101', ville: 'Antananarivo', site: 'https://accessbanque.mg',
    desc: 'Institution de microfinance dédiée aux particuliers et petites entreprises.' },
  { nom: 'NY HAVANA Assurances', secteur: 'Assurance', forme: 'SA',
    adresse: 'Antaninarenina, Antananarivo 101', ville: 'Antananarivo', site: 'https://nyhavana.mg',
    desc: 'Compagnie d\'assurances malgache proposant des produits dommages et prévoyance.' },
  { nom: 'JIRAMA', secteur: 'Énergie et Eau', forme: 'Société d\'État',
    adresse: 'Ambohijatovo, Antananarivo 101', ville: 'Antananarivo', site: 'https://www.jirama.mg',
    desc: 'Société d\'État assurant la production et la distribution d\'électricité et d\'eau potable.' },
  { nom: 'GreenYellow Madagascar', secteur: 'Énergie solaire', forme: 'SARL',
    adresse: 'Ambatolampy, Antananarivo', ville: 'Antananarivo', site: 'https://greenyellow.mg',
    desc: 'Développeur de centrales solaires, exploitant la plus grande centrale de l\'Océan Indien.' },
  { nom: 'Sogea-Satom Madagascar', secteur: 'BTP / Construction', forme: 'SARL',
    adresse: 'Andraharo, Antananarivo 101', ville: 'Antananarivo', site: 'https://sogea-satom.com',
    desc: 'Filiale du groupe Vinci, construction de routes et d\'infrastructures majeures.' },
  { nom: 'Colas Madagascar', secteur: 'BTP / Construction routière', forme: 'SARL',
    adresse: 'Tanjombato, Antananarivo 102', ville: 'Antananarivo', site: 'https://colas.mg',
    desc: 'Entreprise de travaux routiers et d\'infrastructures.' },
  { nom: 'Madagascar Airlines', secteur: 'Transport aérien', forme: 'SA',
    adresse: 'Ivato, Antananarivo 105', ville: 'Antananarivo', site: 'https://madagascarairlines.com',
    desc: 'Compagnie aérienne nationale malgache (vols domestiques et régionaux).' },
  { nom: 'Groupe SOCOTA', secteur: 'Agro-industrie / Textile', forme: 'SA',
    adresse: 'Antsirabe 110', ville: 'Antsirabe', site: 'https://socota.mg',
    desc: 'Groupe agro-industriel et textile malgache historique.' },
  { nom: 'UNIMA (Union Malgache des Industries)', secteur: 'Pêche / Aquaculture', forme: 'SA',
    adresse: 'Mahajanga 401', ville: 'Mahajanga', site: 'https://unima.mg',
    desc: 'Groupe spécialisé dans l\'aquaculture de crevettes et l\'export de produits de la mer.' },
  { nom: 'Sahanala Madagascar', secteur: 'Agro-export (vanille, épices)', forme: 'SA',
    adresse: 'Sambava 208', ville: 'Sambava', site: 'https://sahanala.mg',
    desc: 'Filière équitable d\'export de vanille et d\'épices malgaches.' },
  { nom: 'Hôtel Carlton Madagascar', secteur: 'Tourisme / Hôtellerie', forme: 'SA',
    adresse: 'Anosy, Antananarivo 101', ville: 'Antananarivo', site: 'https://carlton-madagascar.com',
    desc: 'Hôtel de référence à Antananarivo, événementiel et hébergement haut de gamme.' },
  { nom: 'Jumbo Score (Groupe SOCOMAD)', secteur: 'Distribution / Grande surface', forme: 'SA',
    adresse: 'Ankorondrano, Antananarivo 101', ville: 'Antananarivo', site: 'https://jumboscore.mg',
    desc: 'Enseigne de grande distribution et hypermarchés à Madagascar.' },
];

// uni index refers to NEW_UNIVERSITES (0-based)
const NEW_ETUDIANTS = [
  { nom: 'Rakotoniaina', prenom: 'Solofo', genre: 'Masculin', uni: 3, filiere: 'Génie Civil',
    spec: 'BTP', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Génie civil', 'Avancé'], ['Contrôle qualité', 'Intermédiaire'], ['Communication', 'Débutant']],
    interet: 'Construction et infrastructures', mission: 'Suivre des chantiers de construction' },
  { nom: 'Andriamanjato', prenom: 'Herimalala', genre: 'Féminin', uni: 1, filiere: 'Tourisme',
    spec: 'Hôtellerie et Tourisme', niveau: 'Licence 3', ville: 'Toliara',
    comp: [['Hôtellerie et Tourisme', 'Avancé'], ['Anglais professionnel', 'Avancé'], ['Communication', 'Avancé']],
    interet: 'Hôtellerie internationale', mission: 'Accueillir et accompagner une clientèle internationale' },
  { nom: 'Rakotozafy', prenom: 'Ndrina', genre: 'Masculin', uni: 5, filiere: 'Gestion',
    spec: 'Transport et Logistique', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Logistique', 'Avancé'], ['Gestion de projet', 'Intermédiaire'], ['Anglais professionnel', 'Intermédiaire']],
    interet: 'Chaîne logistique', mission: 'Optimiser des flux de transport de marchandises' },
  { nom: 'Razafimahatratra', prenom: 'Onja', genre: 'Féminin', uni: 5, filiere: 'Gestion',
    spec: 'Commerce et Distribution', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Gestion de stocks', 'Avancé'], ['Merchandising', 'Intermédiaire'], ['Communication', 'Intermédiaire']],
    interet: 'Grande distribution', mission: 'Optimiser la présentation des rayons en magasin' },
  { nom: 'Randriamiharisoa', prenom: 'Fetra', genre: 'Masculin', uni: 0, filiere: 'Agro-industrie',
    spec: 'Génie des Procédés Agroalimentaires', niveau: 'Master 1', ville: 'Mahajanga',
    comp: [['Génie des procédés', 'Avancé'], ['Contrôle qualité', 'Intermédiaire'], ['Agronomie', 'Intermédiaire']],
    interet: 'Transformation agroalimentaire', mission: 'Améliorer des lignes de production agro-industrielles' },
  { nom: 'Rasamimanana', prenom: 'Tantely', genre: 'Féminin', uni: 8, filiere: 'Sciences Halieutiques',
    spec: 'Aquaculture', niveau: 'Master 1', ville: 'Toliara',
    comp: [['Aquaculture', 'Avancé'], ['Contrôle qualité', 'Intermédiaire'], ['Statistiques', 'Débutant']],
    interet: 'Aquaculture côtière', mission: 'Étudier des élevages aquacoles durables' },
  { nom: 'Andriamandimbisoa', prenom: 'Fenohasina', genre: 'Masculin', uni: 3, filiere: 'Génie Électrique',
    spec: 'Énergie', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Génie électrique', 'Avancé'], ['Énergies renouvelables', 'Intermédiaire'], ['Anglais professionnel', 'Intermédiaire']],
    interet: 'Énergies renouvelables', mission: 'Concevoir des solutions énergétiques durables' },
  { nom: 'Rakotoarivelo', prenom: 'Malala', genre: 'Féminin', uni: 4, filiere: 'Comptabilité',
    spec: 'Comptabilité et Gestion', niveau: 'Master 1', ville: 'Antananarivo',
    comp: [['Comptabilité', 'Avancé'], ['Audit financier', 'Intermédiaire'], ['Microfinance', 'Débutant']],
    interet: 'Finance et microfinance', mission: 'Accompagner des institutions financières locales' },
  { nom: 'Razafindravao', prenom: 'Tsiory', genre: 'Féminin', uni: 6, filiere: 'Communication',
    spec: 'Communication d\'Entreprise', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Communication', 'Avancé'], ['Marketing digital', 'Intermédiaire'], ['Anglais professionnel', 'Intermédiaire']],
    interet: 'Communication institutionnelle', mission: 'Gérer l\'image de marque d\'une organisation' },
  { nom: 'Rabearison', prenom: 'Iavotiana', genre: 'Masculin', uni: 7, filiere: 'Informatique',
    spec: 'Intelligence Artificielle', niveau: 'Master 2', ville: 'Antananarivo',
    comp: [['Python', 'Avancé'], ['Machine Learning', 'Avancé'], ['Docker', 'Intermédiaire']],
    interet: 'Intelligence artificielle appliquée', mission: 'Développer des modèles d\'IA appliqués à l\'industrie' },
  { nom: 'Ravelojaona', prenom: 'Ainatiana', genre: 'Féminin', uni: 3, filiere: 'Génie Civil',
    spec: 'Bâtiment', niveau: 'Licence 3', ville: 'Antananarivo',
    comp: [['Génie civil', 'Intermédiaire'], ['Contrôle qualité', 'Débutant'], ['Excel avancé', 'Intermédiaire']],
    interet: 'Bâtiment durable', mission: 'Participer à la conception de bâtiments économes en énergie' },
  { nom: 'Rakotondramanana', prenom: 'Mparany', genre: 'Masculin', uni: 2, filiere: 'Gestion',
    spec: 'Gestion Portuaire et Transport', niveau: 'Master 1', ville: 'Antsiranana',
    comp: [['Logistique', 'Avancé'], ['Anglais professionnel', 'Intermédiaire'], ['Gestion de projet', 'Intermédiaire']],
    interet: 'Logistique portuaire', mission: 'Coordonner des opérations de transit portuaire' },
];

const PREF_VILLES = ['Antananarivo', 'Toamasina', 'Fianarantsoa', 'Antsirabe', 'Mahajanga', 'Toliara'];
const PREF_TELETRAVAIL = ['Oui', 'Non', 'Hybride'];
const PREF_TYPE_STAGE = ['Stage académique', 'Stage professionnel'];
const PREF_DUREE = ['3 mois', '4 mois', '6 mois'];
const PREF_TYPE_ENTREPRISE = ['PME', 'Grande entreprise', 'Startup'];

const QCM_TEMPLATES = {
  info: { titre: 'QCM Technique - Informatique', questions: [
    { enonce: 'Que signifie l\'acronyme SQL ?', choix: [['Structured Query Language', true], ['System Query Logic', false], ['Software Quality Level', false], ['Simple Query List', false]] },
    { enonce: 'Quel outil est utilisé pour le versionning de code ?', choix: [['Docker', false], ['Git', true], ['Figma', false], ['Postman', false]] },
    { enonce: 'Que fait une requête HTTP de type GET ?', choix: [['Elle supprime une ressource', false], ['Elle récupère une ressource', true], ['Elle crée une ressource', false], ['Elle authentifie un utilisateur', false]] },
  ]},
  finance: { titre: 'QCM Technique - Finance & Gestion', questions: [
    { enonce: 'Que représente le bilan comptable ?', choix: [['La rentabilité annuelle', false], ['Le patrimoine de l\'entreprise à un instant donné', true], ['Le chiffre d\'affaires mensuel', false], ['La liste des employés', false]] },
    { enonce: 'Qu\'est-ce qu\'un audit financier ?', choix: [['Un examen indépendant des comptes', true], ['Une campagne publicitaire', false], ['Un plan marketing', false], ['Un contrat de travail', false]] },
    { enonce: 'Que mesure le ratio de solvabilité ?', choix: [['La capacité à honorer ses dettes', true], ['Le nombre de clients', false], ['La satisfaction des employés', false], ['Le taux de change', false]] },
  ]},
  ingenierie: { titre: 'QCM Technique - Ingénierie & Industrie', questions: [
    { enonce: 'Quel équipement est essentiel sur un site industriel à risque ?', choix: [['Equipement de protection individuelle (EPI)', true], ['Un tableau blanc', false], ['Un vidéoprojecteur', false], ['Un logiciel de facturation', false]] },
    { enonce: 'Que signifie "contrôle qualité" en production ?', choix: [['Vérifier la conformité des produits aux normes', true], ['Compter les employés présents', false], ['Planifier les congés', false], ['Gérer la paie', false]] },
    { enonce: 'Qu\'est-ce qu\'un procédé industriel ?', choix: [['Un processus de transformation ou fabrication', true], ['Un logiciel de comptabilité', false], ['Une stratégie marketing', false], ['Un type de contrat', false]] },
  ]},
  business: { titre: 'QCM Technique - Commerce, Tourisme & Relation Client', questions: [
    { enonce: 'Qu\'est-ce que le marketing digital ?', choix: [['La promotion via des canaux numériques', true], ['La gestion des stocks', false], ['La comptabilité analytique', false], ['La maintenance informatique', false]] },
    { enonce: 'Quel est un indicateur clé en relation client ?', choix: [['Le taux de satisfaction client', true], ['Le taux d\'humidité', false], ['Le taux de change', false], ['Le taux d\'imposition', false]] },
    { enonce: 'Que désigne le terme "prospect" ?', choix: [['Un client potentiel', true], ['Un fournisseur historique', false], ['Un actionnaire', false], ['Un concurrent direct', false]] },
  ]},
};

// entreprise index refers to NEW_ENTREPRISES (0-based)
const NEW_OFFRES = [
  { entreprise: 0, titre: 'Stagiaire Chargé de Clientèle', domaine: 'Banque', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '240 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'finance',
    description: 'Accueillir et conseiller la clientèle particuliers d\'une agence BOA Madagascar.',
    competences: [['Relation client', 'Avancé', true], ['Comptabilité', 'Intermédiaire', false], ['Communication', 'Intermédiaire', true]] },
  { entreprise: 0, titre: 'Stagiaire Analyste Risques Bancaires', domaine: 'Banque', niveauRequis: 'Master 1',
    duree: '6 mois', remuneration: '320 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'finance',
    description: 'Participer à l\'évaluation des risques de crédit et à leur suivi.',
    competences: [['Analyse de données', 'Avancé', true], ['Statistiques', 'Intermédiaire', true], ['Excel avancé', 'Intermédiaire', false]] },

  { entreprise: 1, titre: 'Stagiaire Conseiller Bancaire', domaine: 'Banque', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '240 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'finance',
    description: 'Assister les conseillers clientèle d\'une agence BFV Société Générale.',
    competences: [['Relation client', 'Avancé', true], ['Communication', 'Intermédiaire', true], ['Comptabilité', 'Débutant', false]] },
  { entreprise: 1, titre: 'Stagiaire Développeur Informatique (Digital Banking)', domaine: 'Informatique',
    niveauRequis: 'Licence 3', duree: '4 mois', remuneration: '270 000 Ar / mois', ville: 'Antananarivo',
    teletravail: 'Hybride', typeStage: 'Stage professionnel', cat: 'info',
    description: 'Contribuer au développement des services bancaires digitaux (app, web).',
    competences: [['Java', 'Intermédiaire', true], ['SQL', 'Intermédiaire', true], ['Cybersécurité', 'Débutant', false]] },

  { entreprise: 2, titre: 'Stagiaire Agent de Microcrédit', domaine: 'Microfinance', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '200 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'finance',
    description: 'Accompagner l\'instruction de dossiers de microcrédit auprès de petits entrepreneurs.',
    competences: [['Microfinance', 'Avancé', true], ['Relation client', 'Intermédiaire', true], ['Comptabilité', 'Débutant', false]] },
  { entreprise: 2, titre: 'Stagiaire Analyste Microfinance', domaine: 'Microfinance', niveauRequis: 'Master 1',
    duree: '4 mois', remuneration: '260 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'finance',
    description: 'Analyser le portefeuille de crédits et proposer des indicateurs de suivi.',
    competences: [['Microfinance', 'Avancé', true], ['Analyse de données', 'Intermédiaire', true], ['Statistiques', 'Débutant', false]] },

  { entreprise: 3, titre: 'Stagiaire Souscription Assurance', domaine: 'Assurance', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '220 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'finance',
    description: 'Assister le service souscription dans l\'étude des dossiers d\'assurance.',
    competences: [['Actuariat', 'Intermédiaire', true], ['Relation client', 'Intermédiaire', true], ['Communication', 'Débutant', false]] },
  { entreprise: 3, titre: 'Stagiaire Gestion des Contrats', domaine: 'Assurance', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '210 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'finance',
    description: 'Suivre le cycle de vie des contrats d\'assurance clients.',
    competences: [['Comptabilité', 'Débutant', true], ['Relation client', 'Avancé', true], ['Communication', 'Intermédiaire', false]] },

  { entreprise: 4, titre: 'Stagiaire Ingénieur Électrique Réseaux', domaine: 'Énergie', niveauRequis: 'Master 1',
    duree: '6 mois', remuneration: '350 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Participer au suivi des réseaux électriques de distribution de la JIRAMA.',
    competences: [['Génie électrique', 'Avancé', true], ['Contrôle qualité', 'Intermédiaire', false], ['Communication', 'Débutant', false]] },
  { entreprise: 4, titre: 'Stagiaire Technicien Distribution d\'Eau', domaine: 'Énergie', niveauRequis: 'Licence 3',
    duree: '4 mois', remuneration: '230 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Assister le suivi technique du réseau de distribution d\'eau potable.',
    competences: [['Génie civil', 'Intermédiaire', true], ['Contrôle qualité', 'Intermédiaire', true], ['Communication', 'Débutant', false]] },

  { entreprise: 5, titre: 'Stagiaire Ingénieur Énergies Renouvelables', domaine: 'Énergie', niveauRequis: 'Master 1',
    duree: '6 mois', remuneration: '360 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Contribuer à l\'exploitation d\'une centrale solaire et à l\'optimisation de sa performance.',
    competences: [['Énergies renouvelables', 'Avancé', true], ['Génie électrique', 'Intermédiaire', true], ['Anglais professionnel', 'Intermédiaire', false]] },
  { entreprise: 5, titre: 'Stagiaire Chargé d\'Études Solaires', domaine: 'Énergie', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '250 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Hybride',
    typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Réaliser des études de dimensionnement de projets solaires.',
    competences: [['Énergies renouvelables', 'Intermédiaire', true], ['Statistiques', 'Débutant', false], ['Communication', 'Débutant', false]] },

  { entreprise: 6, titre: 'Stagiaire Ingénieur Travaux BTP', domaine: 'BTP', niveauRequis: 'Master 1',
    duree: '6 mois', remuneration: '340 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Assister la conduite de chantiers d\'infrastructures routières et bâtiments.',
    competences: [['Génie civil', 'Avancé', true], ['Contrôle qualité', 'Intermédiaire', true], ['Communication', 'Débutant', false]] },
  { entreprise: 6, titre: 'Stagiaire Conducteur de Travaux', domaine: 'BTP', niveauRequis: 'Licence 3',
    duree: '4 mois', remuneration: '260 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Suivre l\'avancement des travaux et la coordination des équipes sur site.',
    competences: [['Génie civil', 'Intermédiaire', true], ['Gestion de projet', 'Débutant', false], ['Communication', 'Intermédiaire', false]] },

  { entreprise: 7, titre: 'Stagiaire Ingénieur Génie Civil Routier', domaine: 'BTP', niveauRequis: 'Master 1',
    duree: '6 mois', remuneration: '340 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Participer aux études et au suivi de chantiers de construction routière.',
    competences: [['Génie civil', 'Avancé', true], ['Contrôle qualité', 'Intermédiaire', true], ['Anglais professionnel', 'Débutant', false]] },
  { entreprise: 7, titre: 'Stagiaire Topographe', domaine: 'BTP', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '230 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Réaliser des relevés topographiques pour des projets routiers.',
    competences: [['Génie civil', 'Intermédiaire', true], ['Contrôle qualité', 'Débutant', false], ['Communication', 'Débutant', false]] },

  { entreprise: 8, titre: 'Stagiaire Opérations Aériennes', domaine: 'Transport', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '250 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'business',
    description: 'Assister le service opérations dans la planification des vols domestiques.',
    competences: [['Logistique', 'Avancé', true], ['Anglais professionnel', 'Avancé', true], ['Communication', 'Intermédiaire', false]] },
  { entreprise: 8, titre: 'Stagiaire Service Client Aéroportuaire', domaine: 'Transport', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '210 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'business',
    description: 'Accompagner les passagers et gérer les demandes au comptoir d\'escale.',
    competences: [['Relation client', 'Avancé', true], ['Anglais professionnel', 'Intermédiaire', true], ['Communication', 'Avancé', false]] },

  { entreprise: 9, titre: 'Stagiaire Ingénieur Production Textile', domaine: 'Textile', niveauRequis: 'Licence 3',
    duree: '4 mois', remuneration: '240 000 Ar / mois', ville: 'Antsirabe', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Suivre les lignes de production textile et proposer des optimisations de procédé.',
    competences: [['Génie textile', 'Avancé', true], ['Contrôle qualité', 'Intermédiaire', true], ['Communication', 'Débutant', false]] },
  { entreprise: 9, titre: 'Stagiaire Contrôle Qualité Textile', domaine: 'Textile', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '220 000 Ar / mois', ville: 'Antsirabe', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Contrôler la conformité des lots de production textile aux normes qualité.',
    competences: [['Contrôle qualité', 'Avancé', true], ['Génie textile', 'Intermédiaire', false], ['Communication', 'Débutant', false]] },

  { entreprise: 10, titre: 'Stagiaire Ingénieur Aquacole', domaine: 'Pêche', niveauRequis: 'Master 1',
    duree: '6 mois', remuneration: '300 000 Ar / mois', ville: 'Mahajanga', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Participer au suivi technique des bassins d\'élevage de crevettes.',
    competences: [['Aquaculture', 'Avancé', true], ['Contrôle qualité', 'Intermédiaire', true], ['Statistiques', 'Débutant', false]] },
  { entreprise: 10, titre: 'Stagiaire Qualité Produits de la Mer', domaine: 'Pêche', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '230 000 Ar / mois', ville: 'Mahajanga', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Contrôler la qualité des produits de la mer avant export.',
    competences: [['Contrôle qualité', 'Avancé', true], ['Aquaculture', 'Intermédiaire', false], ['Communication', 'Débutant', false]] },

  { entreprise: 11, titre: 'Stagiaire Agronome Filière Vanille', domaine: 'Agro-export', niveauRequis: 'Licence 3',
    duree: '4 mois', remuneration: '230 000 Ar / mois', ville: 'Sambava', teletravail: 'Non',
    typeStage: 'Stage professionnel', cat: 'ingenierie',
    description: 'Accompagner les producteurs de vanille sur les bonnes pratiques agronomiques.',
    competences: [['Agronomie', 'Avancé', true], ['Contrôle qualité', 'Intermédiaire', true], ['Anglais professionnel', 'Débutant', false]] },
  { entreprise: 11, titre: 'Stagiaire Assurance Qualité Export', domaine: 'Agro-export', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '220 000 Ar / mois', ville: 'Sambava', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'ingenierie',
    description: 'Vérifier la conformité des lots de vanille et d\'épices avant export.',
    competences: [['Contrôle qualité', 'Avancé', true], ['Anglais professionnel', 'Intermédiaire', true], ['Communication', 'Débutant', false]] },

  { entreprise: 12, titre: 'Stagiaire Réception et Accueil', domaine: 'Hôtellerie', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '210 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'business',
    description: 'Assurer l\'accueil et le service à la réception d\'un hôtel haut de gamme.',
    competences: [['Hôtellerie et Tourisme', 'Avancé', true], ['Anglais professionnel', 'Avancé', true], ['Communication', 'Avancé', false]] },
  { entreprise: 12, titre: 'Stagiaire Gestion Événementielle', domaine: 'Hôtellerie', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '220 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'business',
    description: 'Participer à l\'organisation d\'événements et de séminaires d\'entreprise.',
    competences: [['Hôtellerie et Tourisme', 'Intermédiaire', true], ['Gestion de projet', 'Intermédiaire', true], ['Communication', 'Avancé', false]] },

  { entreprise: 13, titre: 'Stagiaire Gestion de Stocks', domaine: 'Distribution', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '210 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'business',
    description: 'Suivre les niveaux de stock et les approvisionnements d\'un hypermarché.',
    competences: [['Gestion de stocks', 'Avancé', true], ['Excel avancé', 'Intermédiaire', true], ['Communication', 'Débutant', false]] },
  { entreprise: 13, titre: 'Stagiaire Merchandising', domaine: 'Distribution', niveauRequis: 'Licence 3',
    duree: '3 mois', remuneration: '210 000 Ar / mois', ville: 'Antananarivo', teletravail: 'Non',
    typeStage: 'Stage académique', cat: 'business',
    description: 'Optimiser la mise en rayon et l\'attractivité des linéaires en magasin.',
    competences: [['Merchandising', 'Avancé', true], ['Marketing digital', 'Intermédiaire', false], ['Communication', 'Intermédiaire', true]] },
];

/* ===================================================================== */
/* HELPERS                                                                */
/* ===================================================================== */

async function getOrCreateUtilisateur(client, typeUtilisateur, email, plainPassword) {
  const existing = await client.query('SELECT "idUtilisateur" FROM utilisateur WHERE "emailUtilisateur" = $1', [email]);
  if (existing.rows.length > 0) return { id: existing.rows[0].idUtilisateur, created: false };
  const hash = await bcrypt.hash(plainPassword, 10);
  const res = await client.query(
    `INSERT INTO utilisateur ("typeUtilisateur", "emailUtilisateur", "motDePasse") VALUES ($1,$2,$3) RETURNING "idUtilisateur"`,
    [typeUtilisateur, email, hash]
  );
  return { id: res.rows[0].idUtilisateur, created: true };
}

async function getOrCreateCompetence(client, nom, categorie) {
  const existing = await client.query('SELECT "idCompetenceReference" FROM "CompetenceReference" WHERE LOWER("nomCompetenceReference") = LOWER($1)', [nom]);
  if (existing.rows.length > 0) return { id: existing.rows[0].idCompetenceReference, created: false };
  const res = await client.query(
    `INSERT INTO "CompetenceReference" ("nomCompetenceReference", "categorieCompetenceReference") VALUES ($1,$2) RETURNING "idCompetenceReference"`,
    [nom, categorie]
  );
  return { id: res.rows[0].idCompetenceReference, created: true };
}

/* ===================================================================== */
/* MAIN                                                                   */
/* ===================================================================== */

async function main() {
  const client = await pool.connect();
  const summary = { universites: 0, entreprises: 0, etudiants: 0, offres: 0, competences: 0 };

  try {
    await client.query('BEGIN');

    /* ---------- 1. Nouvelles compétences ---------- */
    const competenceIds = new Map();
    for (const [nom, categorie] of NEW_COMPETENCES) {
      const { id, created } = await getOrCreateCompetence(client, nom, categorie);
      competenceIds.set(nom, id);
      if (created) summary.competences++;
    }
    // include all competences referenced by offers/students that already exist from wave 1
    const REUSED_NAMES = [
      'Relation client', 'Comptabilité', 'Communication', 'Analyse de données', 'Statistiques',
      'Excel avancé', 'Java', 'SQL', 'Cybersécurité', 'Génie civil', 'Contrôle qualité',
      'Gestion de projet', 'Génie électrique', 'Anglais professionnel', 'Marketing digital',
      'Python', 'Machine Learning', 'Docker', 'Audit financier',
    ];
    for (const nom of REUSED_NAMES) {
      if (!competenceIds.has(nom)) {
        const r = await client.query('SELECT "idCompetenceReference" FROM "CompetenceReference" WHERE LOWER("nomCompetenceReference") = LOWER($1)', [nom]);
        if (r.rows.length > 0) competenceIds.set(nom, r.rows[0].idCompetenceReference);
      }
    }

    /* ---------- 2. Nouvelles universités ---------- */
    const universiteIds = [];
    for (const u of NEW_UNIVERSITES) {
      const email = `contact@${slugify(u.sigle)}.${EMAIL_DOMAIN}`;
      const { id: idUtilisateur } = await getOrCreateUtilisateur(client, 'Universite', email, DEMO_PASSWORD);
      const existing = await client.query('SELECT "idUniversite" FROM universite WHERE "idUtilisateur" = $1', [idUtilisateur]);
      let idUniversite;
      if (existing.rows.length > 0) {
        idUniversite = existing.rows[0].idUniversite;
      } else {
        const res = await client.query(
          `INSERT INTO universite (
            "idUtilisateur", "nomUniversite", "sigleUniversitaire", "telephoneUniversite",
            "adresseUniversite", ville, "siteWeb", "dateInscription", "estVerifie", "dateVerification"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_DATE, true, CURRENT_DATE) RETURNING "idUniversite"`,
          [idUtilisateur, u.nom, u.sigle, '+261 20 22 000 00', u.adresse, u.ville, u.site]
        );
        idUniversite = res.rows[0].idUniversite;
        summary.universites++;
      }
      universiteIds.push(idUniversite);
    }

    /* ---------- 3. Nouvelles entreprises ---------- */
    const entrepriseIds = [];
    let entIdx = 100; // offset to avoid NIF/STAT clashing with wave-1 placeholders
    for (const e of NEW_ENTREPRISES) {
      entIdx++;
      const email = `contact@${slugify(e.nom).slice(0, 24)}.${EMAIL_DOMAIN}`;
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
            idUtilisateur, e.nom, `NIF-DEMO-${entIdx}`, `STAT-DEMO-${entIdx}`,
            e.forme, e.secteur, e.adresse, '+261 20 22 111 11', null, e.site, null, e.desc, null,
          ]
        );
        idEntreprise = res.rows[0].idEntreprise;
        summary.entreprises++;
      }
      entrepriseIds.push(idEntreprise);
    }

    /* ---------- 4. Nouveaux étudiants ---------- */
    let etIdx = 100;
    for (const e of NEW_ETUDIANTS) {
      etIdx++;
      const email = `${slugify(e.prenom)}.${slugify(e.nom)}@${EMAIL_DOMAIN}`;
      const { id: idUtilisateur } = await getOrCreateUtilisateur(client, 'Etudiant', email, DEMO_PASSWORD);
      const existing = await client.query('SELECT "idEtudiant" FROM etudiant WHERE "idUtilisateur" = $1', [idUtilisateur]);
      if (existing.rows.length > 0) continue;

      const idUniversite = universiteIds[e.uni];
      const res = await client.query(
        `INSERT INTO etudiant (
          "idUtilisateur", "nomEtudiant", "prenomEtudiant", "telephoneEtudiant", genre,
          adresse, "photoProfil", bio, "idUniversite", matricule, filiere, specialisation,
          "niveauAcademique", "dateInscription", "estActif", "nomUniversiteSaisi"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, CURRENT_DATE, true, $14)
        RETURNING "idEtudiant"`,
        [
          idUtilisateur, e.nom, e.prenom, `+261 33 ${String(20000000 + etIdx).slice(0, 7)}`,
          e.genre, `${e.ville}, Madagascar`, null,
          `${e.genre === 'Féminin' ? 'Étudiante' : 'Étudiant'} en ${e.spec}, ${e.niveau}.`, idUniversite,
          `MAT-${String(2021 + (etIdx % 4)).slice(2)}-${String(etIdx).padStart(4, '0')}`,
          e.filiere, e.spec, e.niveau, NEW_UNIVERSITES[e.uni].nom,
        ]
      );
      const idEtudiant = res.rows[0].idEtudiant;
      summary.etudiants++;

      await client.query(
        `INSERT INTO "preference-stage" (
          "idEtudiant", "villePreferee", "accepteTeletravail", "rayonDeplacement",
          "mobiliteNational", "typeStagePreferee", "dureeSouhaitee",
          "dateDebutDisponibilite", "dateFinDisponibilite", "typeEntreprisePreferee",
          "disponibiliteImmediate"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', $8, $9)`,
        [
          idEtudiant, PREF_VILLES[etIdx % PREF_VILLES.length], PREF_TELETRAVAIL[etIdx % PREF_TELETRAVAIL.length],
          '50 km', etIdx % 3 === 0, PREF_TYPE_STAGE[etIdx % PREF_TYPE_STAGE.length],
          PREF_DUREE[etIdx % PREF_DUREE.length], PREF_TYPE_ENTREPRISE[etIdx % PREF_TYPE_ENTREPRISE.length],
          etIdx % 2 === 0,
        ]
      );

      await client.query(
        `INSERT INTO "centre-interet" ("idEtudiant", "domaineInteret", "missionPreferee") VALUES ($1,$2,$3)`,
        [idEtudiant, e.interet, e.mission]
      );

      await client.query(
        `INSERT INTO "parcours-realisation" (
          "idEtudiant", type, titre, description, entreprise, "dateDebut", "dateFin", lien
        ) VALUES ($1,$2,$3,$4,$5, CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '10 months', NULL)`,
        [
          idEtudiant, 'Projet académique', `Projet de fin d'année - ${e.spec}`,
          `Réalisation d'un projet en ${e.spec} dans le cadre du cursus ${e.filiere}.`,
          NEW_UNIVERSITES[e.uni].nom,
        ]
      );

      for (const [nomComp, niveau] of e.comp) {
        const idComp = competenceIds.get(nomComp);
        if (!idComp) continue;
        await client.query(
          `INSERT INTO "CompetenceEtudiant" ("idEtudiant", "idCompetenceReference", niveau)
           VALUES ($1,$2,$3) ON CONFLICT ("idEtudiant", "idCompetenceReference") DO NOTHING`,
          [idEtudiant, idComp, niveau]
        );
      }
    }

    /* ---------- 5. Nouvelles offres ---------- */
    for (const o of NEW_OFFRES) {
      const idEntreprise = entrepriseIds[o.entreprise];
      const existing = await client.query('SELECT "idOffre" FROM offre WHERE "idEntreprise" = $1 AND titre = $2', [idEntreprise, o.titre]);
      if (existing.rows.length > 0) continue;

      const offreRes = await client.query(
        `INSERT INTO offre (
          "idEntreprise", titre, description, domaine, "niveauRequis", duree,
          "dateDebut", "dateFin", remuneration, lieu, ville, "accepteTeletravail",
          "typeStage", statut, "datePublication", "dateLimites"
        ) VALUES ($1,$2,$3,$4,$5,$6, CURRENT_DATE + INTERVAL '1 month', CURRENT_DATE + INTERVAL '7 months',
          $7,$8,$9,$10,$11,'Active', CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '2 months')
        RETURNING "idOffre"`,
        [idEntreprise, o.titre, o.description, o.domaine, o.niveauRequis, o.duree, o.remuneration, o.ville, o.ville, o.teletravail, o.typeStage]
      );
      const idOffre = offreRes.rows[0].idOffre;
      summary.offres++;

      for (const [nomComp, niveauSouhaitee, obligatoire] of o.competences) {
        const idComp = competenceIds.get(nomComp);
        if (!idComp) continue;
        await client.query(
          `INSERT INTO "CompetenceOffre" ("idOffre", "idCompetenceReference", "niveauSouhaitee", "estObligatoire") VALUES ($1,$2,$3,$4)`,
          [idOffre, idComp, niveauSouhaitee, obligatoire]
        );
      }

      const template = QCM_TEMPLATES[o.cat];
      const qcmRes = await client.query(
        `INSERT INTO "QCM" ("idOffre", titre, description, duree, "noteMinimal", "dateCreation", "estActif")
         VALUES ($1,$2,$3,20,50, CURRENT_TIMESTAMP, true) RETURNING "idQCM"`,
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

    console.log('Seed (vague 2) terminé avec succès.');
    console.log(summary);
    console.log(`\nMot de passe unique pour tous les comptes créés : ${DEMO_PASSWORD}`);
    console.log(`Domaine des emails générés : @${EMAIL_DOMAIN}`);
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
