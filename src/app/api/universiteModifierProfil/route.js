import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// =====================================================================
// GET : charger toutes les infos modifiables de l'université connectée
// =====================================================================
export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idUniversite = payload.idUniversite;

    const result = await client.query(`
      SELECT 
        "idUniversite",
        "nomUniversite",
        "sigleUniversitaire",
        "adresseUniversite",
        "ville",
        "telephoneUniversite",
        "siteWeb",
        "logo",
        "estVerifie",
        "dateInscription"
      FROM universite
      WHERE "idUniversite" = $1
    `, [idUniversite]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Université introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      universite: result.rows[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET universiteModifierProfil:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// =====================================================================
// PATCH : sauvegarder les modifications
// =====================================================================
export async function PATCH(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idUniversite = payload.idUniversite;
    const body = await req.json();

    const {
      nomUniversite, sigleUniversitaire, adresseUniversite, ville,
      telephoneUniversite, siteWeb, logo
    } = body;

    await client.query(`
      UPDATE universite SET
        "nomUniversite" = COALESCE($1, "nomUniversite"),
        "sigleUniversitaire" = $2,
        "adresseUniversite" = $3,
        "ville" = $4,
        "telephoneUniversite" = $5,
        "siteWeb" = $6,
        "logo" = $7
      WHERE "idUniversite" = $8
    `, [
      nomUniversite,
      sigleUniversitaire || null,
      adresseUniversite || null,
      ville || null,
      telephoneUniversite || null,
      siteWeb || null,
      logo || null,
      idUniversite
    ]);

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur PATCH universiteModifierProfil:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}