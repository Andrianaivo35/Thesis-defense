import pool from '@/lib/db';
import { NextResponse } from 'next/server';

/* =====================================================================
   GET : liste des universités, pour le sélecteur d'inscription étudiant.

   Colonnes explicites : un SELECT * renvoyait aussi "logo", stocké en
   base64, sur une route publique et sans authentification.

   Toutes les universités sont retournées, vérifiées ou non : une
   université inscrite mais pas encore validée par l'administration doit
   rester sélectionnable, sinon ses étudiants ne peuvent pas s'y rattacher.
   Le statut est exposé pour pouvoir l'afficher côté formulaire.
   ===================================================================== */
export async function GET() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT
                "idUniversite",
                "nomUniversite",
                "sigleUniversitaire",
                "ville",
                "estVerifie"
            FROM universite
            ORDER BY "nomUniversite" ASC
        `);

        return NextResponse.json(
            { universites: result.rows },
            { status: 200 }
        );
    } catch (error) {
        console.error('Erreur:', error);
        return NextResponse.json(
            { error: 'Erreur serveur', details: error.message },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}