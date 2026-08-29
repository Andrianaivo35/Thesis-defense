/* =====================================================================
   ADRESSES ÉLECTRONIQUES — normalisation et validation

   POURQUOI CE MODULE EXISTE

   Chaque route traitait l'adresse à sa façon. `universiteAjoutEtudiant`
   comparait sur `LOWER(...)` ; les inscriptions et les connexions
   historiques comparaient la chaîne brute.

   La conséquence était visible sans être signalée : un utilisateur
   inscrit sous « Jean@Univ.mg » qui saisissait « jean@univ.mg » à la
   connexion se voyait répondre « identifiants incorrects », alors que
   son mot de passe était bon et son compte intact.

   Une adresse est normalisée UNE fois, ici, et toutes les routes
   passent par cette fonction — celles qui écrivent comme celles qui
   lisent. C'est la condition pour que l'index d'unicité de la migration
   008 corresponde à ce que le code cherche réellement.
   ===================================================================== */

/**
 * Forme canonique d'une adresse : minuscules, sans espaces de bord.
 *
 * On ne va pas plus loin volontairement. Certains fournisseurs ignorent
 * les points (« j.dupont » = « jdupont ») ou le suffixe après « + » ;
 * l'appliquer serait une supposition sur le fournisseur, et refuserait à
 * tort une inscription légitime chez ceux qui les distinguent.
 *
 * @returns {string} chaîne vide si l'entrée n'est pas exploitable
 */
export function normaliserEmail(valeur) {
  if (typeof valeur !== 'string') return '';
  return valeur.trim().toLowerCase();
}

/* Validation délibérément permissive. Le seul juge d'une adresse est le
   serveur qui la dessert : un motif trop strict rejette des adresses
   valides — extensions longues, sous-domaines, caractères accentués —
   pour un bénéfice nul. On écarte ce qui est manifestement fautif, la
   confirmation réelle viendra du courriel d'activation (Lot 6.2). */
const MOTIF = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** L'adresse a-t-elle une forme plausible ? */
export function estEmailValide(valeur) {
  const forme = normaliserEmail(valeur);
  return forme.length > 0 && forme.length <= 254 && MOTIF.test(forme);
}

/* Code d'erreur PostgreSQL « violation de contrainte d'unicité ».
   Le motif existait déjà dans candidature/route.js ; il est repris ici
   pour que toutes les routes réagissent de la même façon. */
export const VIOLATION_UNICITE = '23505';

/**
 * Une erreur PostgreSQL est-elle un conflit sur l'adresse ?
 *
 * On vérifie le nom de l'index, et pas seulement le code : une même
 * insertion peut violer une autre contrainte d'unicité, et répondre
 * « cette adresse est déjà utilisée » serait alors trompeur.
 */
export function estConflitEmail(erreur) {
  return erreur?.code === VIOLATION_UNICITE &&
         String(erreur.constraint || '').includes('email');
}

/* Message unique, pour que les cinq routes d'inscription disent la même
   chose. Il évoque la récupération du mot de passe : « cette adresse est
   déjà utilisée » sans issue laisse l'utilisateur bloqué. */
export const MESSAGE_EMAIL_PRIS =
  'Un compte existe déjà avec cette adresse. Connectez-vous, ou utilisez ' +
  'la récupération de mot de passe si vous l\'avez oublié.';
