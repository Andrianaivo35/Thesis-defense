import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import {
  lireParametresPagination, construirePagination
} from '@/lib/pagination';
import { verifyToken } from '@/lib/jwt';

export async function GET(req) {
  const client = await pool.connect();

  try {
    const { page, taille, offset } = lireParametresPagination(req);
    // === Auth : entreprise uniquement ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || !['Entreprise', 'Universite'].includes(payload.typeUtilisateur)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // === Récupère tous les étudiants actifs ===
    const result = await client.query(`
      SELECT 
        e."idEtudiant",
        e."nomEtudiant",
        e."prenomEtudiant",
        e."photoProfil",
        e."niveauAcademique",
        e."filiere",
        e."specialisation",
        e."bio",
        e."dateInscription",
        univ."nomUniversite",
        univ."sigleUniversitaire",
        COUNT(DISTINCT p."idParcoursRealisation") AS "nombreParcours",
        COUNT(DISTINCT ci."idCentreInteret") AS "nombreInterets",
        COUNT(*) OVER() AS "totalResultats"
      FROM etudiant e
      LEFT JOIN universite univ ON e."idUniversite" = univ."idUniversite"
      LEFT JOIN "parcours-realisation" p ON p."idEtudiant" = e."idEtudiant"
      LEFT JOIN "centre-interet" ci ON ci."idEtudiant" = e."idEtudiant"
      WHERE e."estActif" = true
      GROUP BY e."idEtudiant", univ."nomUniversite", univ."sigleUniversitaire"
      ORDER BY e."nomEtudiant" ASC, e."idEtudiant" ASC
      LIMIT $1 OFFSET $2
    `, [taille, offset]);

    return NextResponse.json(
      {
        etudiants: result.rows.map(({ totalResultats, ...ligne }) => ligne),
        pagination: construirePagination({
          page, taille, total: result.rows[0]?.totalResultats ?? 0
        })
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur recherche candidats:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}