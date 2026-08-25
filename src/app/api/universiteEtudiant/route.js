import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req) {
  const client = await pool.connect();

  try {
    // === Auth : université uniquement ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idUniversite = payload.idUniversite;

    // === Tous les étudiants de cette université ===
    // LEFT JOIN LATERAL : récupère le stage en cours le plus récent (si recruté)
    const result = await client.query(`
      SELECT 
        e."idEtudiant",
        e."nomEtudiant",
        e."prenomEtudiant",
        e."photoProfil",
        e."niveauAcademique",
        e."filiere",
        e."specialisation",
        e."estActif",
        u."emailUtilisateur",
        stage."nomEntreprise" AS "stageEntreprise",
        stage."posteOffre" AS "stagePoste",
        COUNT(DISTINCT cand."idCandidature") AS "nombreCandidatures"
      FROM etudiant e
      INNER JOIN utilisateur u ON e."idUtilisateur" = u."idUtilisateur"
      LEFT JOIN "Candidature" cand ON cand."idEtudiant" = e."idEtudiant"
      LEFT JOIN LATERAL (
        SELECT ent."nomEntreprise", o."titre" AS "posteOffre"
        FROM "Candidature" c2
        INNER JOIN offre o ON c2."idOffre" = o."idOffre"
        INNER JOIN entreprise ent ON o."idEntreprise" = ent."idEntreprise"
        WHERE c2."idEtudiant" = e."idEtudiant" AND c2."statut" = 'Recruté'
        ORDER BY c2."dateCandidature" DESC
        LIMIT 1
      ) stage ON true
      WHERE e."idUniversite" = $1
      GROUP BY e."idEtudiant", u."emailUtilisateur", stage."nomEntreprise", stage."posteOffre"
      ORDER BY e."nomEtudiant" ASC
    `, [idUniversite]);

    return NextResponse.json(
      { etudiants: result.rows },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur étudiants université:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}