import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validerMotDePasse } from '@/lib/motDePasse';
import { normaliserEmail, estEmailValide, estConflitEmail, MESSAGE_EMAIL_PRIS } from '@/lib/email';

export async function POST(req) {
  const client = await pool.connect();
  const typeUtilisateur = 'Entreprise';
  
  try {
    const {
      nomEntreprise,
      emailEntreprise: emailEntrepriseSaisi,
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

    /* Forme canonique avant toute écriture : l'index d'unicité de la
       migration 008 porte sur lower(email). Insérer une adresse non
       normalisée créerait un compte que la connexion ne retrouverait
       pas sous la casse saisie par l'utilisateur. */
    const emailEntreprise = normaliserEmail(emailEntrepriseSaisi);

    /* Une adresse manifestement fautive est refusée ici plutôt que de
       créer un compte qu'aucun courriel n'atteindra jamais — le Lot 6.2
       fera dépendre l'activation d'un envoi. */
    if (emailEntreprise && !estEmailValide(emailEntreprise)) {
      return NextResponse.json(
        { error: "Cette adresse électronique n'est pas valide." },
        { status: 400 }
      );
    }

    // Vérification de l'email avant de commencer la transaction
    const checkEmail = await client.query(
      'SELECT 1 FROM utilisateur WHERE lower("emailUtilisateur") = $1',
      [emailEntreprise]
    );

    if (checkEmail.rows.length > 0) {
      return NextResponse.json(
        { error: MESSAGE_EMAIL_PRIS },
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

    /* La vérification préalable ne suffit pas : entre le SELECT et
       l'INSERT, une autre requête peut avoir pris l'adresse. La
       contrainte d'unicité de la migration 008 est le seul garde-fou
       réel, et c'est ici qu'on traduit son refus en message clair
       plutôt qu'en « erreur serveur ». */
    if (estConflitEmail(error)) {
      return NextResponse.json({ error: MESSAGE_EMAIL_PRIS }, { status: 409 });
    }
    console.error('Erreur complète:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}