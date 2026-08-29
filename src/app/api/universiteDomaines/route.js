import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { DOMAINES } from '@/lib/referentiels';

/* =====================================================================
   /api/universiteDomaines — les domaines enseignés par l'établissement

   GET  la liste actuelle
   PUT  la remplacer

   L'université est maîtresse de sa liste. Les domaines déduits des
   étudiants déjà rattachés (migration 014) ne sont qu'une amorce : un
   établissement pluridisciplinaire dont un seul étudiant s'est inscrit
   paraîtrait monodisciplinaire, et se verrait refuser les suivants.
   ===================================================================== */

const DOMAINES_CONNUS = DOMAINES.map(d => d.libelle);

function authentifier(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload || payload.typeUtilisateur !== 'Universite') return null;
  return payload;
}

export async function GET(req) {
  const client = await pool.connect();
  try {
    const payload = authentifier(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { rows } = await client.query(
      'SELECT "domaine" FROM "UniversiteDomaine" WHERE "idUniversite" = $1 ORDER BY "domaine"',
      [payload.idUniversite]
    );

    /* On renvoie aussi ce que les étudiants déjà rattachés révèlent :
       l'université voit ainsi si sa déclaration est en retard sur la
       réalité, plutôt que de refuser des inscriptions sans comprendre
       pourquoi. */
    const observes = await client.query(
      `SELECT DISTINCT "filiere" AS domaine FROM etudiant
        WHERE "idUniversite" = $1 AND "filiere" IS NOT NULL ORDER BY 1`,
      [payload.idUniversite]
    );

    return NextResponse.json({
      domaines: rows.map(r => r.domaine),
      observes: observes.rows.map(r => r.domaine),
      disponibles: DOMAINES_CONNUS
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lecture des domaines :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req) {
  const client = await pool.connect();
  try {
    const payload = authentifier(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { domaines } = await req.json();
    if (!Array.isArray(domaines)) {
      return NextResponse.json({ error: 'Liste de domaines attendue.' }, { status: 400 });
    }

    /* Filtrés contre le référentiel : un domaine libre rouvrirait
       exactement le problème que cette table ferme. */
    const retenus = [...new Set(domaines.filter(d => DOMAINES_CONNUS.includes(d)))];

    await client.query('BEGIN');
    await client.query('DELETE FROM "UniversiteDomaine" WHERE "idUniversite" = $1',
      [payload.idUniversite]);
    for (const domaine of retenus) {
      await client.query(
        'INSERT INTO "UniversiteDomaine" ("idUniversite", "domaine") VALUES ($1, $2)',
        [payload.idUniversite, domaine]);
    }
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      domaines: retenus,
      message: retenus.length === 0
        ? "Aucun domaine déclaré : les étudiants pourront choisir librement leur filière."
        : `${retenus.length} domaine${retenus.length > 1 ? 's' : ''} déclaré${retenus.length > 1 ? 's' : ''}. ` +
          `Les étudiants qui vous choisissent ne verront que ${retenus.length > 1 ? 'ces filières' : 'cette filière'}.`
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur mise à jour des domaines :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
