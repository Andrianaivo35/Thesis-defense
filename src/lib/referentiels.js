/* =====================================================================
   Référentiels partagés : listes fermées de valeurs

   Ces champs étaient auparavant saisis en texte libre. Or le moteur de
   recommandation les compare directement :

     - niveauAcademique / niveauRequis -> valeurNiveau()
     - villePreferee / ville           -> scoreLocalisation()
     - dureeSouhaitee / duree          -> dureeEnMois()

   Chaque variante d'écriture ("master" vs "Master 1", "Tana" vs
   "Antananarivo") dégradait donc silencieusement la pertinence des
   correspondances. En figeant les valeurs, ces heuristiques deviennent des
   correspondances exactes.

   Un seul fichier pour tous les formulaires : les listes ne peuvent pas
   diverger entre l'inscription, la modification de profil et la création
   d'offre.
   ===================================================================== */

/* --- Niveaux académiques ---
   L'ordre du tableau est significatif : il traduit la progression du
   cursus et sert à comparer le niveau d'un étudiant à celui exigé par une
   offre. */
export const NIVEAUX_ACADEMIQUES = [
  'BTS',
  'DUT',
  'Licence 1',
  'Licence 2',
  'Licence 3',
  'Master 1',
  'Master 2',
  'Doctorat',
];

/* Valeur ordinale d'un niveau, utilisée pour mesurer l'écart entre le
   niveau acquis et le niveau requis. Les valeurs reprennent l'échelle
   déjà employée par le moteur de recommandation. */
export const VALEUR_NIVEAU = {
  'BTS': 4,
  'DUT': 4,
  'Licence 1': 3,
  'Licence 2': 4,
  'Licence 3': 5,
  'Master 1': 6,
  'Master 2': 7,
  'Doctorat': 8,
};

/* --- Villes ---
   Principales villes de Madagascar. « Autre » reste indispensable : une
   liste fermée ne doit jamais empêcher une inscription légitime. */
export const VILLES = [
  'Antananarivo',
  'Antsirabe',
  'Antsiranana',
  'Fianarantsoa',
  'Mahajanga',
  'Moramanga',
  'Morondava',
  'Nosy Be',
  'Sambava',
  'Taolagnaro',
  'Toamasina',
  'Toliara',
  'Autre',
];

/* --- Durées de stage --- */
export const DUREES_STAGE = [
  '1 mois',
  '2 mois',
  '3 mois',
  '4 mois',
  '5 mois',
  '6 mois',
  '12 mois',
];

/* Durée exprimée en mois, pour comparer la durée souhaitée par l'étudiant
   à celle proposée par l'offre. */
export const DUREE_EN_MOIS = {
  '1 mois': 1,
  '2 mois': 2,
  '3 mois': 3,
  '4 mois': 4,
  '5 mois': 5,
  '6 mois': 6,
  '12 mois': 12,
};

/* --- Autres listes déjà fermées dans les formulaires, regroupées ici
       pour rester cohérentes d'un écran à l'autre --- */
export const NIVEAUX_COMPETENCE = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];

export const OPTIONS_TELETRAVAIL = ['Oui', 'Non', 'Hybride'];

export const TYPES_STAGE = [
  'Stage académique',
  'Stage professionnel',
  'Stage de fin d\'études',
  'Stage d\'observation',
];

/* =====================================================================
   Domaines et filières

   Dernier champ libre alimentant le calcul de score : `scoreFiliere()`
   compare le domaine d'une offre à la filière et à la spécialisation de
   l'étudiant, par recouvrement de mots. La base contenait déjà deux
   valeurs « Informatique » distinctes, dont une avec des espaces en fin
   de chaîne — invisibles à l'affichage, mais suffisants pour faire
   échouer une comparaison.

   Le référentiel est **hiérarchique** : un domaine regroupe plusieurs
   filières. Cela permet au moteur de distinguer trois situations au lieu
   de deux — correspondance exacte, même domaine mais filière différente,
   aucun rapport — là où une liste plate n'aurait donné qu'un booléen.

   Choix assumé : ces valeurs vivent dans le code et non en base, comme
   les villes et les niveaux. Contrairement aux compétences, qui sont
   alimentées par les entreprises au fil des offres, une taxonomie de
   filières est stable et n'a pas vocation à être étendue par les
   utilisateurs. Cela évite une table, une migration et un écran
   d'administration pour une liste qui bouge rarement.
   ===================================================================== */

export const DOMAINES = [
  {
    libelle: 'Informatique et Numérique',
    filieres: [
      'Génie Logiciel', 'Développement Web', 'Développement Mobile',
      'Data Science et Intelligence Artificielle', 'Réseaux et Systèmes',
      'Cybersécurité', 'Informatique de Gestion',
    ],
  },
  {
    libelle: 'Télécommunications',
    filieres: ['Réseaux Mobiles', 'Infrastructures Télécoms', 'Transmission de Données'],
  },
  {
    libelle: 'Gestion et Commerce',
    filieres: [
      'Comptabilité', "Finance d'Entreprise", 'Audit et Contrôle de Gestion',
      'Marketing', 'Commerce et Distribution', 'Ressources Humaines',
      'Relation Client', 'Logistique et Transport',
    ],
  },
  {
    libelle: 'Banque, Finance et Assurance',
    filieres: ['Banque', 'Microfinance', 'Assurance', 'Actuariat'],
  },
  {
    libelle: 'Génie Civil et BTP',
    filieres: ['Bâtiment', 'Travaux Publics', 'Topographie'],
  },
  {
    libelle: 'Génie Industriel et Énergie',
    filieres: [
      'Génie Électrique', 'Énergies Renouvelables', 'Génie Mécanique',
      'Génie des Procédés', 'Maintenance Industrielle',
    ],
  },
  {
    libelle: 'Mines et Métallurgie',
    filieres: ['Exploitation Minière', 'Métallurgie', 'Sécurité Minière'],
  },
  {
    libelle: 'Agro-industrie et Agronomie',
    filieres: ['Agronomie', 'Industrie Agroalimentaire', 'Agro-export'],
  },
  {
    libelle: 'Pêche et Ressources Marines',
    filieres: ['Aquaculture', 'Sciences Halieutiques', 'Transformation des Produits de la Mer'],
  },
  {
    libelle: 'Textile et Industrie Manufacturière',
    filieres: ['Génie Textile', 'Confection', 'Contrôle Qualité'],
  },
  {
    libelle: 'Tourisme et Hôtellerie',
    filieres: ['Hôtellerie', 'Restauration', 'Tourisme', 'Événementiel'],
  },
  {
    libelle: 'Communication et Médias',
    filieres: ["Communication d'Entreprise", 'Communication Digitale', 'Journalisme'],
  },
  {
    libelle: 'Autre',
    filieres: ['Autre'],
  },
];

/** Libellés des domaines, pour les listes déroulantes. */
export const LIBELLES_DOMAINES = DOMAINES.map(d => d.libelle);

/** Filières d'un domaine donné ; tableau vide si le domaine est inconnu. */
export function filieresDuDomaine(libelleDomaine) {
  return DOMAINES.find(d => d.libelle === libelleDomaine)?.filieres || [];
}

/* Index inverse : filière -> domaine parent. Permet de retrouver le
   domaine d'une spécialisation sans reparcourir la structure. */
const DOMAINE_PAR_FILIERE = new Map();
for (const domaine of DOMAINES) {
  for (const filiere of domaine.filieres) {
    DOMAINE_PAR_FILIERE.set(filiere, domaine.libelle);
  }
}

export function domaineDeLaFiliere(filiere) {
  return DOMAINE_PAR_FILIERE.get(filiere) || null;
}
