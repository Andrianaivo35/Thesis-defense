import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { idEntreprise } = await params;
  const client = await pool.connect();

  try {
    // === Infos de l'entreprise ===
    const entrepriseResult = await client.query(`
      SELECT 
        "idEntreprise",
        "idUtilisateur",
        "nomEntreprise",
        "formeJuridique",
        "secteurActivitePrincipal",
        "adresseSiegeSocial",
        "telephonePrincipal",
        "telephoneSecondaire",
        "siteWeb",
        "reseauxSociaux",
        "description",
        "logo",
        "dateInscription",
        "estVerifie"
      FROM entreprise
      WHERE "idEntreprise" = $1
    `, [idEntreprise]);

    if (entrepriseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    // === Offres actives + compétences (pour le modal) ===
    const offresResult = await client.query(`
      SELECT 
        o."idOffre", o."titre", o."description", o."domaine", o."niveauRequis",
        o."duree", o."dateDebut", o."dateFin", o."dateLimites", o."datePublication",
        o."remuneration", o."lieu", o."ville", o."accepteTeletravail", o."typeStage",
        COALESCE(
          json_agg(
            json_build_object(
              'nom', cr."nomCompetenceReference",
              'categorie', cr."categorieCompetenceReference",
              'niveauSouhaitee', co."niveauSouhaitee",
              'estObligatoire', co."estObligatoire"
            )
          ) FILTER (WHERE cr."idCompetenceReference" IS NOT NULL),
          '[]'::json
        ) AS competences
      FROM offre o
      LEFT JOIN "CompetenceOffre" co ON o."idOffre" = co."idOffre"
      LEFT JOIN "CompetenceReference" cr ON co."idCompetenceReference" = cr."idCompetenceReference"
      WHERE o."idEntreprise" = $1 AND o."statut" = 'Active'
      GROUP BY o."idOffre"
      ORDER BY o."datePublication" DESC
    `, [idEntreprise]);

    return NextResponse.json({
      entreprise: entrepriseResult.rows[0],
      offres: offresResult.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur profil entreprise:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}