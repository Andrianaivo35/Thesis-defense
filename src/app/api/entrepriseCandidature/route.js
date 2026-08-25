import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req) {
  const client = await pool.connect();

  try {
    // === Auth ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEntreprise = payload.idEntreprise;

    // === Récupère uniquement les candidatures des offres de cette entreprise ===
    const result = await client.query(`
      SELECT 
        c."idCandidature",
        c."dateCandidature",
        c."statut",
        c."scoreMatching",
        c."cv",
        c."lettreMotivation",
        e."idEtudiant",
        e."nomEtudiant",
        e."prenomEtudiant",
        e."telephoneEtudiant",
        e."filiere",
        e."niveauAcademique",
        e."specialisation",
        u."emailUtilisateur",
        u."idUtilisateur" AS "idUtilisateurEtudiant",
        univ."nomUniversite",
        o."idOffre",
        o."titre" AS "titreOffre",
        o."domaine"
      FROM "Candidature" c
      INNER JOIN etudiant e ON c."idEtudiant" = e."idEtudiant"
      INNER JOIN utilisateur u ON e."idUtilisateur" = u."idUtilisateur"
      LEFT JOIN universite univ ON e."idUniversite" = univ."idUniversite"
      INNER JOIN offre o ON c."idOffre" = o."idOffre"
      WHERE o."idEntreprise" = $1
      ORDER BY c."scoreMatching" DESC NULLS LAST, c."dateCandidature" DESC
    `, [idEntreprise]);

    return NextResponse.json(
      { candidatures: result.rows },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur candidatures entreprise:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}