/* =====================================================================
   Politique de mot de passe

   L'exigence se limitait à 6 caractères, sans aucune contrainte de
   composition, et elle était réécrite dans chaque route. Combinée à
   l'absence de limitation de débit sur les connexions, cela rendait une
   attaque par force brute réaliste.

   Les règles sont volontairement lisibles et explicites : le message
   renvoyé indique précisément ce qui manque, plutôt qu'un refus générique.
   ===================================================================== */

export const LONGUEUR_MINIMALE = 8;

/**
 * Vérifie un mot de passe.
 * @returns {string|null} message d'erreur en français, ou null si valide
 */
export function validerMotDePasse(motDePasse) {
  if (!motDePasse || typeof motDePasse !== 'string') {
    return 'Le mot de passe est obligatoire.';
  }

  const manquants = [];
  if (motDePasse.length < LONGUEUR_MINIMALE) {
    return `Le mot de passe doit contenir au moins ${LONGUEUR_MINIMALE} caractères.`;
  }
  if (!/[a-z]/.test(motDePasse)) manquants.push('une minuscule');
  if (!/[A-Z]/.test(motDePasse)) manquants.push('une majuscule');
  if (!/[0-9]/.test(motDePasse)) manquants.push('un chiffre');

  if (manquants.length > 0) {
    return `Le mot de passe doit contenir au moins ${manquants.join(', ')}.`;
  }

  return null;
}

/** Description affichable de la politique, pour les formulaires. */
export const REGLE_MOT_DE_PASSE =
  `Au moins ${LONGUEUR_MINIMALE} caractères, dont une minuscule, une majuscule et un chiffre.`;
