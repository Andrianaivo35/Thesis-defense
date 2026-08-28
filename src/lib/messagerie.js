/* =====================================================================
   Envoi de messages internes automatiques

   Cette logique était écrite directement dans admin/verification. Elle est
   désormais partagée, car la notification de changement de statut d'une
   candidature repose sur le même mécanisme.

   ⚠️ Point important : en PostgreSQL, toute instruction en échec avorte la
   transaction entière. Un envoi de message qui échoue faisait donc échouer
   le COMMIT, annulant au passage l'opération métier — alors que le code
   affirmait l'inverse (« l'échec du message NE DOIT PAS annuler ... »).

   D'où l'usage systématique d'un SAVEPOINT : en cas d'échec, on ne défait
   que la partie messagerie, et l'opération métier est bien conservée.
   ===================================================================== */

/* Trouve la conversation entre deux utilisateurs, ou la crée. */
export async function trouverOuCreerConversation(client, idUtilisateur1, idUtilisateur2) {
  const existante = await client.query(`
    SELECT c."idConversation"
    FROM "Conversation" c
    INNER JOIN "participantConversation" p1
      ON c."idConversation" = p1."idConversation" AND p1."idUtilisateur" = $1
    INNER JOIN "participantConversation" p2
      ON c."idConversation" = p2."idConversation" AND p2."idUtilisateur" = $2
    WHERE (
      SELECT COUNT(*) FROM "participantConversation"
      WHERE "idConversation" = c."idConversation"
    ) = 2
    LIMIT 1
  `, [idUtilisateur1, idUtilisateur2]);

  if (existante.rows.length > 0) {
    return existante.rows[0].idConversation;
  }

  const nouvelle = await client.query(`
    INSERT INTO "Conversation" ("dateCreation", "dateDernierMessage")
    VALUES (NOW(), NOW())
    RETURNING "idConversation"
  `);
  const idConversation = nouvelle.rows[0].idConversation;

  await client.query(`
    INSERT INTO "participantConversation" ("idConversation", "idUtilisateur")
    VALUES ($1, $2), ($1, $3)
  `, [idConversation, idUtilisateur1, idUtilisateur2]);

  return idConversation;
}

/**
 * Envoie un message interne sans jamais compromettre la transaction en cours.
 *
 * À appeler à l'intérieur d'une transaction déjà ouverte (BEGIN fait par
 * l'appelant). En cas d'échec, seul le SAVEPOINT est annulé : l'opération
 * métier reste committable.
 *
 * @returns {Promise<boolean>} true si le message a bien été enregistré
 */
export async function envoyerMessageInterne(client, { idExpediteur, idDestinataire, contenu }) {
  if (!idExpediteur || !idDestinataire || !contenu) return false;

  // Un utilisateur ne se notifie pas lui-même
  if (String(idExpediteur) === String(idDestinataire)) return false;

  try {
    await client.query('SAVEPOINT envoi_message');

    const idConversation = await trouverOuCreerConversation(
      client, idExpediteur, idDestinataire
    );

    await client.query(`
      INSERT INTO "Message"
        ("idConversation", "idExpediteur", "contenu", "dateEnvoi", "estLu")
      VALUES ($1, $2, $3, NOW(), false)
    `, [idConversation, idExpediteur, contenu]);

    await client.query(`
      UPDATE "Conversation"
      SET "dateDernierMessage" = NOW()
      WHERE "idConversation" = $1
    `, [idConversation]);

    await client.query('RELEASE SAVEPOINT envoi_message');
    return true;

  } catch (erreur) {
    // On ne défait que la messagerie : l'opération métier reste valide.
    await client.query('ROLLBACK TO SAVEPOINT envoi_message').catch(() => {});
    console.error('Message interne non envoyé :', erreur.message);
    return false;
  }
}
