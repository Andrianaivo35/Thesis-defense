/**
 * Normalise un nom d'université pour comparaison souple :
 * - minuscules
 * - retire les accents
 * - remplace ponctuation/spéciaux par espace
 * - retire les espaces multiples
 * 
 * Exemples :
 * "Athénée Saint Joseph Antsirabe" → "athenee saint joseph antsirabe"
 * "ATHENEE SAINT-JOSEPH antsirabe" → "athenee saint joseph antsirabe"
 */
export function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}