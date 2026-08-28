import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import {
  enregistrerFichier, validerFichierPdf, supprimerFichier
} from '@/lib/stockage';

export async function POST(req) {
  const client = await pool.connect();
  // Suivi des fichiers ecrits, pour pouvoir les effacer en cas d'echec
  const fichiersEcrits = [];

  try {
    // === Auth ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Etudiant') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEtudiant = payload.idEtudiant;

    /* === Lecture du dossier ===
       Le CV provient désormais de la bibliothèque de l'étudiant (idCV).
       Un fichier peut aussi être envoyé directement : il est alors ajouté
       à la bibliothèque, pour que l'étudiant n'ait pas à le redéposer à
       chaque candidature. */
    const formData = await req.formData();
    const idOffre = formData.get('idOffre');
    const idCVChoisi = formData.get('idCV');
    const cv = formData.get('cv');
    const lettreMotivation = formData.get('lettreMotivation');
    const reponsesJson = formData.get('reponses');

    if (!idOffre || !reponsesJson) {
      return NextResponse.json(
        { error: 'Données manquantes (offre et réponses au QCM requises)' },
        { status: 400 }
      );
    }
    if (!idCVChoisi && !cv) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner un CV ou en téléverser un' },
        { status: 400 }
      );
    }

    const erreurLettre = validerFichierPdf(lettreMotivation, 'La lettre de motivation');
    if (erreurLettre) {
      return NextResponse.json({ error: erreurLettre }, { status: 400 });
    }
    if (cv) {
      const erreurCv = validerFichierPdf(cv, 'Le CV');
      if (erreurCv) return NextResponse.json({ error: erreurCv }, { status: 400 });
    }

    /* === Vérification de l'offre ===
       Rien n'empêchait auparavant de candidater à une offre clôturée ou
       dont la date limite était dépassée. */
    const offreResult = await client.query(`
      SELECT "idOffre", "statut", "dateLimites"
      FROM offre WHERE "idOffre" = $1
    `, [idOffre]);

    if (offreResult.rows.length === 0) {
      return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 });
    }
    const offre = offreResult.rows[0];
    if (offre.statut && offre.statut !== 'Active') {
      return NextResponse.json(
        { error: "Cette offre n'accepte plus de candidatures" },
        { status: 400 }
      );
    }
    if (offre.dateLimites && new Date(offre.dateLimites) < new Date(new Date().toDateString())) {
      return NextResponse.json(
        { error: 'La date limite de candidature est dépassée' },
        { status: 400 }
      );
    }

    // Si un CV existant est choisi, il doit appartenir à l'étudiant
    if (idCVChoisi) {
      const verif = await client.query(
        'SELECT 1 FROM "CV" WHERE "idCV" = $1 AND "idEtudiant" = $2',
        [idCVChoisi, idEtudiant]
      );
      if (verif.rows.length === 0) {
        return NextResponse.json({ error: 'CV introuvable' }, { status: 400 });
      }
    }

    const reponses = JSON.parse(reponsesJson); // { idQuestion: idChoix, ... }

    // === Écriture des fichiers sur le volume dédié ===
    const nomFichierLettre = await enregistrerFichier('lettres', lettreMotivation, 'lettre');
    fichiersEcrits.push(['lettres', nomFichierLettre]);

    let nomFichierCv = null;
    if (cv) {
      nomFichierCv = await enregistrerFichier('cv', cv, 'cv');
      fichiersEcrits.push(['cv', nomFichierCv]);
    }

    // === Transaction ===
    await client.query('BEGIN');

    // 1. Récupérer toutes les questions + choix corrects pour calculer le score
    const correctesResult = await client.query(`
      SELECT q."idQuestion", q."points",
             c."idChoix", c."estCorrect", c."enonce"
      FROM "QCM" qcm
      INNER JOIN "Question" q ON q."idQCM" = qcm."idQCM"
      INNER JOIN "ChoixReponse" c ON c."idQuestion" = q."idQuestion"
      WHERE qcm."idOffre" = $1
    `, [idOffre]);

    // Grouper par question
    const questionsMap = {};
    let totalPoints = 0;
    for (const row of correctesResult.rows) {
      if (!questionsMap[row.idQuestion]) {
        questionsMap[row.idQuestion] = {
          points: row.points,
          choix: []
        };
        totalPoints += row.points;
      }
      questionsMap[row.idQuestion].choix.push({
        idChoix: row.idChoix,
        estCorrect: row.estCorrect,
        enonce: row.enonce
      });
    }

    // 2. Calculer le score et préparer les réponses à insérer
    let earnedPoints = 0;
    const reponsesACreer = [];

    for (const [idQuestion, idChoixSelectionne] of Object.entries(reponses)) {
      const question = questionsMap[idQuestion];
      if (!question) continue;

      const choixSelectionne = question.choix.find(
        c => c.idChoix === parseInt(idChoixSelectionne)
      );
      if (!choixSelectionne) continue;

      if (choixSelectionne.estCorrect) {
        earnedPoints += question.points;
      }

      reponsesACreer.push({
        idQuestion: parseInt(idQuestion),
        idChoix: parseInt(idChoixSelectionne),
        enonce: choixSelectionne.enonce,
        estCorrecte: choixSelectionne.estCorrect
      });
    }

    const scoreMatching = totalPoints > 0
      ? ((earnedPoints / totalPoints) * 100).toFixed(2)
      : 0;

    /* 3. Si un nouveau CV a été téléversé, il rejoint la bibliothèque :
          l'étudiant n'aura plus à le redéposer pour la prochaine offre. */
    let idCV = idCVChoisi ? parseInt(idCVChoisi, 10) : null;

    if (!idCV && nomFichierCv) {
      const nbCv = await client.query(
        'SELECT COUNT(*)::int AS total FROM "CV" WHERE "idEtudiant" = $1',
        [idEtudiant]
      );
      const nouveauCv = await client.query(`
        INSERT INTO "CV" (
          "idEtudiant", "libelle", "nomFichier", "nomFichierOriginal",
          "tailleOctets", "estPrincipal"
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING "idCV"
      `, [
        idEtudiant,
        cv.name?.replace(/\.pdf$/i, '').slice(0, 150) || 'CV',
        nomFichierCv, cv.name || null, cv.size,
        nbCv.rows[0].total === 0
      ]);
      idCV = nouveauCv.rows[0].idCV;
    }

    // 4. Insérer la candidature
    let candidatureResult;
    try {
      candidatureResult = await client.query(`
        INSERT INTO "Candidature" (
          "idEtudiant", "idOffre", "idCV", "nomFichierLettre",
          "dateCandidature", "statut", "scoreMatching"
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
        RETURNING "idCandidature"
      `, [idEtudiant, idOffre, idCV, nomFichierLettre, 'En attente', scoreMatching]);
    } catch (insertError) {
      if (insertError.code === '23505') {  // UNIQUE violation
        await client.query('ROLLBACK');
        for (const [cat, nom] of fichiersEcrits) await supprimerFichier(cat, nom);
        return NextResponse.json(
          { error: 'Vous avez déjà postulé à cette offre' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    const idCandidature = candidatureResult.rows[0].idCandidature;

    // 5. Insérer les réponses étudiant
    for (let i = 0; i < reponsesACreer.length; i++) {
      const r = reponsesACreer[i];
      await client.query(`
        INSERT INTO "ReponseEtudiant" (
          "idCandidature", "idQuestion", "idChoixOffre",
          "enonce", "estCorrecte", "ordre"
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [idCandidature, r.idQuestion, r.idChoix, r.enonce, r.estCorrecte, i]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Candidature envoyée avec succès',
      idCandidature,
      scoreMatching,
      earnedPoints,
      totalPoints
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    // Pas de fichier orphelin sur le volume si la candidature a échoué
    for (const [cat, nom] of fichiersEcrits) await supprimerFichier(cat, nom);
    console.error('Erreur candidature:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}