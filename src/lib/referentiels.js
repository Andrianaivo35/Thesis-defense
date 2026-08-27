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
