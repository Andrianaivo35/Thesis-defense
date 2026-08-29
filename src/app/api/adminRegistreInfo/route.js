import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validerMotDePasse } from '@/lib/motDePasse';
import { verifyToken } from '@/lib/jwt';
import { normaliserEmail, estEmailValide, estConflitEmail, MESSAGE_EMAIL_PRIS } from '@/lib/email';

export async function POST(req){
    const client = await pool.connect();
    const typeUtilisateur = 'Admin';

    try{
        // === Auth : SEUL un admin peut créer un autre admin ===
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');
        const payload = verifyToken(token);

        if (!payload || payload.typeUtilisateur !== 'Admin') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const {
            nomAdmin,
            prenomAdmin,
            emailAdmin: emailAdminSaisi,
            telephone,
            motDePasse
        } = await req.json();

    /* Forme canonique avant toute écriture : l'index d'unicité de la
       migration 008 porte sur lower(email). Insérer une adresse non
       normalisée créerait un compte que la connexion ne retrouverait
       pas sous la casse saisie par l'utilisateur. */
    const emailAdmin = normaliserEmail(emailAdminSaisi);

    /* Une adresse manifestement fautive est refusée ici plutôt que de
       créer un compte qu'aucun courriel n'atteindra jamais — le Lot 6.2
       fera dépendre l'activation d'un envoi. */
    if (emailAdmin && !estEmailValide(emailAdmin)) {
      return NextResponse.json(
        { error: "Cette adresse électronique n'est pas valide." },
        { status: 400 }
      );
    }

        // Validation des champs obligatoires
        if (!nomAdmin || !prenomAdmin || !emailAdmin || !motDePasse) {
            return NextResponse.json(
                { error: 'Nom, prénom, email et mot de passe sont obligatoires' },
                { status: 400 }
            );
        }

        // Vérification de l'email avant de commencer la transaction
        const checkEmail = await client.query(
            'SELECT 1 FROM utilisateur WHERE lower("emailUtilisateur") = $1',
            [emailAdmin]
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
            [typeUtilisateur, emailAdmin, hashedPassword]
        );

        const idUtilisateur = utilisateurResult.rows[0].idUtilisateur;

        // 2. Insertion dans admin
        await client.query(
            `INSERT INTO admin (
                "idUtilisateur",
                "nomAdmin",
                "prenomAdmin",
                "telephone"
            ) VALUES ($1, $2, $3, $4)`,
            [
                idUtilisateur,
                nomAdmin,
                prenomAdmin,
                telephone || null
            ]
        );

        // Validation de la transaction
        await client.query('COMMIT');

        return NextResponse.json(
            { message: 'Compte admin créé avec succès', idUtilisateur },
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
        // Annulation en cas d'erreur (rollback du INSERT utilisateur si admin échoue)
        await client.query('ROLLBACK');
        console.error('Erreur création admin:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }finally {
        client.release();
    }
}