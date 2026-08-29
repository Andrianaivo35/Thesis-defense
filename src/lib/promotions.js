/* =====================================================================
   PROMOTIONS — utilitaires partagés

   Une promotion se définit par son établissement, son libellé et son
   ANNÉE. « L3 Informatique » sans année ne désigne rien : deux années
   successives portent le même nom et rassemblent des personnes
   différentes.
   ===================================================================== */

/**
 * Année universitaire en cours, sous la forme « 2025-2026 ».
 *
 * La bascule a lieu en août plutôt qu'en janvier : une promotion se
 * définit par sa rentrée. Un import lancé en octobre 2026 appartient à
 * l'année 2026-2027, et proposer « 2025-2026 » par défaut obligerait à
 * corriger à chaque fois.
 */
export function anneeUniversitaireCourante(date = new Date()) {
  const annee = date.getFullYear();
  const mois = date.getMonth();          // 0 = janvier, 7 = août
  return mois >= 7 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;
}

/** Quelques années proposées au choix, autour de l'année courante. */
export function anneesProposees(date = new Date()) {
  const courante = anneeUniversitaireCourante(date);
  const debut = Number(courante.split('-')[0]);
  return [debut + 1, debut, debut - 1, debut - 2].map(a => `${a}-${a + 1}`);
}

const MOTIF_ANNEE = /^\d{4}-\d{4}$/;

/** Une année est-elle bien formée et cohérente ? */
export function estAnneeValide(valeur) {
  if (!MOTIF_ANNEE.test(String(valeur || ''))) return false;
  const [debut, fin] = String(valeur).split('-').map(Number);
  return fin === debut + 1 && debut >= 2000 && debut <= 2100;
}

/** Libellé lisible : « L3 Informatique — 2025-2026 ». */
export function nommerPromotion(promotion) {
  if (!promotion) return null;
  return `${promotion.libelle} — ${promotion.annee}`;
}

export const STATUTS_PROMOTION = ['Active', 'Diplomee', 'Archivee'];

export const LIBELLES_STATUT = {
  Active: 'En cours',
  Diplomee: 'Diplômée',
  Archivee: 'Archivée'
};

/**
 * Retrouve une promotion, ou la crée.
 *
 * L'import ne doit pas fabriquer un doublon quand l'université relance
 * le même fichier : l'index d'unicité de la migration 010 porte sur
 * (établissement, libellé en minuscules, année), et cette fonction s'y
 * conforme plutôt que de laisser la contrainte lever.
 *
 * @param {object} client connexion PostgreSQL, dans une transaction
 */
export async function trouverOuCreerPromotion(client, {
  idUniversite, libelle, annee, niveauAcademique = null,
  filiere = null, specialisation = null
}) {
  const existante = await client.query(
    `SELECT * FROM "Promotion"
      WHERE "idUniversite" = $1 AND lower("libelle") = lower($2) AND "annee" = $3`,
    [idUniversite, libelle, annee]
  );
  if (existante.rows.length > 0) return existante.rows[0];

  const creee = await client.query(
    `INSERT INTO "Promotion"
       ("idUniversite", "libelle", "annee", "niveauAcademique", "filiere", "specialisation")
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [idUniversite, libelle.trim(), annee, niveauAcademique, filiere, specialisation]
  );
  return creee.rows[0];
}
