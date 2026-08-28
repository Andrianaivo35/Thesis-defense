import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function POST(req) {
  const client = await pool.connect();

  try {
    // === Authentification ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEntreprise = payload.idEntreprise;

    // === Récupération des données ===
    const {
      // Offre
      titre, description, domaine, niveauRequis, duree,
      dateDebut, dateFin, remuneration, lieu, ville,
      accepteTeletravail, typeStage, dateLimites,
      // Compétences
      competences,  // [{ nom, categorie, niveauSouhaitee, estObligatoire }]
      // QCM
      qcm  // { titre, description, duree, noteMinimal, questions: [...] }
    } = await req.json();

    // === Validations ===
    if (!titre || !description) {
      return NextResponse.json({ error: 'Titre et description requis' }, { status: 400 });
    }

    if (!qcm || !Array.isArray(qcm.questions) || qcm.questions.length === 0) {
      return NextResponse.json({ error: 'Au moins une question requise' }, { status: 400 });
    }

    for (let i = 0; i < qcm.questions.length; i++) {
      const q = qcm.questions[i];
      if (!q.enonce || q.enonce.trim() === '') {
        return NextResponse.json({ error: `Question ${i + 1} : énoncé manquant` }, { status: 400 });
      }
      if (!Array.isArray(q.choix) || q.choix.length < 2) {
        return NextResponse.json({ error: `Question ${i + 1} : au moins 2 choix requis` }, { status: 400 });
      }
      if (q.choix.filter(c => c.estCorrect === true).length !== 1) {
        return NextResponse.json({ error: `Question ${i + 1} : exactement une bonne réponse` }, { status: 400 });
      }
    }

    await client.query('BEGIN');

    // === 1. Création de l'offre ===
    const offreResult = await client.query(
      `INSERT INTO offre (
        "idEntreprise", "titre", "description", "domaine", "niveauRequis",
        "duree", "dateDebut", "dateFin", "remuneration", "lieu", "ville",
        "accepteTeletravail", "typeStage", "statut", "datePublication", "dateLimites"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, $15)
      RETURNING "idOffre"`,
      [
        idEntreprise, titre, description, domaine || null, niveauRequis || null,
        duree || null, dateDebut || null, dateFin || null, remuneration || null,
        lieu || null, ville || null, accepteTeletravail || null, typeStage || null,
        'Active', dateLimites || null
      ]
    );

    const idOffre = offreResult.rows[0].idOffre;

    /* === 2. Rattachement des compétences ===
       Seules les compétences du référentiel sont acceptées. Aucune n'est plus
       créée à la volée : c'est ce qui produisait des doublons ("JavaScript",
       "Javascript", "JS") et rendait le référentiel inexploitable. */
    if (Array.isArray(competences) && competences.length > 0) {
      const dejaLiees = new Set();

      for (const comp of competences) {
        const idCompetenceReference = parseInt(comp.idCompetenceReference, 10);
        if (!idCompetenceReference || isNaN(idCompetenceReference)) continue;

        // Ignorer un doublon envoyé par le formulaire
        if (dejaLiees.has(idCompetenceReference)) continue;

        // Vérifier que la compétence existe bien dans le référentiel
        const existante = await client.query(
          `SELECT 1 FROM "CompetenceReference" WHERE "idCompetenceReference" = $1`,
          [idCompetenceReference]
        );

        if (existante.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'Compétence inconnue dans le référentiel' },
            { status: 400 }
          );
        }

        dejaLiees.add(idCompetenceReference);

        await client.query(
          `INSERT INTO "CompetenceOffre" (
            "idOffre", "idCompetenceReference", "niveauSouhaitee", "estObligatoire"
          ) VALUES ($1, $2, $3, $4)`,
          [
            idOffre,
            idCompetenceReference,
            comp.niveauSouhaitee || 'Débutant',
            comp.estObligatoire === true
          ]
        );
      }
    }

    // === 3. Création du QCM ===
    const qcmResult = await client.query(
      `INSERT INTO "QCM" (
        "idOffre", "titre", "description", "duree", "noteMinimal", "dateCreation", "estActif"
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
      RETURNING "idQCM"`,
      [
        idOffre,
        qcm.titre || `QCM - ${titre}`,
        qcm.description || null,
        qcm.duree || null,
        qcm.noteMinimal || 0,
        true
      ]
    );

    const idQCM = qcmResult.rows[0].idQCM;

    // === 4. Questions + choix ===
    for (let i = 0; i < qcm.questions.length; i++) {
      const q = qcm.questions[i];

      const questionResult = await client.query(
        `INSERT INTO "Question" (
          "idQCM", "enonce", "ordre", "points", "explication"
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING "idQuestion"`,
        [idQCM, q.enonce.trim(), i, q.points || 1, q.explication || null]
      );

      const idQuestion = questionResult.rows[0].idQuestion;

      for (let j = 0; j < q.choix.length; j++) {
        const c = q.choix[j];
        await client.query(
          `INSERT INTO "ChoixReponse" (
            "idQuestion", "enonce", "ordre", "estCorrect"
          ) VALUES ($1, $2, $3, $4)`,
          [idQuestion, c.enonce.trim(), j, c.estCorrect === true]
        );
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(
      { success: true, message: 'Offre publiée avec succès', idOffre },
      { status: 201 }
    );

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur création offre:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}