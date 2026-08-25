import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req, { params }) {
  const client = await pool.connect();
  try {
    const { idAnnonce } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || !['Entreprise', 'Admin'].includes(payload.typeUtilisateur)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const annonceResult = await client.query(`
      SELECT 
        a.*,
        u."idUniversite", u."nomUniversite", u."sigleUniversitaire",
        u."adresseUniversite", u."ville" AS "villeUniversite",
        u."telephoneUniversite", u."siteWeb", u."logo" AS "logoUniversite",
        u."estVerifie",
        ut."idUtilisateur" AS "idUtilisateurUniversite",
        ut."emailUtilisateur" AS "emailUniversite"
      FROM "AnnonceCohorte" a
      INNER JOIN universite u ON a."idUniversite" = u."idUniversite"
      INNER JOIN utilisateur ut ON u."idUtilisateur" = ut."idUtilisateur"
      WHERE a."idAnnonceCohorte" = $1 AND a."statut" = 'Active'
    `, [idAnnonce]);

    if (annonceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Annonce introuvable ou non disponible' }, { status: 404 });
    }

    const etudiantsResult = await client.query(`
      SELECT "idEtudiantExterne", "nom", "prenom", "email", "cvPdf", "dateAjout"
      FROM "EtudiantExterne"
      WHERE "idAnnonceCohorte" = $1
      ORDER BY "idEtudiantExterne" ASC
    `, [idAnnonce]);

    return NextResponse.json({
      annonce: annonceResult.rows[0],
      etudiants: etudiantsResult.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET cohorte detail:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}