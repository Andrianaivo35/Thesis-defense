import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// =====================================================================
// === GET : charger toutes les infos modifiables de l'entreprise ===
// =====================================================================
export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEntreprise = payload.idEntreprise;

    const result = await client.query(`
      SELECT 
        "idEntreprise",
        "nomEntreprise",
        "description",
        "secteurActivitePrincipal",
        "formeJuridique",
        "adresseSiegeSocial",
        "telephonePrincipal",
        "telephoneSecondaire",
        "siteWeb",
        "reseauxSociaux",
        "logo",
        "estVerifie",
        "dateInscription"
      FROM entreprise
      WHERE "idEntreprise" = $1
    `, [idEntreprise]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    return NextResponse.json({
      entreprise: result.rows[0]
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET entrepriseModifierProfil:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// =====================================================================
// === PATCH : sauvegarder les modifications ===
// =====================================================================
export async function PATCH(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEntreprise = payload.idEntreprise;
    const body = await req.json();

    const {
      nomEntreprise, description, secteurActivitePrincipal, formeJuridique,
      adresseSiegeSocial, telephonePrincipal, telephoneSecondaire,
      siteWeb, reseauSociaux, logo
    } = body;

    await client.query(`
      UPDATE entreprise SET
        "nomEntreprise" = COALESCE($1, "nomEntreprise"),
        "description" = $2,
        "secteurActivitePrincipal" = COALESCE($3, "secteurActivitePrincipal"),
        "formeJuridique" = COALESCE($4, "formeJuridique"),
        "adresseSiegeSocial" = COALESCE($5, "adresseSiegeSocial"),
        "telephonePrincipal" = COALESCE($6, "telephonePrincipal"),
        "telephoneSecondaire" = $7,
        "siteWeb" = $8,
        "reseauxSociaux" = $9,
        "logo" = $10
      WHERE "idEntreprise" = $11
    `, [
      nomEntreprise,
      description || null,
      secteurActivitePrincipal,
      formeJuridique,
      adresseSiegeSocial,
      telephonePrincipal,
      telephoneSecondaire || null,
      siteWeb || null,
      reseauSociaux || null,
      logo || null,
      idEntreprise
    ]);

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur PATCH entrepriseModifierProfil:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}