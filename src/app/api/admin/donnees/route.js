import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload || payload.typeUtilisateur !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // === Statistiques globales ===
    const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM etudiant) AS "totalEtudiants",
        (SELECT COUNT(*) FROM entreprise) AS "totalEntreprises",
        (SELECT COUNT(*) FROM universite) AS "totalUniversites",
        (SELECT COUNT(*) FROM offre) AS "totalOffres",
        (SELECT COUNT(*) FROM "Candidature") AS "totalCandidatures",
        (SELECT COUNT(*) FROM entreprise WHERE "estVerifie" = false) AS "entreprisesEnAttente",
        (SELECT COUNT(*) FROM universite WHERE "estVerifie" = false) AS "universitesEnAttente"
    `);
    const stats = statsResult.rows[0]; // ✅ Ligne ajoutée

    // === Entreprises — TOUS les champs ===
    const entreprisesResult = await client.query(`
      SELECT 
        e."idEntreprise", e."nomEntreprise", e."numeroIdentificationFiscal",
        e."numeroStat", e."formeJuridique", e."secteurActivitePrincipal",
        e."adresseSiegeSocial", e."telephonePrincipal", e."telephoneSecondaire",
        e."siteWeb", e."reseauxSociaux", e."description", e."logo",
        e."estVerifie", e."dateInscription", e."dateVerification",
        u."emailUtilisateur"
      FROM entreprise e
      INNER JOIN utilisateur u ON e."idUtilisateur" = u."idUtilisateur"
      ORDER BY e."estVerifie" ASC, e."dateInscription" DESC
    `);

    // === Universités — TOUS les champs ===
    const universitesResult = await client.query(`
      SELECT 
        univ."idUniversite", univ."nomUniversite", univ."sigleUniversitaire",
        univ."telephoneUniversite", univ."adresseUniversite", univ."ville",
        univ."siteWeb", univ."logo", univ."estVerifie",
        univ."dateInscription", univ."dateVerification",
        u."emailUtilisateur"
      FROM universite univ
      INNER JOIN utilisateur u ON univ."idUtilisateur" = u."idUtilisateur"
      ORDER BY univ."estVerifie" ASC, univ."dateInscription" DESC
    `);

    // === Étudiants ===
    const etudiantsResult = await client.query(`
      SELECT 
        e."idEtudiant", e."nomEtudiant", e."prenomEtudiant",
        e."filiere", e."niveauAcademique", e."specialisation", e."estActif",
        e."dateInscription",
        u."emailUtilisateur",
        univ."nomUniversite"
      FROM etudiant e
      INNER JOIN utilisateur u ON e."idUtilisateur" = u."idUtilisateur"
      LEFT JOIN universite univ ON e."idUniversite" = univ."idUniversite"
      ORDER BY e."dateInscription" DESC
    `);

    // === Offres ===
    const offresResult = await client.query(`
      SELECT 
        o."idOffre", o."titre", o."domaine", o."ville", o."typeStage",
        o."statut", o."datePublication", o."dateLimites",
        e."nomEntreprise"
      FROM offre o
      INNER JOIN entreprise e ON o."idEntreprise" = e."idEntreprise"
      ORDER BY o."datePublication" DESC
    `);

    // === Inscriptions par mois (12 derniers mois) ===
    const inscriptionsParMoisResult = await client.query(`
      WITH mois AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'
        ) AS mois
      )
      SELECT 
        TO_CHAR(m.mois, 'YYYY-MM') AS "moisCle",
        TO_CHAR(m.mois, 'Mon YY') AS "moisLabel",
        COALESCE(et.nb, 0) AS "etudiants",
        COALESCE(en.nb, 0) AS "entreprises",
        COALESCE(un.nb, 0) AS "universites"
      FROM mois m
      LEFT JOIN (
        SELECT date_trunc('month', "dateInscription") AS mois, COUNT(*) AS nb
        FROM etudiant
        GROUP BY date_trunc('month', "dateInscription")
      ) et ON et.mois = m.mois
      LEFT JOIN (
        SELECT date_trunc('month', "dateInscription") AS mois, COUNT(*) AS nb
        FROM entreprise
        GROUP BY date_trunc('month', "dateInscription")
      ) en ON en.mois = m.mois
      LEFT JOIN (
        SELECT date_trunc('month', "dateInscription") AS mois, COUNT(*) AS nb
        FROM universite
        GROUP BY date_trunc('month', "dateInscription")
      ) un ON un.mois = m.mois
      ORDER BY m.mois ASC
    `);

    return NextResponse.json({
      stats,
      entreprises: entreprisesResult.rows,
      universites: universitesResult.rows,
      etudiants: etudiantsResult.rows,
      offres: offresResult.rows,
      inscriptionsParMois: inscriptionsParMoisResult.rows.map(r => ({
        mois: r.moisLabel,
        Étudiants: parseInt(r.etudiants),
        Entreprises: parseInt(r.entreprises),
        Universités: parseInt(r.universites)
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}