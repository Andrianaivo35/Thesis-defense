import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req, { params }) {
  const { idUtilisateur } = await params;
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const moi = payload.idUtilisateur;
    const autre = idUtilisateur;

    // Infos du correspondant
    const destResult = await client.query(`
      SELECT 
        u."idUtilisateur",
        u."typeUtilisateur",
        COALESCE(
          ent."nomEntreprise",
          univ."nomUniversite",
          TRIM(CONCAT(etu."prenomEtudiant", ' ', etu."nomEtudiant"))
        ) AS "nomAffichage"
      FROM utilisateur u
      LEFT JOIN entreprise ent ON u."idUtilisateur" = ent."idUtilisateur"
      LEFT JOIN universite univ ON u."idUtilisateur" = univ."idUtilisateur"
      LEFT JOIN etudiant etu ON u."idUtilisateur" = etu."idUtilisateur"
      WHERE u."idUtilisateur" = $1
    `, [autre]);

    if (destResult.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Chercher la conversation entre les 2
    const convResult = await client.query(`
      SELECT pc1."idConversation"
      FROM "participantConversation" pc1
      INNER JOIN "participantConversation" pc2 
        ON pc1."idConversation" = pc2."idConversation"
      WHERE pc1."idUtilisateur" = $1 AND pc2."idUtilisateur" = $2
      LIMIT 1
    `, [moi, autre]);

    // Pas encore de conversation : fil vide
    if (convResult.rows.length === 0) {
      return NextResponse.json({
        destinataire: destResult.rows[0],
        idConversation: null,
        messages: []
      }, { status: 200 });
    }

    const idConversation = convResult.rows[0].idConversation;

    // Récupérer les messages
    const messagesResult = await client.query(`
      SELECT "idMessage", "idConversation", "idExpediteur", "contenu", 
             "dateEnvoi", "estLu", "pieceJointe"
      FROM "Message"
      WHERE "idConversation" = $1
      ORDER BY "dateEnvoi" ASC
    `, [idConversation]);

    // Marquer comme lus les messages reçus
    await client.query(`
      UPDATE "Message" SET "estLu" = true
      WHERE "idConversation" = $1 AND "idExpediteur" <> $2 AND "estLu" = false
    `, [idConversation, moi]);

    return NextResponse.json({
      destinataire: destResult.rows[0],
      idConversation,
      messages: messagesResult.rows
    }, { status: 200 });
  } catch (error) {
    console.error('Erreur fil de discussion:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}