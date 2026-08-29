import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// === Helper : vérifier que l'université connectée possède bien l'annonce ===
async function verifierProprietaire(client, idAnnonce, idUniversite) {
  const result = await client.query(
    'SELECT "idUniversite" FROM "AnnonceCohorte" WHERE "idAnnonceCohorte" = $1',
    [idAnnonce]
  );
  if (result.rows.length === 0) {
    return { ok: false, status: 404, error: 'Annonce introuvable' };
  }
  if (parseInt(result.rows[0].idUniversite) !== parseInt(idUniversite)) {
    return { ok: false, status: 403, error: "Vous n'êtes pas propriétaire de cette annonce" }; 
  }
  return { ok: true };
}

// =====================================================================
// GET : charger une annonce + ses étudiants (pour modification)
// =====================================================================
export async function GET(req, { params }) {
  const client = await pool.connect();
  try {
    const { idAnnonce } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const check = await verifierProprietaire(client, idAnnonce, payload.idUniversite);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const annonceResult = await client.query(
      'SELECT * FROM "AnnonceCohorte" WHERE "idAnnonceCohorte" = $1',
      [idAnnonce]
    );

    const etudiantsResult = await client.query(`
      SELECT e."idEtudiant", e."nomEtudiant" AS "nom", e."prenomEtudiant" AS "prenom",
             e."niveauAcademique", e."filiere", e."specialisation"
        FROM etudiant e
        JOIN "AnnonceCohorte" a ON a."idPromotion" = e."idPromotion"
       WHERE a."idAnnonceCohorte" = $1
         AND COALESCE(e."statutRattachement", 'Valide') = 'Valide'
       ORDER BY e."nomEtudiant"
    `, [idAnnonce]);

    return NextResponse.json({
      annonce: annonceResult.rows[0],
      etudiants: etudiantsResult.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET annonce cohorte:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

// =====================================================================
// PATCH : modifier une annonce + actions sur les étudiants
// =====================================================================
export async function PATCH(req, { params }) {
  const client = await pool.connect();
  try {
    const { idAnnonce } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const check = await verifierProprietaire(client, idAnnonce, payload.idUniversite);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await req.json();
    const {
      titre, description, filiereConcernee, niveauAcademique,
      domainesRecherche, periodeDebut, periodeFin, dureeStage,
      villePreferee, accepteTeletravail, dateLimite, statut,
      idPromotion       // la promotion concernée, ou null
    } = body;

    await client.query('BEGIN');

    // 1. Mise à jour de l'annonce
    await client.query(`
      UPDATE "AnnonceCohorte" SET
        "titre" = COALESCE($1, "titre"),
        "description" = $2,
        "filiereConcernee" = $3,
        "niveauAcademique" = $4,
        "domainesRecherche" = $5,
        "periodeDebut" = $6,
        "periodeFin" = $7,
        "dureeStage" = $8,
        "villePreferee" = $9,
        "accepteTeletravail" = $10,
        "dateLimite" = $11,
        "statut" = COALESCE($12, "statut"),
        "idPromotion" = $13
      WHERE "idAnnonceCohorte" = $14
    `, [
      titre, description || null, filiereConcernee || null,
      niveauAcademique || null, domainesRecherche || null,
      periodeDebut || null, periodeFin || null,
      dureeStage || null, villePreferee || null,
      accepteTeletravail || null, dateLimite || null,
      statut,
      /* La promotion doit appartenir à l'établissement qui édite. */
      idPromotion
        ? (await client.query(
            'SELECT "idPromotion" FROM "Promotion" WHERE "idPromotion" = $1 AND "idUniversite" = $2',
            [idPromotion, payload.idUniversite])).rows[0]?.idPromotion || null
        : null,
      idAnnonce
    ]);

    /* Plus d'actions sur des étudiants saisis à la main : l'annonce
       DÉSIGNE une promotion, dont les membres sont de vrais comptes.
       Modifier la composition se fait dans la promotion, pas dans
       l'annonce — sans quoi les deux divergeraient. */

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Annonce mise à jour avec succès'
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur PATCH annonce cohorte:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =====================================================================
// DELETE : supprimer une annonce (et ses étudiants via CASCADE)
// =====================================================================
export async function DELETE(req, { params }) {
  const client = await pool.connect();
  try {
    const { idAnnonce } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const check = await verifierProprietaire(client, idAnnonce, payload.idUniversite);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    // ON DELETE CASCADE supprime aussi les étudiants externes liés
    await client.query(
      'DELETE FROM "AnnonceCohorte" WHERE "idAnnonceCohorte" = $1',
      [idAnnonce]
    );

    return NextResponse.json({
      success: true,
      message: 'Annonce supprimée avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur DELETE annonce cohorte:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}