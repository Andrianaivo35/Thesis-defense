import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validerMotDePasse } from '@/lib/motDePasse';
import { normalizeName } from '@/lib/normalize';
import { normaliserEmail, estEmailValide, estConflitEmail, MESSAGE_EMAIL_PRIS } from '@/lib/email';

export async function POST(req){
    const client = await pool.connect();
    const typeUtilisateur = 'Universite';

    try{
        const {
            nomUniversite,
            emailUniversite: emailUniversiteSaisi,
            sigleUniversitaire,
            telephone,
            adresse,
            ville,
            siteWeb,
            motDePasse
        } = await req.json();

    /* Forme canonique avant toute écriture : l'index d'unicité de la
       migration 008 porte sur lower(email). Insérer une adresse non
       normalisée créerait un compte que la connexion ne retrouverait
       pas sous la casse saisie par l'utilisateur. */
    const emailUniversite = normaliserEmail(emailUniversiteSaisi);

    /* Une adresse manifestement fautive est refusée ici plutôt que de
       créer un compte qu'aucun courriel n'atteindra jamais — le Lot 6.2
       fera dépendre l'activation d'un envoi. */
    if (emailUniversite && !estEmailValide(emailUniversite)) {
      return NextResponse.json(
        { error: "Cette adresse électronique n'est pas valide." },
        { status: 400 }
      );
    }

        // Vérification de l'email avant de commencer la transaction
        const checkEmail = await client.query(
            'SELECT 1 FROM utilisateur WHERE lower("emailUtilisateur") = $1',
            [emailUniversite]
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
        [typeUtilisateur, emailUniversite, hashedPassword]
        );

        const idUtilisateur = utilisateurResult.rows[0].idUtilisateur;
        // 2. Insertion dans universite
        const universiteResult = await client.query(
        `INSERT INTO universite (
            "idUtilisateur",
            "nomUniversite",
            "sigleUniversitaire",
            "telephoneUniversite",
            "adresseUniversite",
            "ville",
            "siteWeb",
            "logo",
            "dateInscription",
            "estVerifie",
            "dateVerification"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING "idUniversite"`,
        [
            idUtilisateur,
            nomUniversite,
            sigleUniversitaire,
            telephone,
            adresse,
            ville,
            siteWeb,
            logo,
            dateInscription,
            estVerifie,
            dateVerification
        ]
        );

        const idUniversite = universiteResult.rows[0].idUniversite;

        /* 3. Rattachement des étudiants en attente
           Des étudiants ont pu s'inscrire avant que leur université ne soit
           présente sur la plateforme : leur idUniversite est resté NULL et
           seul le nom saisi a été conservé. On les rattache ici, en comparant
           les noms normalisés (sans accents, sans ponctuation, sans casse).

           Le rattachement est cree "En attente" : c'est l'universite qui
           confirmera, elle seule sait qui sont reellement ses etudiants. */
        const nomNormalise = normalizeName(nomUniversite);

        const rattachement = await client.query(`
            UPDATE etudiant
            SET "idUniversite" = $1,
                "statutRattachement" = 'En attente',
                "dateRattachement" = now()
            WHERE "idUniversite" IS NULL
              AND "statutRattachement" IS NULL
              AND "nomUniversiteSaisi" IS NOT NULL
              AND LOWER(
                regexp_replace(
                  translate("nomUniversiteSaisi", 'àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ', 'aaaeeeeiioouuuycAAAEEEEIIOOUUUYC'),
                  '[^a-zA-Z0-9]+', ' ', 'g'
                )
              ) = $2
            RETURNING "idEtudiant"
        `, [idUniversite, nomNormalise]);

        const nombreEtudiantsRattaches = rattachement.rows.length;

        // Validation de la transaction
        await client.query('COMMIT');

        return NextResponse.json(
            {
                message: 'Enregistrement réussi',
                idUtilisateur,
                idUniversite,
                nombreEtudiantsRattaches
            },
            { status: 201 }
        );
    }catch(error){

    /* La vérification préalable ne suffit pas : entre le SELECT et
       l'INSERT, une autre requête peut avoir pris l'adresse. La
       contrainte d'unicité de la migration 008 est le seul garde-fou
       réel, et c'est ici qu'on traduit son refus en message clair
       plutôt qu'en « erreur serveur ». */
    if (estConflitEmail(error)) {
      return NextResponse.json({ error: MESSAGE_EMAIL_PRIS }, { status: 409 });
    }
        // Annulation en cas d'erreur (rollback du INSERT utilisateur si entreprise échoue)
        await client.query('ROLLBACK');
        console.error('Erreur complète:', error);
        return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
        );
    }finally {
        client.release();
    }
}