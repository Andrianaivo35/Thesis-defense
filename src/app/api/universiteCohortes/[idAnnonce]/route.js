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

    if (!payload || payload.typeUtilisateur !== 'Université') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const check = await verifierProprietaire(client, idAnnonce, payload.idUniversite);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const annonceResult = await client.query(
      'SELECT * FROM "AnnonceCohorte" WHERE "idAnnonceCohorte" = $1',
      [idAnnonce]
    );

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
    console.error('Erreur GET annonce cohorte:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
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

    if (!payload || payload.typeUtilisateur !== 'Université') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const check = await verifierProprietaire(client, idAnnonce, payload.idUniversite);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await req.json();
    const {
      titre, description, filiereConcernee, niveauAcademique,
      domainesRecherche, periodeDebut, periodeFin, dureeStage,
      villePreferee, accepteTeletravail, dateLimite, statut,
      etudiantsActions  // [{ action: 'create'|'update'|'delete', id, data }]
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
        "statut" = COALESCE($12, "statut")
      WHERE "idAnnonceCohorte" = $13
    `, [
      titre, description || null, filiereConcernee || null,
      niveauAcademique || null, domainesRecherche || null,
      periodeDebut || null, periodeFin || null,
      dureeStage || null, villePreferee || null,
      accepteTeletravail || null, dateLimite || null,
      statut, idAnnonce
    ]);

    // 2. Actions sur les étudiants
    if (Array.isArray(etudiantsActions)) {
      for (const a of etudiantsActions) {
        if (a.action === 'create' && a.data?.nom?.trim() && a.data?.prenom?.trim()) {
          await client.query(`
            INSERT INTO "EtudiantExterne" (
              "idAnnonceCohorte", "nom", "prenom", "email", "cvPdf"
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            idAnnonce,
            a.data.nom.trim(),
            a.data.prenom.trim(),
            a.data.email?.trim() || null,
            a.data.cvPdf || null
          ]);
        } else if (a.action === 'update' && a.id) {
          await client.query(`
            UPDATE "EtudiantExterne" SET
              "nom" = $1, "prenom" = $2, "email" = $3, "cvPdf" = $4
            WHERE "idEtudiantExterne" = $5 AND "idAnnonceCohorte" = $6
          `, [
            a.data.nom, a.data.prenom,
            a.data.email || null, a.data.cvPdf || null,
            a.id, idAnnonce
          ]);
        } else if (a.action === 'delete' && a.id) {
          await client.query(`
            DELETE FROM "EtudiantExterne"
            WHERE "idEtudiantExterne" = $1 AND "idAnnonceCohorte" = $2
          `, [a.id, idAnnonce]);
        }
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Annonce mise à jour avec succès'
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur PATCH annonce cohorte:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour', details: error.message },
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

    if (!payload || payload.typeUtilisateur !== 'Université') {
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
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}