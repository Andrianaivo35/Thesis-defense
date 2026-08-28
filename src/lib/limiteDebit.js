/* =====================================================================
   Limitation de débit sur les routes sensibles

   Aucune limite n'existait sur les routes de connexion : un attaquant
   pouvait enchaîner les tentatives sans contrainte, ce que l'ancienne
   politique de mot de passe (6 caractères, sans exigence de composition)
   rendait d'autant plus exploitable.

   Implémentation volontairement simple : un compteur en mémoire, par
   processus.

   ⚠️ Limite assumée : en mémoire signifie que le compteur repart à zéro
   au redémarrage, et qu'il n'est pas partagé entre plusieurs instances de
   l'application. Pour un déploiement multi-instances, il faudrait un
   magasin partagé (Redis). C'est suffisant ici, et à mentionner dans les
   limites du mémoire plutôt qu'à sur-concevoir.
   ===================================================================== */

const FENETRE_MS = 15 * 60 * 1000;   // 15 minutes
const MAX_TENTATIVES = 10;           // par identifiant et par fenêtre

/** Map cle -> { tentatives, debutFenetre } */
const compteurs = new Map();

/* Purge périodique : sans cela, la Map croîtrait indéfiniment avec les
   adresses IP vues. */
let dernierNettoyage = Date.now();
function nettoyer(maintenant) {
  if (maintenant - dernierNettoyage < FENETRE_MS) return;
  for (const [cle, valeur] of compteurs) {
    if (maintenant - valeur.debutFenetre > FENETRE_MS) compteurs.delete(cle);
  }
  dernierNettoyage = maintenant;
}

/**
 * Identifie l'appelant. On combine l'adresse IP et l'e-mail vise : cela
 * bloque le martelage d'un compte donne sans penaliser tous les
 * utilisateurs partageant une meme sortie reseau.
 */
export function identifierAppelant(req, email = '') {
  const entetes = req.headers;
  const ip =
    entetes.get('x-forwarded-for')?.split(',')[0].trim() ||
    entetes.get('x-real-ip') ||
    'inconnue';
  return `${ip}|${(email || '').toLowerCase()}`;
}

/**
 * Enregistre une tentative et indique si elle doit être refusée.
 * @returns {{autorise: boolean, tentativesRestantes: number, secondesAttente: number}}
 */
export function verifierLimite(cle) {
  const maintenant = Date.now();
  nettoyer(maintenant);

  const entree = compteurs.get(cle);

  if (!entree || maintenant - entree.debutFenetre > FENETRE_MS) {
    compteurs.set(cle, { tentatives: 1, debutFenetre: maintenant });
    return { autorise: true, tentativesRestantes: MAX_TENTATIVES - 1, secondesAttente: 0 };
  }

  entree.tentatives += 1;

  if (entree.tentatives > MAX_TENTATIVES) {
    const secondesAttente = Math.ceil(
      (FENETRE_MS - (maintenant - entree.debutFenetre)) / 1000
    );
    return { autorise: false, tentativesRestantes: 0, secondesAttente };
  }

  return {
    autorise: true,
    tentativesRestantes: MAX_TENTATIVES - entree.tentatives,
    secondesAttente: 0
  };
}

/* Une connexion reussie remet le compteur a zero : seules les tentatives
   infructueuses doivent peser. */
export function reinitialiserLimite(cle) {
  compteurs.delete(cle);
}

/** Message d'erreur normalisé, en français. */
export function messageLimiteAtteinte(secondesAttente) {
  const minutes = Math.ceil(secondesAttente / 60);
  return `Trop de tentatives de connexion. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`;
}
