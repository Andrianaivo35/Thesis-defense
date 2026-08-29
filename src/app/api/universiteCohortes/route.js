import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// =====================================================================
// GET : lister toutes les annonces de l'université connectée
// =====================================================================
export async function GET(req) {
  const client = await pool.connect();
  try { 
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const result = await client.query(`
      SELECT 
        a.*,
        p."libelle" AS "promotionLibelle", p."annee" AS "promotionAnnee",
        COUNT(DISTINCT e."idEtudiant") AS "nombreEtudiants"
      FROM "AnnonceCohorte" a
      LEFT JOIN "Promotion" p ON p."idPromotion" = a."idPromotion"
      LEFT JOIN etudiant e ON e."idPromotion" = p."idPromotion"
        AND COALESCE(e."statutRattachement", 'Valide') = 'Valide'
      WHERE a."idUniversite" = $1
      GROUP BY a."idAnnonceCohorte", p."idPromotion"
      ORDER BY a."datePublication" DESC
    `, [payload.idUniversite]);

    return NextResponse.json({ annonces: result.rows }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET universiteCohortes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

// =====================================================================
// POST : créer une nouvelle annonce + ses étudiants externes
// =====================================================================
export async function POST(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const {
      titre, description, filiereConcernee, niveauAcademique,
      domainesRecherche, periodeDebut, periodeFin, dureeStage,
      villePreferee, accepteTeletravail, dateLimite,
      idPromotion   // la promotion concernée, ou null
    } = body;

    if (!titre?.trim()) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Créer l'annonce
    const annonceResult = await client.query(`
      INSERT INTO "AnnonceCohorte" (
        "idUniversite", "titre", "description", "filiereConcernee",
        "niveauAcademique", "domainesRecherche", "periodeDebut", "periodeFin",
        "dureeStage", "villePreferee", "accepteTeletravail", "dateLimite",
        "idPromotion", "statut"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Active')
      RETURNING "idAnnonceCohorte"
    `, [
      payload.idUniversite, titre.trim(), description || null,
      filiereConcernee || null, niveauAcademique || null,
      domainesRecherche || null,
      periodeDebut || null, periodeFin || null,
      dureeStage || null, villePreferee || null,
      accepteTeletravail || null, dateLimite || null,
      /* La promotion doit appartenir à cet établissement. Sans cette
         vérification, un identifiant deviné publierait les étudiants
         d'une autre université. */
      idPromotion
        ? (await client.query(
            'SELECT "idPromotion" FROM "Promotion" WHERE "idPromotion" = $1 AND "idUniversite" = $2',
            [idPromotion, payload.idUniversite])).rows[0]?.idPromotion || null
        : null
    ]);

    const idAnnonceCohorte = annonceResult.rows[0].idAnnonceCohorte;

    /* Plus de saisie d'étudiants ici. L'annonce DÉSIGNE une promotion
       déjà importée ; les étudiants qu'elle présente sont de vrais
       comptes, avec profil, compétences et CV.

       Saisir des noms à la main produisait des étudiants fantômes sur
       lesquels une entreprise ne pouvait rien faire — pas même envoyer
       un message. */

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      idAnnonceCohorte,
      message: 'Annonce de cohorte créée avec succès'
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur POST universiteCohortes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}