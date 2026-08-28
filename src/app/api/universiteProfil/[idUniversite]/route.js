import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req, { params }) {
  const client = await pool.connect();
  try {
    const { idUniversite } = await params;

    // === Authentification optionnelle (visiteur peut être de n'importe quel type) ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // === 1. Récupérer les infos de l'université ===
    const universiteResult = await client.query(`
      SELECT 
        univ."idUniversite", univ."nomUniversite", univ."sigleUniversitaire",
        univ."adresseUniversite", univ."ville", univ."telephoneUniversite",
        univ."siteWeb", univ."logo", univ."estVerifie",
        univ."dateInscription", univ."dateVerification",
        u."idUtilisateur", u."emailUtilisateur"
      FROM universite univ
      INNER JOIN utilisateur u ON univ."idUtilisateur" = u."idUtilisateur"
      WHERE univ."idUniversite" = $1
    `, [idUniversite]);

    if (universiteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Université introuvable' }, { status: 404 });
    }

    const universite = universiteResult.rows[0];

    // === 2. Récupérer la liste des étudiants rattachés ===
    const etudiantsResult = await client.query(`
      SELECT 
        e."idEtudiant", e."nomEtudiant", e."prenomEtudiant",
        e."filiere", e."niveauAcademique", e."specialisation",
        e."photoProfil", e."estActif"
      FROM etudiant e
      WHERE e."idUniversite" = $1
      ORDER BY e."dateInscription" DESC
    `, [idUniversite]);

    return NextResponse.json({
      universite,
      etudiants: etudiantsResult.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET universiteProfil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}