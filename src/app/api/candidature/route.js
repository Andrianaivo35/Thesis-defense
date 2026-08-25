import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req) {
  const client = await pool.connect();

  try {
    // === Auth ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Etudiant') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEtudiant = payload.idEtudiant;

    // === Parse multipart/form-data ===
    const formData = await req.formData();
    const idOffre = formData.get('idOffre');
    const cv = formData.get('cv');
    const lettreMotivation = formData.get('lettreMotivation');
    const reponsesJson = formData.get('reponses');

    if (!idOffre || !cv || !lettreMotivation || !reponsesJson) {
      return NextResponse.json(
        { error: 'Données manquantes (idOffre, cv, lettre, réponses requis)' },
        { status: 400 }
      );
    }

    // === Validation fichiers ===
    if (cv.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Le CV doit être au format PDF' }, { status: 400 });
    }
    if (lettreMotivation.type !== 'application/pdf') {
      return NextResponse.json({ error: 'La lettre doit être au format PDF' }, { status: 400 });
    }
    if (cv.size > MAX_FILE_SIZE || lettreMotivation.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
    }

    const reponses = JSON.parse(reponsesJson); // { idQuestion: idChoix, ... }

    // === Sauvegarde des fichiers sur disque ===
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'candidatures');
    await mkdir(uploadDir, { recursive: true });

    const cvFilename = `cv-${randomUUID()}.pdf`;
    const lettreFilename = `lettre-${randomUUID()}.pdf`;

    const cvBuffer = Buffer.from(await cv.arrayBuffer());
    const lettreBuffer = Buffer.from(await lettreMotivation.arrayBuffer());

    await writeFile(path.join(uploadDir, cvFilename), cvBuffer);
    await writeFile(path.join(uploadDir, lettreFilename), lettreBuffer);

    const cvUrl = `/uploads/candidatures/${cvFilename}`;
    const lettreUrl = `/uploads/candidatures/${lettreFilename}`;

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

    // 3. Insérer la candidature
    let candidatureResult;
    try {
      candidatureResult = await client.query(`
        INSERT INTO "Candidature" (
          "idEtudiant", "idOffre", "lettreMotivation", "cv",
          "dateCandidature", "statut", "scoreMatching"
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
        RETURNING "idCandidature"
      `, [idEtudiant, idOffre, lettreUrl, cvUrl, 'En attente', scoreMatching]);
    } catch (insertError) {
      if (insertError.code === '23505') {  // UNIQUE violation
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Vous avez déjà postulé à cette offre' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    const idCandidature = candidatureResult.rows[0].idCandidature;

    // 4. Insérer les réponses étudiant
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
    await client.query('ROLLBACK');
    console.error('Erreur candidature:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}