import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const STATUTS_VALIDES = ['En attente', 'Recruté', 'Refusé'];

export async function PATCH(req, { params }) {
  const { idCandidature } = await params;
  const client = await pool.connect();

  try {
    // === Auth : entreprise uniquement ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEntreprise = payload.idEntreprise;
    const body = await req.json();
    const { statut } = body;

    if (!statut || !STATUTS_VALIDES.includes(statut)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}` },
        { status: 400 }
      );
    }

    // Met à jour SEULEMENT si la candidature appartient à une offre de cette entreprise
    const result = await client.query(`
      UPDATE "Candidature" c
      SET "statut" = $1
      FROM offre o
      WHERE c."idCandidature" = $2
        AND c."idOffre" = o."idOffre"
        AND o."idEntreprise" = $3
      RETURNING c."idCandidature", c."statut"
    `, [statut, idCandidature, idEntreprise]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Candidature introuvable ou ne vous appartient pas" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Statut mis à jour', candidature: result.rows[0] },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}