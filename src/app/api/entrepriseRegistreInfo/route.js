import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validerMotDePasse } from '@/lib/motDePasse';

export async function POST(req) {
  const client = await pool.connect();
  const typeUtilisateur = 'Entreprise';
  
  try {
    const {
      nomEntreprise,
      emailEntreprise,
      numeroIdentificationFiscale,
      formJuridique,
      numeroStat,
      secteurActivitePrincipal,
      descriptionEntreprise,
      adresseSiegeSocial,
      numeroTelephonePrincipal,
      numeroTelephoneSecondaire,
      siteWeb,
      reseauSociaux,
      motDePasse
    } = await req.json();

    // Vérification de l'email avant de commencer la transaction
    const checkEmail = await client.query(
      'SELECT 1 FROM utilisateur WHERE "emailUtilisateur" = $1',
      [emailEntreprise]
    );

    if (checkEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'Cet email existe déjà' },
        { status: 409 }
      );
    }

    const erreurMotDePasse = validerMotDePasse(motDePasse);

    if (erreurMotDePasse) {

      return NextResponse.json({ error: erreurMotDePasse }, { status: 400 });

    }


    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const dateInscription = new Date();
    const estVerifie = false;
    const logo = null;            // pas de logo à l'inscription
    const dateVerification = null; // pas encore vérifié

    // Début de la transaction
    await client.query('BEGIN');

    // 1. Insertion dans utilisateur AVEC RETURNING pour récupérer l'id
    const utilisateurResult = await client.query(
      `INSERT INTO utilisateur (
          "typeUtilisateur",
          "emailUtilisateur",
          "motDePasse"
        ) VALUES ($1, $2, $3)
        RETURNING "idUtilisateur"`,
      [typeUtilisateur, emailEntreprise, hashedPassword]
    );

    const idUtilisateur = utilisateurResult.rows[0].idUtilisateur;

    // 2. Insertion dans entreprise (ordre colonnes = ordre valeurs)
    await client.query(
      `INSERT INTO entreprise (
        "idUtilisateur",
        "nomEntreprise",
        "numeroIdentificationFiscal",
        "numeroStat",
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
        "estVerifie",
        "dateVerification"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        idUtilisateur,
        nomEntreprise,
        numeroIdentificationFiscale,
        numeroStat,
        formJuridique,
        secteurActivitePrincipal,
        adresseSiegeSocial,
        numeroTelephonePrincipal,
        numeroTelephoneSecondaire,
        siteWeb,
        reseauSociaux,
        descriptionEntreprise,
        logo,
        dateInscription,
        estVerifie,
        dateVerification
      ]
    );

    // Validation de la transaction
    await client.query('COMMIT');

    return NextResponse.json(
      { message: 'Enregistrement réussi', idUtilisateur },
      { status: 201 }
    );

  } catch (error) {
    // Annulation en cas d'erreur (rollback du INSERT utilisateur si entreprise échoue)
    await client.query('ROLLBACK');
    console.error('Erreur complète:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}