import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// =====================================================================
// Helper : trouve ou crée la conversation entre 2 utilisateurs
// =====================================================================
async function trouverOuCreerConversation(client, idUtilisateur1, idUtilisateur2) {
  // 1. Chercher une conversation déjà existante entre ces 2 utilisateurs
  const existante = await client.query(`
    SELECT c."idConversation"
    FROM "Conversation" c
    INNER JOIN "participantConversation" p1 ON c."idConversation" = p1."idConversation" AND p1."idUtilisateur" = $1
    INNER JOIN "participantConversation" p2 ON c."idConversation" = p2."idConversation" AND p2."idUtilisateur" = $2
    WHERE (
      SELECT COUNT(*) FROM "participantConversation" 
      WHERE "idConversation" = c."idConversation"
    ) = 2
    LIMIT 1
  `, [idUtilisateur1, idUtilisateur2]);

  if (existante.rows.length > 0) {
    return existante.rows[0].idConversation;
  }

  // 2. Sinon, créer une nouvelle conversation
  const nouvelle = await client.query(`
    INSERT INTO "Conversation" ("dateCreation", "dateDernierMessage")
    VALUES (NOW(), NOW())
    RETURNING "idConversation"
  `);
  const idConversation = nouvelle.rows[0].idConversation;

  // 3. Ajouter les 2 participants (avec p minuscule !)
  await client.query(`
    INSERT INTO "participantConversation" ("idConversation", "idUtilisateur")
    VALUES ($1, $2), ($1, $3)
  `, [idConversation, idUtilisateur1, idUtilisateur2]);

  return idConversation;
}

// =====================================================================
// PATCH : valider ou retirer la vérification d'un compte
// =====================================================================
export async function PATCH(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload || payload.typeUtilisateur !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type, id, estVerifie } = await req.json();

    if (!['entreprise', 'universite'].includes(type) || !id || typeof estVerifie !== 'boolean') {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    await client.query('BEGIN');

    // === 1. UPDATE du statut + récupération des infos ===
    let result;
    if (type === 'entreprise') {
      result = await client.query(`
        UPDATE entreprise e
        SET "estVerifie" = $1,
            "dateVerification" = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END
        FROM utilisateur u
        WHERE e."idEntreprise" = $2 AND e."idUtilisateur" = u."idUtilisateur"
        RETURNING e."idEntreprise", e."estVerifie",
                  e."nomEntreprise" AS "nom",
                  u."idUtilisateur", u."emailUtilisateur"
      `, [estVerifie, id]);
    } else {
      result = await client.query(`
        UPDATE universite univ
        SET "estVerifie" = $1,
            "dateVerification" = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END
        FROM utilisateur u
        WHERE univ."idUniversite" = $2 AND univ."idUtilisateur" = u."idUtilisateur"
        RETURNING univ."idUniversite", univ."estVerifie",
                  univ."nomUniversite" AS "nom",
                  u."idUtilisateur", u."emailUtilisateur"
      `, [estVerifie, id]);
    }

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    const compte = result.rows[0];
    let messageEnvoye = false;

    // === 2. Envoi du message interne UNIQUEMENT lors d'une validation (true) ===
    if (estVerifie === true) {
      try {
        const idAdmin = payload.idUtilisateur;
        const idDestinataire = compte.idUtilisateur;

        // Trouver ou créer la conversation Admin ↔ destinataire
        const idConversation = await trouverOuCreerConversation(
          client, idAdmin, idDestinataire
        );

        // Composer le contenu du message
        const typeAffiche = type === 'entreprise' ? 'entreprise' : 'université';
        const contenu = `🎉 Félicitations ! Votre compte ${typeAffiche} « ${compte.nom} » a été officiellement vérifié par notre équipe.

Vous bénéficiez désormais du badge « ✓ Vérifiée » qui sera visible sur votre profil par tous les utilisateurs de la plateforme. Cela renforce votre crédibilité et inspire confiance auprès des ${type === 'entreprise' ? 'étudiants et universités' : 'étudiants et entreprises'}.

Bienvenue dans la communauté Stage Share ! 🚀

— L'équipe d'administration`;

        // Insérer le message
        await client.query(`
          INSERT INTO "Message" 
            ("idConversation", "idExpediteur", "contenu", "dateEnvoi", "estLu")
          VALUES ($1, $2, $3, NOW(), false)
        `, [idConversation, idAdmin, contenu]);

        // Mettre à jour la date du dernier message dans la conversation
        await client.query(`
          UPDATE "Conversation" 
          SET "dateDernierMessage" = NOW() 
          WHERE "idConversation" = $1
        `, [idConversation]);

        messageEnvoye = true;
      } catch (msgError) {
        // L'échec du message NE DOIT PAS annuler la vérification
        console.error('⚠️ Message non envoyé :', msgError.message);
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        message: 'Statut de vérification mis à jour',
        resultat: compte,
        emailEnvoye: messageEnvoye
      },
      { status: 200 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur vérification:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}