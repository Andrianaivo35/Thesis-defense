import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { analyserCV, appliquerDecisions } from '@/lib/ingestionCV';
import { SEUIL_RETENTION } from '@/lib/appariementFlou';

/* =====================================================================
   Analyse d'un CV : lecture du document, puis arbitrage de l'étudiant

   POST : lancer (ou relancer) l'analyse
   GET  : relire le résultat de la dernière analyse
   PUT  : enregistrer les compétences confirmées
   ===================================================================== */

function authentifierEtudiant(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload || payload.typeUtilisateur !== 'Etudiant') return null;
  return payload;
}

/* Le CV doit appartenir au demandeur. Sans cette vérification, un
   identifiant deviné donnerait accès au contenu du CV d'un autre
   étudiant — le texte extrait est une donnée personnelle au même titre
   que le fichier. */
async function verifierProprietaire(client, idCV, idEtudiant) {
  const { rows } = await client.query(
    `SELECT "idCV", "libelle", "statutAnalyse", "nombrePages", "pagesOcr",
            "confianceOcr", "dateAnalyse", "messageAnalyse"
       FROM "CV" WHERE "idCV" = $1 AND "idEtudiant" = $2`,
    [idCV, idEtudiant]
  );
  return rows[0] || null;
}

export async function POST(req, { params }) {
  const client = await pool.connect();
  try {
    const payload = authentifierEtudiant(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const idCV = Number((await params).idCV);
    if (!Number.isInteger(idCV)) {
      return NextResponse.json({ error: 'CV invalide' }, { status: 400 });
    }

    const cv = await verifierProprietaire(client, idCV, payload.idEtudiant);
    if (!cv) return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });

    /* L'analyse est synchrone : lire un CV de deux pages demande une à
       deux secondes, OCR compris. Une file d'attente serait une
       complexité sans contrepartie à cette échelle — à signaler comme
       limite si le volume changeait. */
    const resultat = await analyserCV(idCV);

    if (resultat.statut === 'echec') {
      return NextResponse.json(
        { error: `Ce CV n'a pas pu être analysé : ${resultat.message}` },
        { status: 422 }
      );
    }

    return NextResponse.json({ ...resultat, seuil: SEUIL_RETENTION }, { status: 200 });

  } catch (error) {
    console.error('Erreur analyse CV:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(req, { params }) {
  const client = await pool.connect();
  try {
    const payload = authentifierEtudiant(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const idCV = Number((await params).idCV);
    const cv = await verifierProprietaire(client, idCV, payload.idEtudiant);
    if (!cv) return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });

    const detections = await client.query(`
      SELECT d."idCompetenceDetectee", d."idCompetenceReference", d."termeDetecte",
             d."methode", d."confiance", d."page", d."section", d."contexte",
             d."decision",
             cr."nomCompetenceReference" AS "nom",
             cr."categorieCompetenceReference" AS "categorie",
             EXISTS (
               SELECT 1 FROM "CompetenceEtudiant" ce
                WHERE ce."idEtudiant" = $2
                  AND ce."idCompetenceReference" = d."idCompetenceReference"
             ) AS "dejaAuProfil"
        FROM "CompetenceDetectee" d
        LEFT JOIN "CompetenceReference" cr
          ON cr."idCompetenceReference" = d."idCompetenceReference"
       WHERE d."idCV" = $1
       ORDER BY d."confiance" DESC
    `, [idCV, payload.idEtudiant]);

    return NextResponse.json({
      cv,
      detections: detections.rows.map(d => ({
        ...d,
        confiance: Number(d.confiance),
        /* Ce que l'interface coche par défaut : au-dessus du seuil, et
           pas encore rejeté explicitement par l'étudiant. */
        proposee: Number(d.confiance) >= SEUIL_RETENTION && d.decision !== 'rejetee'
      })),
      seuil: SEUIL_RETENTION
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lecture analyse CV:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(req, { params }) {
  const client = await pool.connect();
  try {
    const payload = authentifierEtudiant(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const idCV = Number((await params).idCV);
    const cv = await verifierProprietaire(client, idCV, payload.idEtudiant);
    if (!cv) return NextResponse.json({ error: 'CV introuvable' }, { status: 404 });

    const corps = await req.json();
    const confirmees = Array.isArray(corps?.confirmees) ? corps.confirmees : [];

    const bilan = await appliquerDecisions(idCV, payload.idEtudiant, confirmees);

    return NextResponse.json({
      success: true,
      message: bilan.ajouteesAuProfil > 0
        ? `${bilan.ajouteesAuProfil} compétence${bilan.ajouteesAuProfil > 1 ? 's ont' : ' a'} été ajoutée${bilan.ajouteesAuProfil > 1 ? 's' : ''} à votre profil.`
        : 'Vos choix ont été enregistrés. Aucune nouvelle compétence à ajouter.',
      ...bilan
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur confirmation compétences:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
