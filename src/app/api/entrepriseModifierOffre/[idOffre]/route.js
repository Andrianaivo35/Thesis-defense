import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// === Helper : vérifie que l'entreprise connectée possède bien cette offre ===
async function verifierProprietaire(client, idOffre, idEntreprise) {
  const result = await client.query(
    'SELECT "idEntreprise" FROM offre WHERE "idOffre" = $1',
    [idOffre]
  );
  if (result.rows.length === 0) return { ok: false, status: 404, error: 'Offre introuvable' };
  if (parseInt(result.rows[0].idEntreprise) !== parseInt(idEntreprise)) {
    return { ok: false, status: 403, error: "Vous n'êtes pas propriétaire de cette offre" };
  }
  return { ok: true };
}

// =====================================================================
// === GET : charger toutes les infos de l'offre pour pré-remplir ===
// =====================================================================
export async function GET(req, { params }) {
  const client = await pool.connect();
  try {
    const { idOffre } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const check = await verifierProprietaire(client, idOffre, payload.idEntreprise);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    // 1. Infos générales de l'offre
    const offreResult = await client.query(
      'SELECT * FROM offre WHERE "idOffre" = $1',
      [idOffre]
    );

    // 2. Compétences requises
    const competencesResult = await client.query(`
      SELECT 
        co."idCompetenceOffre",
        co."idCompetenceReference",
        co."niveauSouhaitee",
        co."estObligatoire",
        cr."nomCompetenceReference" AS "nom",
        cr."categorieCompetenceReference" AS "categorie"
      FROM "CompetenceOffre" co
      INNER JOIN "CompetenceReference" cr ON co."idCompetenceReference" = cr."idCompetenceReference"
      WHERE co."idOffre" = $1
      ORDER BY co."idCompetenceOffre" ASC
    `, [idOffre]);

    // 3. QCM associé (s'il existe)
    const qcmResult = await client.query(
      'SELECT * FROM "QCM" WHERE "idOffre" = $1',
      [idOffre]
    );

    let questions = [];
    if (qcmResult.rows.length > 0) {
      const idQcm = qcmResult.rows[0].idQCM;
      const questionsResult = await client.query(`
        SELECT 
            q."idQuestion", q."enonce", q."points",
            COALESCE(
            json_agg(
                json_build_object(
                'idChoix', cr."idChoix",
                'enonce', cr."enonce",
                'estCorrect', cr."estCorrect"
                ) ORDER BY cr."idChoix" ASC
            ) FILTER (WHERE cr."idChoix" IS NOT NULL),
            '[]'::json
            ) AS choix
        FROM "Question" q
        LEFT JOIN "ChoixReponse" cr ON q."idQuestion" = cr."idQuestion"
        WHERE q."idQCM" = $1
        GROUP BY q."idQuestion"
        ORDER BY q."idQuestion" ASC
        `, [idQcm]);
      questions = questionsResult.rows;
    }

    return NextResponse.json({
      offre: offreResult.rows[0],
      competences: competencesResult.rows,
      qcm: qcmResult.rows[0] || null,
      questions
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET entrepriseModifierOffre:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// =====================================================================
// === PATCH : sauvegarder les modifications ===
// =====================================================================
export async function PATCH(req, { params }) {
  const client = await pool.connect();
  try {
    const { idOffre } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const check = await verifierProprietaire(client, idOffre, payload.idEntreprise);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await req.json();
    const {
      // Infos offre
      titre, description, domaine, ville, lieu,
      typeStage, niveauRequis, duree, accepteTeletravail,
      remuneration, dateDebut, dateFin, dateLimites, statut,
      // Actions sur compétences
      competencesActions,   // [{ action, id, data: { idCompetenceReference, niveauSouhaitee, estObligatoire } }]
      // Actions sur questions du QCM
      qcmInfo,              // { titre, description, duree }
      questionsActions      // [{ action, id, data: { enonce, points, choix: [...] } }]
    } = body;

    await client.query('BEGIN');

    // === 1. Mise à jour de l'offre (champs COALESCE pour préserver l'existant si non fourni) ===
    await client.query(`
      UPDATE offre SET
        "titre" = COALESCE($1, "titre"),
        "description" = COALESCE($2, "description"),
        "domaine" = COALESCE($3, "domaine"),
        "ville" = COALESCE($4, "ville"),
        "lieu" = COALESCE($5, "lieu"),
        "typeStage" = COALESCE($6, "typeStage"),
        "niveauRequis" = COALESCE($7, "niveauRequis"),
        "duree" = COALESCE($8, "duree"),
        "accepteTeletravail" = COALESCE($9, "accepteTeletravail"),
        "remuneration" = COALESCE($10, "remuneration"),
        "dateDebut" = COALESCE($11, "dateDebut"),
        "dateFin" = COALESCE($12, "dateFin"),
        "dateLimites" = COALESCE($13, "dateLimites"),
        "statut" = COALESCE($14, "statut")
      WHERE "idOffre" = $15
    `, [
      titre, description, domaine, ville, lieu,
      typeStage, niveauRequis, duree, accepteTeletravail,
      remuneration,
      dateDebut || null, dateFin || null, dateLimites || null,
      statut,
      idOffre
    ]);

    // === 2. Compétences (gestion intelligente create/update/delete) ===
    if (Array.isArray(competencesActions)) {
      for (const a of competencesActions) {
        if (a.action === 'create' && a.data?.idCompetenceReference) {
          await client.query(`
            INSERT INTO "CompetenceOffre" (
              "idOffre", "idCompetenceReference", "niveauSouhaitee", "estObligatoire"
            ) VALUES ($1, $2, $3, $4)
          `, [
            idOffre, parseInt(a.data.idCompetenceReference),
            a.data.niveauSouhaitee || 'Débutant',
            a.data.estObligatoire === true
          ]);
        } else if (a.action === 'update' && a.id) {
          await client.query(`
            UPDATE "CompetenceOffre" SET
              "niveauSouhaitee" = $1,
              "estObligatoire" = $2
            WHERE "idCompetenceOffre" = $3 AND "idOffre" = $4
          `, [
            a.data.niveauSouhaitee || 'Débutant',
            a.data.estObligatoire === true,
            a.id, idOffre
          ]);
        } else if (a.action === 'delete' && a.id) {
          await client.query(`
            DELETE FROM "CompetenceOffre"
            WHERE "idCompetenceOffre" = $1 AND "idOffre" = $2
          `, [a.id, idOffre]);
        }
      }
    }

    // === 3. QCM : infos générales (titre, description, durée) ===
    let idQcm = null;
    const qcmExistant = await client.query(
      'SELECT "idQCM" FROM "QCM" WHERE "idOffre" = $1',
      [idOffre]
    );

    if (qcmExistant.rows.length > 0) {
      idQcm = qcmExistant.rows[0].idQCM;
      if (qcmInfo) {
        await client.query(`
          UPDATE "QCM" SET
            "titre" = COALESCE($1, "titre"),
            "description" = COALESCE($2, "description"),
            "duree" = COALESCE($3, "duree")
          WHERE "idQCM" = $4
        `, [qcmInfo.titre, qcmInfo.description, qcmInfo.duree, idQcm]);
      }
    } else if (qcmInfo && (qcmInfo.titre || qcmInfo.description)) {
      // Créer un nouveau QCM si pas existant et qu'on en ajoute un
      const newQcm = await client.query(`
        INSERT INTO "QCM" ("idOffre", "titre", "description", "duree")
        VALUES ($1, $2, $3, $4)
        RETURNING "idQCM"
      `, [idOffre, qcmInfo.titre || 'QCM', qcmInfo.description || '', qcmInfo.duree || null]);
      idQcm = newQcm.rows[0].idQCM;
    }

    // === 4. Questions du QCM (gestion intelligente) ===
    if (Array.isArray(questionsActions) && idQcm) {
      for (const a of questionsActions) {
        if (a.action === 'create' && a.data?.enonce?.trim()) {
          // Créer la question
          const newQ = await client.query(`
            INSERT INTO "Question" ("idQCM", "enonce", "points")
            VALUES ($1, $2, $3)
            RETURNING "idQuestion"
          `, [idQcm, a.data.enonce.trim(), parseInt(a.data.points) || 1]);
          const idQuestion = newQ.rows[0].idQuestion;
          // Créer les choix de réponse
          if (Array.isArray(a.data.choix)) {
            for (const c of a.data.choix) {
              if (c.enonce?.trim()) {
                await client.query(`
                  INSERT INTO "ChoixReponse" ("idQuestion", "enonce", "estCorrect")
                  VALUES ($1, $2, $3)
                `, [idQuestion, c.enonce.trim(), c.estCorrect === true]);
              }
            }
          }
        } else if (a.action === 'update' && a.id) {
          // Mettre à jour la question
          await client.query(`
            UPDATE "Question" SET
              "enonce" = $1, "points" = $2
            WHERE "idQuestion" = $3 AND "idQCM" = $4
          `, [a.data.enonce, parseInt(a.data.points) || 1, a.id, idQcm]);
          // Remplacer tous les choix (plus simple que update individuel)
          await client.query('DELETE FROM "ChoixReponse" WHERE "idQuestion" = $1', [a.id]);
          if (Array.isArray(a.data.choix)) {
            for (const c of a.data.choix) {
              if (c.enonce?.trim()) {
                await client.query(`
                  INSERT INTO "ChoixReponse" ("idQuestion", "enonce", "estCorrect")
                  VALUES ($1, $2, $3)
                `, [a.id, c.enonce.trim(), c.estCorrect === true]);
              }
            }
          }
        } else if (a.action === 'delete' && a.id) {
          // Supprimer la question (les choix sont supprimés en cascade si ON DELETE CASCADE)
          await client.query('DELETE FROM "ChoixReponse" WHERE "idQuestion" = $1', [a.id]);
          await client.query(`
            DELETE FROM "Question"
            WHERE "idQuestion" = $1 AND "idQCM" = $2
          `, [a.id, idQcm]);
        }
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Offre mise à jour avec succès'
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur PATCH entrepriseModifierOffre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// =====================================================================
// === DELETE : supprimer définitivement l'offre ===
// =====================================================================
export async function DELETE(req, { params }) {
  const client = await pool.connect();
  try {
    const { idOffre } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const check = await verifierProprietaire(client, idOffre, payload.idEntreprise);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

    await client.query('BEGIN');

    // 1. Récupérer l'idQCM si existe
    const qcmResult = await client.query(
      'SELECT "idQCM" FROM "QCM" WHERE "idOffre" = $1',
      [idOffre]
    );

    // 2. Supprimer questions et choix du QCM
    if (qcmResult.rows.length > 0) {
      const idQcm = qcmResult.rows[0].idQCM;
      const questionsResult = await client.query(
        'SELECT "idQuestion" FROM "Question" WHERE "idQCM" = $1',
        [idQcm]
      );
      for (const q of questionsResult.rows) {
        await client.query('DELETE FROM "ChoixReponse" WHERE "idQuestion" = $1', [q.idQuestion]);
      }
      await client.query('DELETE FROM "Question" WHERE "idQCM" = $1', [idQcm]);
      await client.query('DELETE FROM "QCM" WHERE "idQCM" = $1', [idQcm]);
    }

    // 3. Supprimer les compétences
    await client.query('DELETE FROM "CompetenceOffre" WHERE "idOffre" = $1', [idOffre]);

    // 4. Supprimer les candidatures et leurs réponses
    const candResult = await client.query(
      'SELECT "idCandidature" FROM "Candidature" WHERE "idOffre" = $1',
      [idOffre]
    );
    for (const c of candResult.rows) {
      await client.query('DELETE FROM "ReponseEtudiant" WHERE "idCandidature" = $1', [c.idCandidature]);
    }
    await client.query('DELETE FROM "Candidature" WHERE "idOffre" = $1', [idOffre]);

    // 5. Supprimer l'offre elle-même
    await client.query('DELETE FROM offre WHERE "idOffre" = $1', [idOffre]);

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Offre supprimée avec succès'
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur DELETE entrepriseModifierOffre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}