import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validerMotDePasse } from '@/lib/motDePasse';
import { verifyToken } from '@/lib/jwt';

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
            emailAdmin,
            telephone,
            motDePasse
        } = await req.json();

        // Validation des champs obligatoires
        if (!nomAdmin || !prenomAdmin || !emailAdmin || !motDePasse) {
            return NextResponse.json(
                { error: 'Nom, prénom, email et mot de passe sont obligatoires' },
                { status: 400 }
            );
        }

        // Vérification de l'email avant de commencer la transaction
        const checkEmail = await client.query(
            'SELECT 1 FROM utilisateur WHERE "emailUtilisateur" = $1',
            [emailAdmin]
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