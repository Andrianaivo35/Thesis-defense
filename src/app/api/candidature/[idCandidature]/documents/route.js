import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { enregistrerFichier, validerFichierPdf, supprimerFichier } from '@/lib/stockage';

/* =====================================================================
   POST : ajoute un document complémentaire à une candidature

   Sert deux usages avec un seul code : l'ajout au moment de l'envoi du
   QCM (qcm/[idOffre]/page.js) et l'ajout a posteriori depuis « Mes
   candidatures » (etudiantCandidature/page.js). Une fois la décision de
   l'entreprise prise (Recruté/Refusé), l'ajout est bloqué : le dossier
   n'a plus vocation à évoluer.
   ===================================================================== */

const MAX_DOCUMENTS = 5;

export async function POST(req, { params }) {
  const { idCandidature } = await params;
  const client = await pool.connect();
  let fichierEcrit = null;

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Etudiant') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const candidatureResult = await client.query(`
      SELECT "idCandidature", "idEtudiant", "statut"
      FROM "Candidature"
      WHERE "idCandidature" = $1
    `, [idCandidature]);

    if (candidatureResult.rows.length === 0) {
      return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 });
    }
    const candidature = candidatureResult.rows[0];

    if (String(candidature.idEtudiant) !== String(payload.idEtudiant)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (candidature.statut !== 'En attente') {
      return NextResponse.json(
        { error: "Cette candidature a déjà été traitée par l'entreprise, vous ne pouvez plus y ajouter de document." },
        { status: 409 }
      );
    }

    const compteResult = await client.query(`
      SELECT COUNT(*)::int AS total FROM "DocumentCandidature" WHERE "idCandidature" = $1
    `, [idCandidature]);
    if (compteResult.rows[0].total >= MAX_DOCUMENTS) {
      return NextResponse.json(
        { error: `Vous avez déjà atteint la limite de ${MAX_DOCUMENTS} documents complémentaires.` },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const document = formData.get('document');

    const erreur = validerFichierPdf(document, 'Le document');
    if (erreur) {
      return NextResponse.json({ error: erreur }, { status: 400 });
    }

    const nomFichier = await enregistrerFichier('documents', document, 'document');
    fichierEcrit = nomFichier;

    const insertion = await client.query(`
      INSERT INTO "DocumentCandidature" (
        "idCandidature", "nomFichier", "nomFichierOriginal", "tailleOctets"
      ) VALUES ($1, $2, $3, $4)
      RETURNING "idDocument", "nomFichierOriginal", "dateAjout"
    `, [idCandidature, nomFichier, document.name || null, document.size]);

    return NextResponse.json(
      { document: insertion.rows[0] },
      { status: 201 }
    );

  } catch (error) {
    if (fichierEcrit) await supprimerFichier('documents', fichierEcrit);
    console.error('Erreur ajout document candidature:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
