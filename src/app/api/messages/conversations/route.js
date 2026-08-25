import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const moi = payload.idUtilisateur;

    const result = await client.query(`
      SELECT 
        conv."idConversation",
        conv."dateDernierMessage" AS "derniereDateEnvoi",
        autre."idUtilisateur" AS "autreId",
        autre."typeUtilisateur",
        COALESCE(
          ent."nomEntreprise",
          univ."nomUniversite",
          TRIM(CONCAT(etu."prenomEtudiant", ' ', etu."nomEtudiant"))
        ) AS "nomAffichage",
        (SELECT m."contenu" FROM "Message" m 
         WHERE m."idConversation" = conv."idConversation"
         ORDER BY m."dateEnvoi" DESC LIMIT 1) AS "dernierMessage",
        (SELECT COUNT(*) FROM "Message" m 
         WHERE m."idConversation" = conv."idConversation"
           AND m."idExpediteur" <> $1
           AND m."estLu" = false) AS "nonLus"
      FROM "participantConversation" moi_pc
      INNER JOIN "Conversation" conv 
        ON moi_pc."idConversation" = conv."idConversation"
      INNER JOIN "participantConversation" autre_pc 
        ON autre_pc."idConversation" = conv."idConversation"
        AND autre_pc."idUtilisateur" <> $1
      INNER JOIN utilisateur autre 
        ON autre_pc."idUtilisateur" = autre."idUtilisateur"
      LEFT JOIN entreprise ent ON autre."idUtilisateur" = ent."idUtilisateur"
      LEFT JOIN universite univ ON autre."idUtilisateur" = univ."idUtilisateur"
      LEFT JOIN etudiant etu ON autre."idUtilisateur" = etu."idUtilisateur"
      WHERE moi_pc."idUtilisateur" = $1
      ORDER BY conv."dateDernierMessage" DESC
    `, [moi]);

    return NextResponse.json({ conversations: result.rows }, { status: 200 });
  } catch (error) {
    console.error('Erreur conversations:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}