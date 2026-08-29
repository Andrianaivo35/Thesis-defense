import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/* =====================================================================
   JETONS À USAGE UNIQUE — activation de compte et réinitialisation

   Une seule mécanique pour deux besoins qui n'en font qu'un : prouver
   qu'une personne contrôle bien une adresse électronique, puis
   l'autoriser à poser un mot de passe.

   CE QUI EST STOCKÉ

   L'empreinte SHA-256 du jeton, jamais le jeton. Un jeton en clair en
   base est un mot de passe en clair : une sauvegarde égarée donnerait la
   main sur tous les comptes en attente d'activation.

   SHA-256 plutôt que bcrypt : bcrypt est lent délibérément, pour
   protéger des secrets devinables. Un tirage de 256 bits ne se devine
   pas — le ralentir ne protège de rien et interdirait la recherche par
   index, qui est ici le seul chemin d'accès.

   DURÉES

   Elles diffèrent parce que les risques diffèrent. Un lien
   d'activation est attendu : l'étudiant sait qu'il va le recevoir, mais
   il peut ne relever sa boîte que le lendemain. Un lien de
   réinitialisation, lui, peut avoir été déclenché par quelqu'un d'autre
   sur une adresse qui traîne ouverte ; sa fenêtre doit être courte.
   ===================================================================== */

export const TYPE_ACTIVATION = 'activation';
export const TYPE_REINITIALISATION = 'reinitialisation';

const DUREES_MS = {
  [TYPE_ACTIVATION]: 24 * 60 * 60 * 1000,   // 24 heures
  [TYPE_REINITIALISATION]: 60 * 60 * 1000   // 1 heure
};

/* 32 octets, soit 256 bits, rendus en base64url pour tenir dans une URL
   sans encodage supplémentaire. À cette taille, l'énumération est hors
   de portée : inutile d'ajouter une limitation de débit sur la
   vérification du jeton lui-même. */
function engendrerJeton() {
  return randomBytes(32).toString('base64url');
}

export function empreinte(jeton) {
  return createHash('sha256').update(String(jeton)).digest('hex');
}

/**
 * Crée un jeton pour un utilisateur et renvoie sa forme EN CLAIR.
 *
 * C'est le seul moment où le jeton complet existe. L'appelant doit
 * l'expédier immédiatement ; il ne pourra jamais le relire.
 *
 * Les jetons antérieurs du même type sont invalidés : demander un
 * nouveau lien doit périmer le précédent, sans quoi un lien ancien resté
 * dans une boîte de réception continuerait d'ouvrir le compte.
 *
 * @param {object} client connexion PostgreSQL (dans une transaction si besoin)
 * @param {number} idUtilisateur
 * @param {'activation'|'reinitialisation'} type
 * @returns {Promise<{jeton: string, expiration: Date}>}
 */
export async function creerJeton(client, idUtilisateur, type) {
  const duree = DUREES_MS[type];
  if (!duree) throw new Error(`Type de jeton inconnu : ${type}`);

  await client.query(
    `UPDATE "JetonUtilisateur" SET "dateUtilisation" = now()
      WHERE "idUtilisateur" = $1 AND "type" = $2 AND "dateUtilisation" IS NULL`,
    [idUtilisateur, type]
  );

  const jeton = engendrerJeton();
  const expiration = new Date(Date.now() + duree);

  await client.query(
    `INSERT INTO "JetonUtilisateur"
       ("idUtilisateur", "type", "jetonHache", "dateExpiration")
     VALUES ($1, $2, $3, $4)`,
    [idUtilisateur, type, empreinte(jeton), expiration]
  );

  return { jeton, expiration };
}

/**
 * Vérifie un jeton sans le consommer.
 * Sert à afficher le formulaire : inutile de faire saisir un mot de
 * passe pour annoncer ensuite que le lien avait expiré.
 *
 * @returns {Promise<{valide: boolean, motif?: string, idUtilisateur?: number, email?: string}>}
 */
export async function verifierJeton(client, jetonClair, type) {
  if (!jetonClair || typeof jetonClair !== 'string') {
    return { valide: false, motif: 'absent' };
  }

  const { rows } = await client.query(
    `SELECT j."idJeton", j."idUtilisateur", j."dateExpiration", j."dateUtilisation",
            u."emailUtilisateur", u."typeUtilisateur"
       FROM "JetonUtilisateur" j
       JOIN utilisateur u ON u."idUtilisateur" = j."idUtilisateur"
      WHERE j."jetonHache" = $1 AND j."type" = $2`,
    [empreinte(jetonClair), type]
  );

  const jeton = rows[0];
  if (!jeton) return { valide: false, motif: 'inconnu' };
  if (jeton.dateUtilisation) return { valide: false, motif: 'deja_utilise' };
  if (new Date(jeton.dateExpiration) < new Date()) return { valide: false, motif: 'expire' };

  return {
    valide: true,
    idJeton: jeton.idJeton,
    idUtilisateur: jeton.idUtilisateur,
    email: jeton.emailUtilisateur,
    typeUtilisateur: jeton.typeUtilisateur
  };
}

/**
 * Consomme un jeton : le marque utilisé et renvoie son porteur.
 *
 * La marque est posée par un UPDATE CONDITIONNEL, et non par une lecture
 * suivie d'une écriture. C'est ce qui rend l'usage réellement unique :
 * deux requêtes simultanées portant le même jeton verraient toutes deux
 * `dateUtilisation IS NULL` lors d'une lecture séparée, et le
 * consommeraient toutes les deux. Ici, la seconde ne trouve aucune ligne
 * à mettre à jour.
 */
export async function consommerJeton(client, jetonClair, type) {
  const controle = await verifierJeton(client, jetonClair, type);
  if (!controle.valide) return controle;

  const { rows } = await client.query(
    `UPDATE "JetonUtilisateur" SET "dateUtilisation" = now()
      WHERE "jetonHache" = $1 AND "type" = $2
        AND "dateUtilisation" IS NULL AND "dateExpiration" > now()
      RETURNING "idUtilisateur"`,
    [empreinte(jetonClair), type]
  );

  if (rows.length === 0) return { valide: false, motif: 'deja_utilise' };
  return { ...controle, valide: true, idUtilisateur: rows[0].idUtilisateur };
}

/* Messages destinés à l'utilisateur. Ils expliquent quoi faire, plutôt
   que de constater l'échec — un « lien invalide » sans issue laisse la
   personne bloquée. */
export const MESSAGES_MOTIF = {
  absent: 'Ce lien est incomplet. Copiez-le entièrement depuis votre courriel.',
  inconnu: "Ce lien n'est pas valide. Il a peut-être été tronqué par votre messagerie.",
  deja_utilise: 'Ce lien a déjà servi. Si vous avez besoin d\'un nouvel accès, demandez un nouveau lien.',
  expire: 'Ce lien a expiré. Demandez-en un nouveau, il vous parviendra immédiatement.'
};

/** Comparaison à temps constant, pour les usages hors base. */
export function comparerEmpreintes(a, b) {
  const ta = Buffer.from(String(a));
  const tb = Buffer.from(String(b));
  return ta.length === tb.length && timingSafeEqual(ta, tb);
}
