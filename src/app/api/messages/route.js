import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function POST(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const idExpediteur = payload.idUtilisateur;
    const { idDestinataire, contenu, pieceJointe } = await req.json();

    if (!idDestinataire || !contenu || !contenu.trim()) {
      return NextResponse.json({ error: 'Destinataire et contenu requis' }, { status: 400 });
    }
    if (parseInt(idDestinataire) === idExpediteur) {
      return NextResponse.json({ error: 'Impossible de vous envoyer un message à vous-même' }, { status: 400 });
    }

    const destCheck = await client.query(
      `SELECT 1 FROM utilisateur WHERE "idUtilisateur" = $1`, [idDestinataire]
    );
    if (destCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 });
    }

    await client.query('BEGIN');

    // 1. Chercher une conversation existante entre les 2 utilisateurs
    const conversationResult = await client.query(`
      SELECT pc1."idConversation"
      FROM "participantConversation" pc1
      INNER JOIN "participantConversation" pc2 
        ON pc1."idConversation" = pc2."idConversation"
      WHERE pc1."idUtilisateur" = $1 AND pc2."idUtilisateur" = $2
      LIMIT 1
    `, [idExpediteur, idDestinataire]);

    let idConversation;

    if (conversationResult.rows.length > 0) {
      idConversation = conversationResult.rows[0].idConversation;
    } else {
      // 2. Aucune conversation : on en crée une + les 2 participants
      const newConv = await client.query(`
        INSERT INTO "Conversation" DEFAULT VALUES
        RETURNING "idConversation"
      `);
      idConversation = newConv.rows[0].idConversation;

      await client.query(`
        INSERT INTO "participantConversation" ("idConversation", "idUtilisateur")
        VALUES ($1, $2), ($1, $3)
      `, [idConversation, idExpediteur, idDestinataire]);
    }

    // 3. Insérer le message
    const messageResult = await client.query(`
      INSERT INTO "Message" ("idConversation", "idExpediteur", "contenu", "pieceJointe")
      VALUES ($1, $2, $3, $4)
      RETURNING "idMessage", "idConversation", "idExpediteur", "contenu", "dateEnvoi", "estLu", "pieceJointe"
    `, [idConversation, idExpediteur, contenu.trim(), pieceJointe || null]);

    // 4. Mettre à jour la date du dernier message
    await client.query(`
      UPDATE "Conversation" SET "dateDernierMessage" = CURRENT_TIMESTAMP
      WHERE "idConversation" = $1
    `, [idConversation]);

    await client.query('COMMIT');

    return NextResponse.json({ message: messageResult.rows[0] }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur envoi message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}