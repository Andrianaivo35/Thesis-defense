import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM universite WHERE "estVerifie" = true ORDER BY "nomUniversite"');
        
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