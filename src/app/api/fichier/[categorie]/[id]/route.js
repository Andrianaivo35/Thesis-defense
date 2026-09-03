import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { lireFichier } from '@/lib/stockage';

/* =====================================================================
   GET : téléchargement contrôlé d'un CV ou d'une lettre de motivation

   Ces fichiers étaient auparavant déposés dans public/, donc
   téléchargeables par quiconque connaissait l'URL — sans authentification,
   alors qu'il s'agit de données personnelles.

   L'accès est désormais restreint :
     - l'étudiant, à ses propres documents
     - l'entreprise, aux documents des candidatures reçues sur ses offres
     - l'université, aux CV de ses étudiants rattachés et validés

   Routes :
     /api/fichier/cv/{idCV}
     /api/fichier/lettre/{idCandidature}
     /api/fichier/document/{idDocument}
   ===================================================================== */

const CATEGORIES = ['cv', 'lettre', 'document'];

export async function GET(req, { params }) {
  const client = await pool.connect();
  try {
    const { categorie, id } = await params;

    if (!CATEGORIES.includes(categorie)) {
      return NextResponse.json({ error: 'Type de document inconnu' }, { status: 404 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let nomFichier = null;
    let nomAffiche = 'document.pdf';
    let autorise = false;
    let dossier = 'cv';

    if (categorie === 'cv') {
      const result = await client.query(`
        SELECT cv."idCV", cv."nomFichier", cv."nomFichierOriginal", cv."libelle",
               cv."idEtudiant", e."idUniversite", e."statutRattachement"
        FROM "CV" cv
        INNER JOIN etudiant e ON e."idEtudiant" = cv."idEtudiant"
        WHERE cv."idCV" = $1
      `, [id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
      }
      const cv = result.rows[0];
      nomFichier = cv.nomFichier;
      nomAffiche = cv.nomFichierOriginal || `${cv.libelle}.pdf`;
      dossier = 'cv';

      if (payload.typeUtilisateur === 'Etudiant') {
        autorise = String(payload.idEtudiant) === String(cv.idEtudiant);

      } else if (payload.typeUtilisateur === 'Entreprise') {
        // Uniquement si ce CV a été envoyé à l'une de ses offres
        const lien = await client.query(`
          SELECT 1 FROM "Candidature" c
          INNER JOIN offre o ON o."idOffre" = c."idOffre"
          WHERE c."idCV" = $1 AND o."idEntreprise" = $2
          LIMIT 1
        `, [id, payload.idEntreprise]);
        autorise = lien.rows.length > 0;

      } else if (payload.typeUtilisateur === 'Universite') {
        /* Un DIPLÔMÉ reste rattaché : il figure dans la liste de son
           établissement en « ancien étudiant », et l'accompagner dans sa
           recherche de stage de fin d'études suppose de pouvoir ouvrir
           son CV.

           Un SORTI, non. Le rattachement est rompu ; le conserver en
           base sert l'historique et la réversibilité, pas un droit de
           lecture. */
        autorise =
          String(cv.idUniversite) === String(payload.idUniversite) &&
          ['Valide', 'Diplome'].includes(cv.statutRattachement);
      }

    } else if (categorie === 'lettre') {
      const result = await client.query(`
        SELECT c."idCandidature", c."nomFichierLettre", c."idEtudiant",
               o."idEntreprise"
        FROM "Candidature" c
        INNER JOIN offre o ON o."idOffre" = c."idOffre"
        WHERE c."idCandidature" = $1
      `, [id]);

      if (result.rows.length === 0 || !result.rows[0].nomFichierLettre) {
        return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
      }
      const cand = result.rows[0];
      nomFichier = cand.nomFichierLettre;
      nomAffiche = `lettre-motivation-${cand.idCandidature}.pdf`;
      dossier = 'lettres';

      if (payload.typeUtilisateur === 'Etudiant') {
        autorise = String(payload.idEtudiant) === String(cand.idEtudiant);
      } else if (payload.typeUtilisateur === 'Entreprise') {
        autorise = String(payload.idEntreprise) === String(cand.idEntreprise);
      }

    } else {
      // categorie === 'document' : pièces complémentaires de candidature
      const result = await client.query(`
        SELECT doc."idDocument", doc."nomFichier", doc."nomFichierOriginal",
               c."idEtudiant", o."idEntreprise"
        FROM "DocumentCandidature" doc
        INNER JOIN "Candidature" c ON c."idCandidature" = doc."idCandidature"
        INNER JOIN offre o ON o."idOffre" = c."idOffre"
        WHERE doc."idDocument" = $1
      `, [id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
      }
      const doc = result.rows[0];
      nomFichier = doc.nomFichier;
      nomAffiche = doc.nomFichierOriginal || `document-${doc.idDocument}.pdf`;
      dossier = 'documents';

      if (payload.typeUtilisateur === 'Etudiant') {
        autorise = String(payload.idEtudiant) === String(doc.idEtudiant);
      } else if (payload.typeUtilisateur === 'Entreprise') {
        autorise = String(payload.idEntreprise) === String(doc.idEntreprise);
      }
    }

    if (!autorise) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à ce document" },
        { status: 403 }
      );
    }

    let contenu;
    try {
      contenu = await lireFichier(dossier, nomFichier);
    } catch {
      // Référencé en base mais absent du volume
      return NextResponse.json({ error: 'Document introuvable' }, { status: 404 });
    }

    return new NextResponse(contenu, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${nomAffiche.replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store'
      }
    });

  } catch (error) {
    console.error('Erreur téléchargement document:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
