import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import {
  trouverOuCreerPromotion, estAnneeValide, anneeUniversitaireCourante,
  STATUTS_PROMOTION
} from '@/lib/promotions';

/* =====================================================================
   /api/universitePromotions — les promotions d'un établissement

   GET    la liste, avec les effectifs
   POST   créer une promotion
   PATCH  renommer une promotion, ou changer son statut
   ===================================================================== */

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

    /* Les effectifs sont calculés ici plutôt que côté interface : c'est
       ce qui permet à l'écran d'afficher « L3 Informatique — 78
       étudiants, 12 en stage » sans charger les 78 profils. */
    const { rows } = await client.query(`
      SELECT p.*,
             /* DISTINCT est indispensable : la jointure sur les
                candidatures multiplie les lignes d'un même étudiant, et
                un COUNT simple annonçait 15 inscrits là où il y en avait
                3. L'écart n'apparaît que sur des données réelles — un
                corpus sans candidature aurait laissé passer le défaut. */
             COUNT(DISTINCT e."idEtudiant")::int AS "effectif",
             COUNT(DISTINCT e."idEtudiant") FILTER (
               WHERE u."compteActive" = false)::int AS "enAttenteActivation",
             COUNT(DISTINCT c."idEtudiant") FILTER (
               WHERE c."statut" = 'Recruté')::int AS "enStage"
        FROM "Promotion" p
        LEFT JOIN etudiant e ON e."idPromotion" = p."idPromotion"
        LEFT JOIN utilisateur u ON u."idUtilisateur" = e."idUtilisateur"
        LEFT JOIN "Candidature" c ON c."idEtudiant" = e."idEtudiant"
       WHERE p."idUniversite" = $1
       GROUP BY p."idPromotion"
       ORDER BY p."annee" DESC, p."libelle" ASC
    `, [payload.idUniversite]);

    /* Les étudiants rattachés à l'établissement mais à aucune promotion :
       ceux inscrits d'eux-mêmes, ou importés avant ce lot. Les passer
       sous silence les rendrait invisibles dans un écran organisé par
       promotion. */
    const sansPromotion = await client.query(`
      SELECT COUNT(*)::int AS n FROM etudiant
       WHERE "idUniversite" = $1 AND "idPromotion" IS NULL
         AND COALESCE("statutRattachement", 'Valide') = 'Valide'
    `, [payload.idUniversite]);

    return NextResponse.json({
      promotions: rows,
      sansPromotion: sansPromotion.rows[0].n,
      anneeCourante: anneeUniversitaireCourante()
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur liste des promotions :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const payload = authentifier(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { libelle, annee, niveauAcademique, filiere, specialisation } = await req.json();

    if (!libelle?.trim()) {
      return NextResponse.json(
        { error: 'Donnez un nom à cette promotion, par exemple « L3 Informatique ».' },
        { status: 400 }
      );
    }
    if (!estAnneeValide(annee)) {
      return NextResponse.json(
        { error: "L'année universitaire doit être de la forme « 2025-2026 »." },
        { status: 400 }
      );
    }

    await client.query('BEGIN');
    const promotion = await trouverOuCreerPromotion(client, {
      idUniversite: payload.idUniversite,
      libelle: libelle.trim(), annee,
      niveauAcademique: niveauAcademique || null,
      filiere: filiere || null,
      specialisation: specialisation || null
    });
    await client.query('COMMIT');

    return NextResponse.json({ success: true, promotion }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur création de promotion :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(req) {
  const client = await pool.connect();
  try {
    const payload = authentifier(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { idPromotion, libelle, statut } = await req.json();

    if (statut && !STATUTS_PROMOTION.includes(statut)) {
      return NextResponse.json({ error: 'Statut de promotion inconnu.' }, { status: 400 });
    }

    /* La clause sur "idUniversite" n'est pas décorative : sans elle, un
       identifiant deviné permettrait de renommer la promotion d'un autre
       établissement. */
    const { rows } = await client.query(`
      UPDATE "Promotion"
         SET "libelle" = COALESCE($3, "libelle"),
             "statut"  = COALESCE($4, "statut")
       WHERE "idPromotion" = $1 AND "idUniversite" = $2
       RETURNING *`,
      [idPromotion, payload.idUniversite, libelle?.trim() || null, statut || null]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Promotion introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, promotion: rows[0] }, { status: 200 });

  } catch (error) {
    console.error('Erreur modification de promotion :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
