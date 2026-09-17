/* =====================================================================
   RÉFÉRENTIEL DES ÉTABLISSEMENTS D'ENSEIGNEMENT SUPÉRIEUR

   POURQUOI UNE LISTE INDÉPENDANTE DES COMPTES

   Un établissement existe avant de s'inscrire sur la plateforme. Si
   l'étudiant ne peut choisir que parmi les universités qui ont déjà un
   compte, celui dont l'établissement n'est pas encore inscrit doit taper
   son nom à la main : « Univ. Fianarantsoa », « UF », « université de
   fianar »… Le rattachement automatique, qui compare les noms le jour où
   l'établissement s'inscrit, échoue alors à la moindre différence.

   Avec ce référentiel, l'étudiant choisit un NOM OFFICIEL, même quand
   l'établissement n'a pas de compte. Ce nom est enregistré tel quel. Le
   formulaire d'inscription des universités propose les mêmes noms : quand
   l'établissement s'inscrit, les deux écritures sont identiques et le
   rattachement se fait sans ambiguïté.

   CE QUE CETTE LISTE N'EST PAS

   Une liste officielle et exhaustive. Elle réunit les établissements
   connus au moment de sa rédaction ; un étudiant dont l'établissement
   manque garde la saisie libre. Les noms des établissements déjà inscrits
   sur la plateforme doivent y figurer à l'identique.
   ===================================================================== */
import { normalizeName } from './normalize.js';

export const ETABLISSEMENTS = [
  // Universités publiques
  { nom: "Université d'Antananarivo", sigle: 'UA', ville: 'Antananarivo' },
  { nom: "Université d'Antsiranana", sigle: 'UA-DIE', ville: 'Antsiranana' },
  { nom: 'Université de Fianarantsoa', sigle: 'UF', ville: 'Fianarantsoa' },
  { nom: 'Université de Mahajanga', sigle: 'UM', ville: 'Mahajanga' },
  { nom: 'Université de Toamasina', sigle: 'UT', ville: 'Toamasina' },
  { nom: 'Université de Toliara', sigle: 'UT-TLR', ville: 'Toliara' },

  // Écoles et instituts publics
  { nom: "École Supérieure Polytechnique d'Antananarivo", sigle: 'ESPA', ville: 'Antananarivo' },
  { nom: 'École Supérieure des Sciences Agronomiques', sigle: 'ESSA', ville: 'Antananarivo' },
  { nom: "École Normale Supérieure d'Antananarivo", sigle: 'ENS', ville: 'Antananarivo' },
  { nom: "École Nationale d'Informatique", sigle: 'ENI', ville: 'Fianarantsoa' },
  { nom: "École Nationale d'Administration de Madagascar", sigle: 'ENAM', ville: 'Antananarivo' },
  { nom: "Institut National des Sciences Comptables et de l'Administration d'Entreprises", sigle: 'INSCAE', ville: 'Antananarivo' },
  { nom: "Institut Supérieur de Technologie d'Antananarivo", sigle: 'IST-T', ville: 'Antananarivo' },
  { nom: "Institut Supérieur de Technologie d'Antsiranana", sigle: 'IST-D', ville: 'Antsiranana' },
  { nom: 'Institut Halieutique et des Sciences Marines', sigle: 'IH.SM', ville: 'Toliara' },
  { nom: "Institut d'Enseignement Supérieur d'Antsirabe Vakinankaratra", sigle: 'IES-AV', ville: 'Antsirabe' },
  { nom: 'Centre National de Télé-Enseignement de Madagascar', sigle: 'CNTEMAD', ville: 'Antananarivo' },

  // Établissements privés
  { nom: 'Université Catholique de Madagascar', sigle: 'UCM', ville: 'Antananarivo' },
  { nom: 'Université Adventiste Zurcher', sigle: 'UAZ', ville: 'Antsirabe' },
  { nom: 'Athénée Saint Joseph Antsirabe', sigle: 'ASJA', ville: 'Antsirabe' },
  { nom: 'Institut Supérieur Polytechnique de Madagascar', sigle: 'ISPM', ville: 'Antananarivo' },
  { nom: 'Institut Supérieur de la Communication, des Affaires et du Management', sigle: 'ISCAM', ville: 'Antananarivo' },
  { nom: "Institut National Supérieur d'Informatique", sigle: 'INSI', ville: 'Antananarivo' },
  { nom: "École de Management et d'Innovation Technologique", sigle: 'EMIT', ville: 'Fianarantsoa' },
  { nom: "École Supérieure de Management et d'Informatique Appliquée", sigle: 'ESMIA', ville: 'Antananarivo' },
];

/**
 * Réunit les établissements inscrits et ceux du référentiel.
 *
 * Un établissement inscrit l'emporte toujours sur son homonyme du
 * référentiel : il porte un identifiant, ses filières déclarées et son
 * état de vérification. Les autres entrées n'ont pas d'identifiant.
 *
 * Chaque entrée reçoit une clé stable (`u<id>` ou `r<rang>`), car
 * l'identifiant seul ne distingue pas les établissements sans compte.
 */
export function fusionnerAvecReferentiel(inscrits) {
  const dejaInscrits = new Set(inscrits.map(u => normalizeName(u.nomUniversite)));
  const avecCompte = inscrits.map(u => ({ ...u, cle: `u${u.idUniversite}`, aCompte: true }));
  const sansCompte = ETABLISSEMENTS
    .map((e, rang) => ({
      cle: `r${rang}`, aCompte: false, idUniversite: null,
      nomUniversite: e.nom, sigleUniversitaire: e.sigle, ville: e.ville,
      estVerifie: null, domaines: [],
    }))
    .filter(e => !dejaInscrits.has(normalizeName(e.nomUniversite)));
  return [...avecCompte, ...sansCompte]
    .sort((a, b) => a.nomUniversite.localeCompare(b.nomUniversite, 'fr'));
}
