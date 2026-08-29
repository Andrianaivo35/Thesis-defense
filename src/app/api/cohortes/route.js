import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    // Autorisé pour les entreprises ET les admins
    if (!payload || !['Entreprise', 'Admin'].includes(payload.typeUtilisateur)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const result = await client.query(`
      SELECT 
        a."idAnnonceCohorte", a."titre", a."description",
        a."filiereConcernee", a."niveauAcademique", a."domainesRecherche",
        a."periodeDebut", a."periodeFin", a."dureeStage",
        a."villePreferee", a."accepteTeletravail", a."dateLimite",
        a."statut", a."datePublication",
        u."idUniversite", u."nomUniversite", u."sigleUniversitaire",
        u."ville" AS "villeUniversite", u."logo" AS "logoUniversite",
        u."estVerifie",
        ut."idUtilisateur" AS "idUtilisateurUniversite",
        p."idPromotion", p."libelle" AS "promotionLibelle", p."annee" AS "promotionAnnee",
        /* Les étudiants réellement disponibles, et non une liste saisie à
           la main : ils ont un compte, un profil et un CV. C'est ce qui
           rend l'annonce exploitable par l'entreprise. */
        COUNT(DISTINCT e."idEtudiant") AS "nombreEtudiants"
      FROM "AnnonceCohorte" a
      INNER JOIN universite u ON a."idUniversite" = u."idUniversite"
      INNER JOIN utilisateur ut ON u."idUtilisateur" = ut."idUtilisateur"
      LEFT JOIN "Promotion" p ON p."idPromotion" = a."idPromotion"
      LEFT JOIN etudiant e ON e."idPromotion" = p."idPromotion"
        AND COALESCE(e."statutRattachement", 'Valide') = 'Valide'
      WHERE a."statut" = 'Active'
      GROUP BY a."idAnnonceCohorte", u."idUniversite", ut."idUtilisateur", p."idPromotion"
      ORDER BY a."datePublication" DESC
    `);

    return NextResponse.json({ cohortes: result.rows }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET cohortes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}