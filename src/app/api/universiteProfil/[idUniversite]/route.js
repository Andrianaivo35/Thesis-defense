import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

export async function GET(req, { params }) {
  const client = await pool.connect();
  try {
    const { idUniversite } = await params;

    // === Authentification optionnelle (visiteur peut être de n'importe quel type) ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // === 1. Récupérer les infos de l'université ===
    const universiteResult = await client.query(`
      SELECT 
        univ."idUniversite", univ."nomUniversite", univ."sigleUniversitaire",
        univ."adresseUniversite", univ."ville", univ."telephoneUniversite",
        univ."siteWeb", univ."logo", univ."estVerifie",
        univ."dateInscription", univ."dateVerification",
        u."idUtilisateur", u."emailUtilisateur"
      FROM universite univ
      INNER JOIN utilisateur u ON univ."idUtilisateur" = u."idUtilisateur"
      WHERE univ."idUniversite" = $1
    `, [idUniversite]);

    if (universiteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Université introuvable' }, { status: 404 });
    }

    const universite = universiteResult.rows[0];

    // === 2. Récupérer la liste des étudiants rattachés ===
    const etudiantsResult = await client.query(`
      SELECT 
        e."idEtudiant", e."nomEtudiant", e."prenomEtudiant",
        e."filiere", e."niveauAcademique", e."specialisation",
        e."photoProfil", e."estActif"
      FROM etudiant e
      WHERE e."idUniversite" = $1
      ORDER BY e."dateInscription" DESC
    `, [idUniversite]);

    return NextResponse.json({
      universite,
      etudiants: etudiantsResult.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET universiteProfil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}


/* ============================================================
   DELETE — suppression définitive du compte université
   ============================================================
   Seule l'université elle-même peut déclencher cette action. Deux
   preuves sont exigées : le mot de passe (l'identité) et la saisie
   du mot SUPPRIMER (l'intention) — un jeton volé ne suffit pas.

   DIFFÉRENCE MAJEURE avec l'étudiant et l'entreprise : les étudiants
   rattachés ne sont PAS supprimés. Ce sont des comptes autonomes,
   créés par des personnes qui n'ont rien demandé ; l'université n'en
   est pas propriétaire, elle en est seulement l'établissement de
   rattachement. On coupe donc le lien et on les laisse vivre — leur
   profil s'affichera simplement sans établissement, exactement comme
   un étudiant qui s'inscrit avant que son université ne rejoigne la
   plateforme.
*/
export async function DELETE(req, { params }) {
  const { idUniversite } = await params;
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (
      payload.typeUtilisateur !== 'Universite' ||
      parseInt(payload.idUniversite) !== parseInt(idUniversite)
    ) {
      return NextResponse.json(
        { error: 'Vous ne pouvez supprimer que votre propre compte' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { motDePasse, confirmation, forcer } = body;

    if (confirmation !== 'SUPPRIMER') {
      return NextResponse.json(
        { error: 'Confirmation invalide : tapez SUPPRIMER en majuscules.' },
        { status: 400 }
      );
    }
    if (!motDePasse) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    // === Vérification du mot de passe ===
    const compte = await client.query(
      `SELECT u."idUtilisateur", u."motDePasse"
       FROM universite univ
       INNER JOIN utilisateur u ON u."idUtilisateur" = univ."idUtilisateur"
       WHERE univ."idUniversite" = $1`,
      [idUniversite]
    );

    if (compte.rows.length === 0) {
      return NextResponse.json({ error: 'Université introuvable' }, { status: 404 });
    }

    const { idUtilisateur, motDePasse: hash } = compte.rows[0];

    const motDePasseValide = await bcrypt.compare(motDePasse, hash || '');
    if (!motDePasseValide) {
      // 401 et non 403 : ce n'est pas le droit qui manque, c'est la preuve d'identité
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    /* === Garde-fou ===
       Les étudiants rattachés ne bloquent pas la suppression, mais
       l'université doit savoir combien de profils vont perdre leur
       établissement — c'est la conséquence la plus visible. */
    const rattaches = await client.query(
      `SELECT COUNT(*) AS "total" FROM etudiant WHERE "idUniversite" = $1`,
      [idUniversite]
    );

    const total = Number(rattaches.rows[0].total);

    if (total > 0 && forcer !== true) {
      return NextResponse.json(
        {
          error: `${total} étudiant${total > 1 ? 's sont' : ' est'} rattaché${total > 1 ? 's' : ''} à votre établissement. ${total > 1 ? 'Leurs comptes seront conservés' : 'Son compte sera conservé'}, mais ${total > 1 ? 'ils perdront' : 'il perdra'} leur rattachement et devront le refaire si vous revenez sur la plateforme.`,
          code: 'ETUDIANTS_RATTACHES'
        },
        { status: 409 }
      );
    }

    /* Chemin du logo relevé AVANT la suppression. Si tu stockes le logo
       en data-URI dans la colonne, il n'y a aucun fichier sur disque et
       le nettoyage plus bas ne fera rien — c'est déjà géré par le test
       sur « data: ». */
    let logo = null;
    try {
      const r = await client.query(
        `SELECT "logo" FROM universite WHERE "idUniversite" = $1`,
        [idUniversite]
      );
      logo = r.rows[0]?.logo || null;
    } catch {
      // colonne absente : rien à nettoyer
    }

    // === Suppression en transaction ===
    await client.query('BEGIN');

    /* Étape clé : on DÉTACHE les étudiants, on ne les supprime pas.
       Sans ce UPDATE, le DELETE sur universite échouerait de toute
       façon par violation de clé étrangère — mais le remplacer par un
       DELETE des étudiants serait une catastrophe silencieuse. */
    await client.query(
      `UPDATE etudiant
       SET "idUniversite" = NULL,
           "statutRattachement" = NULL,
           "dateFinRattachement" = NULL
       WHERE "idUniversite" = $1`,
      [idUniversite]
    );

    /* Les autres tables liées, chacune sous SAVEPOINT : si l'une n'existe
       pas sous ce nom dans ton schéma (42P01), on l'ignore au lieu de
       faire échouer toute la transaction. Toute autre erreur remonte. */
    const tablesLiees = [
      { sql: `DELETE FROM message WHERE "idExpediteur" = $1 OR "idDestinataire" = $1`, valeur: idUtilisateur },
      { sql: `DELETE FROM notification WHERE "idUtilisateur" = $1`, valeur: idUtilisateur },
    ];

    for (const t of tablesLiees) {
      await client.query('SAVEPOINT sp_suppression');
      try {
        await client.query(t.sql, [t.valeur]);
        await client.query('RELEASE SAVEPOINT sp_suppression');
      } catch (e) {
        await client.query('ROLLBACK TO SAVEPOINT sp_suppression');
        if (e.code !== '42P01') throw e; // 42P01 = relation inexistante
        console.warn('Table absente du schéma, ignorée :', t.sql);
      }
    }

    // Le cœur : aucune tolérance ici, ces deux lignes doivent partir
    await client.query(`DELETE FROM universite WHERE "idUniversite" = $1`, [idUniversite]);
    await client.query(`DELETE FROM utilisateur WHERE "idUtilisateur" = $1`, [idUtilisateur]);

    await client.query('COMMIT');

    /* Fichier physique : hors transaction. Un échec d'unlink ne doit pas
       ressusciter un compte déjà effacé en base. */
    if (logo && !logo.startsWith('data:') && !logo.startsWith('http')) {
      await fs.unlink(logo).catch(() => {});
    }

    return NextResponse.json(
      {
        message: 'Compte supprimé définitivement',
        etudiantsDetaches: total
      },
      { status: 200 }
    );

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur suppression compte université:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}