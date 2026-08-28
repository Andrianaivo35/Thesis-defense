import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { supprimerFichier } from '@/lib/stockage';

function authentifierEtudiant(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload || payload.typeUtilisateur !== 'Etudiant') return null;
  return payload;
}

/* Vérifie que le CV appartient bien à l'étudiant connecté. */
async function verifierProprietaire(client, idCV, idEtudiant) {
  const result = await client.query(
    'SELECT "idCV", "nomFichier", "estPrincipal" FROM "CV" WHERE "idCV" = $1 AND "idEtudiant" = $2',
    [idCV, idEtudiant]
  );
  return result.rows[0] || null;
}

/* =====================================================================
   PATCH : renommer un CV ou le définir comme principal
   Corps : { libelle? , estPrincipal? }
   ===================================================================== */
export async function PATCH(req, { params }) {
  const client = await pool.connect();
  try {
    const payload = authentifierEtudiant(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { idCV } = await params;
    const { libelle, estPrincipal } = await req.json();

    const cv = await verifierProprietaire(client, idCV, payload.idEtudiant);
    if (!cv) return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });

    await client.query('BEGIN');

    /* Un seul CV principal : l'index unique en base l'impose, il faut donc
       retirer le drapeau de l'ancien avant de le poser sur le nouveau. */
    if (estPrincipal === true) {
      await client.query(
        'UPDATE "CV" SET "estPrincipal" = false WHERE "idEtudiant" = $1 AND "estPrincipal"',
        [payload.idEtudiant]
      );
    }

    const result = await client.query(`
      UPDATE "CV" SET
        "libelle" = COALESCE($1, "libelle"),
        "estPrincipal" = COALESCE($2, "estPrincipal")
      WHERE "idCV" = $3 AND "idEtudiant" = $4
      RETURNING "idCV", "libelle", "estPrincipal"
    `, [
      libelle?.trim() || null,
      typeof estPrincipal === 'boolean' ? estPrincipal : null,
      idCV, payload.idEtudiant
    ]);

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, message: 'CV mis à jour', cv: result.rows[0] },
      { status: 200 }
    );

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur modification CV:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

/* =====================================================================
   DELETE : retirer un CV de la bibliothèque

   Les candidatures déjà envoyées ne sont pas supprimées : la clé
   étrangère est en ON DELETE SET NULL, l'historique est conservé.
   Le fichier n'est effacé du volume que si aucune candidature ne s'y
   réfère, afin qu'une entreprise puisse encore consulter le dossier
   qu'elle a reçu.
   ===================================================================== */
export async function DELETE(req, { params }) {
  const client = await pool.connect();
  try {
    const payload = authentifierEtudiant(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { idCV } = await params;

    const cv = await verifierProprietaire(client, idCV, payload.idEtudiant);
    if (!cv) return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });

    const utilisations = await client.query(
      'SELECT COUNT(*)::int AS total FROM "Candidature" WHERE "idCV" = $1',
      [idCV]
    );
    const estUtilise = utilisations.rows[0].total > 0;

    await client.query('BEGIN');
    await client.query('DELETE FROM "CV" WHERE "idCV" = $1 AND "idEtudiant" = $2',
      [idCV, payload.idEtudiant]);

    /* Si le CV supprimé était le principal, on promeut le plus récent des
       CV restants pour que l'étudiant garde toujours un CV par défaut. */
    if (cv.estPrincipal) {
      await client.query(`
        UPDATE "CV" SET "estPrincipal" = true
        WHERE "idCV" = (
          SELECT "idCV" FROM "CV" WHERE "idEtudiant" = $1
          ORDER BY "dateAjout" DESC LIMIT 1
        )
      `, [payload.idEtudiant]);
    }

    await client.query('COMMIT');

    if (!estUtilise) {
      await supprimerFichier('cv', cv.nomFichier);
    }

    return NextResponse.json(
      {
        success: true,
        message: estUtilise
          ? 'CV retiré de votre bibliothèque. Il reste consultable par les entreprises auxquelles vous l\'avez déjà envoyé.'
          : 'CV supprimé'
      },
      { status: 200 }
    );

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur suppression CV:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
