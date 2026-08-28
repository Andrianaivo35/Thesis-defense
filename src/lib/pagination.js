/* =====================================================================
   Pagination partagée des routes de liste

   Aucune route ne paginait : `GET /api/listeOffre` renvoyait déjà 47 Ko
   pour 51 offres, et la charge croissait linéairement sans limite. Les
   recherches d'offres étaient par ailleurs filtrées dans le navigateur,
   sur des données intégralement téléchargées.

   Ce module centralise la lecture des paramètres et la forme de la
   réponse, pour que toutes les routes se comportent de la même manière.
   ===================================================================== */

export const TAILLE_PAGE_DEFAUT = 20;
export const TAILLE_PAGE_MAX = 100;

/**
 * Lit `page` et `taille` depuis l'URL, en bornant les valeurs : un client
 * ne doit pas pouvoir demander une page de 100 000 éléments.
 *
 * @returns {{page: number, taille: number, offset: number}}
 */
export function lireParametresPagination(req, tailleDefaut = TAILLE_PAGE_DEFAUT) {
  const { searchParams } = new URL(req.url);

  const pageBrute = parseInt(searchParams.get('page'), 10);
  const tailleBrute = parseInt(searchParams.get('taille'), 10);

  const page = Number.isFinite(pageBrute) && pageBrute > 0 ? pageBrute : 1;
  const taille = Number.isFinite(tailleBrute) && tailleBrute > 0
    ? Math.min(tailleBrute, TAILLE_PAGE_MAX)
    : tailleDefaut;

  return { page, taille, offset: (page - 1) * taille };
}

/** Lit un terme de recherche, nettoyé et borné en longueur. */
export function lireRecherche(req, nomParametre = 'recherche') {
  const { searchParams } = new URL(req.url);
  const valeur = (searchParams.get(nomParametre) || '').trim();
  return valeur.slice(0, 100);
}

/**
 * Construit le bloc de pagination renvoyé au client.
 * `total` provient d'un COUNT(*) OVER() : le nombre total avant découpage.
 */
export function construirePagination({ page, taille, total }) {
  const totalNombre = Number(total) || 0;
  const nombrePages = Math.max(1, Math.ceil(totalNombre / taille));

  return {
    page,
    taille,
    total: totalNombre,
    nombrePages,
    aPrecedent: page > 1,
    aSuivant: page < nombrePages
  };
}
