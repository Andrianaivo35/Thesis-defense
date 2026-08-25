import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const monIdUtilisateur = payload.idUtilisateur;

    // Une seule requête qui unifie les 3 types
    const result = await client.query(`
      SELECT 
        u."idUtilisateur",
        u."typeUtilisateur",
        u."emailUtilisateur",
        COALESCE(
          ent."nomEntreprise",
          univ."nomUniversite",
          et."prenomEtudiant" || ' ' || et."nomEtudiant"
        ) AS "nomAffichage",
        COALESCE(
          ent."logo",
          univ."logo",
          et."photoProfil"
        ) AS "photo"
      FROM utilisateur u
      LEFT JOIN entreprise ent ON u."idUtilisateur" = ent."idUtilisateur"
      LEFT JOIN universite univ ON u."idUtilisateur" = univ."idUtilisateur"
      LEFT JOIN etudiant et ON u."idUtilisateur" = et."idUtilisateur"
      WHERE u."idUtilisateur" != $1
        AND u."typeUtilisateur" != 'Admin'
      ORDER BY "nomAffichage" ASC
    `, [monIdUtilisateur]);

    return NextResponse.json(
      { utilisateurs: result.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}