import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { envoyerMessageInterne } from '@/lib/messagerie';

/* =====================================================================
   POST /api/universiteCycleVie — clore le rattachement d'étudiants

   L'ACTION PORTE SUR UNE PROMOTION, PAS SUR UN ÉTUDIANT

   C'est le principe directeur du lot. « La L3 Informatique 2026 est
   diplômée » doit être un geste, pas quatre-vingts. On désigne donc une
   promotion, et l'on EXCLUT nommément les quelques cas particuliers —
   le redoublant, celui qui a abandonné en cours d'année.

   L'inverse — cocher quatre-vingts noms et en oublier deux — est
   exactement ce que ce lot cherche à éviter.

   DEUX FINS QUI NE SE VALENT PAS

     Diplome  l'étudiant reste sur la plateforme, en « ancien étudiant
              de X ». Il continue de recevoir des recommandations et de
              candidater : c'est l'intention, un diplômé cherche encore.

     Sorti    départ ou exclusion. Il quitte les effectifs, son profil
              n'affiche plus l'établissement.

   Dans les deux cas le rattachement est CONSERVÉ en base. C'est le
   statut qui détache, pas l'effacement : une exclusion prononcée par
   erreur doit pouvoir se corriger, et l'historique d'un diplômé sert
   encore aux entreprises.
   ===================================================================== */

const STATUTS_FIN = ['Diplome', 'Sorti'];

/* Le libellé s'accorde : « 3 étudiants diplômé » est fautif, et un
   message d'interface qui écorche le français décrédibilise le reste. */
const LIBELLES = {
  Diplome: n => `déclaré${n > 1 ? 's' : ''} diplômé${n > 1 ? 's' : ''}`,
  Sorti: n => `retiré${n > 1 ? 's' : ''} des effectifs`
};

function authentifier(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload || payload.typeUtilisateur !== 'Universite') return null;
  return payload;
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const payload = authentifier(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const {
      statut, idPromotion, idsEtudiants, exclusions = [], motif,
      simulation = false
    } = await req.json();

    if (!STATUTS_FIN.includes(statut)) {
      return NextResponse.json(
        { error: 'Statut inconnu. Attendu « Diplome » ou « Sorti ».' },
        { status: 400 }
      );
    }
    if (!idPromotion && (!Array.isArray(idsEtudiants) || idsEtudiants.length === 0)) {
      return NextResponse.json(
        { error: 'Indiquez une promotion, ou la liste des étudiants concernés.' },
        { status: 400 }
      );
    }

    /* La clause sur "idUniversite" est la seule chose qui empêche un
       établissement de clore le rattachement des étudiants d'un autre.
       Elle ne doit jamais être omise, y compris pour la simulation. */
    const exclus = (exclusions || []).map(Number).filter(Boolean);
    const cibles = await client.query(`
      SELECT e."idEtudiant", e."idUtilisateur", e."nomEtudiant", e."prenomEtudiant",
             e."statutRattachement"
        FROM etudiant e
       WHERE e."idUniversite" = $1
         AND COALESCE(e."statutRattachement", 'Valide') = 'Valide'
         AND ($2::int IS NULL OR e."idPromotion" = $2)
         AND ($3::int[] IS NULL OR e."idEtudiant" = ANY($3))
         AND NOT (e."idEtudiant" = ANY($4::int[]))
       ORDER BY e."nomEtudiant"`,
      [
        payload.idUniversite,
        idPromotion || null,
        Array.isArray(idsEtudiants) && idsEtudiants.length ? idsEtudiants.map(Number) : null,
        exclus
      ]
    );

    /* La simulation renvoie qui serait touché, sans rien écrire. Une
       action portant sur quatre-vingts personnes mérite d'être vue avant
       d'être lancée — même raisonnement que la prévisualisation de
       l'import. */
    if (simulation) {
      return NextResponse.json({
        simulation: true,
        statut,
        concernes: cibles.rows.map(e => ({
          idEtudiant: e.idEtudiant,
          nom: `${e.prenomEtudiant} ${e.nomEtudiant}`
        })),
        total: cibles.rowCount,
        exclus: exclus.length
      }, { status: 200 });
    }

    if (cibles.rowCount === 0) {
      return NextResponse.json(
        { error: 'Aucun étudiant actif ne correspond à cette sélection.' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const ids = cibles.rows.map(e => e.idEtudiant);
    await client.query(
      `UPDATE etudiant
          SET "statutRattachement" = $1,
              "dateFinRattachement" = now(),
              "motifFinRattachement" = $2
        WHERE "idEtudiant" = ANY($3::int[])`,
      [statut, motif?.trim() || null, ids]
    );

    /* La promotion suit ses membres : quand plus aucun étudiant actif
       n'y figure, elle est close. Laisser une promotion « En cours »
       vide obligerait l'université à la clore une seconde fois, à la
       main. */
    let promotionClose = null;
    if (idPromotion) {
      const restants = await client.query(
        `SELECT count(*)::int AS n FROM etudiant
          WHERE "idPromotion" = $1
            AND COALESCE("statutRattachement", 'Valide') = 'Valide'`,
        [idPromotion]
      );
      if (restants.rows[0].n === 0) {
        const maj = await client.query(
          `UPDATE "Promotion" SET "statut" = $1
            WHERE "idPromotion" = $2 AND "idUniversite" = $3
            RETURNING "libelle", "annee", "statut"`,
          [statut === 'Diplome' ? 'Diplomee' : 'Archivee', idPromotion, payload.idUniversite]
        );
        promotionClose = maj.rows[0] || null;
      }
    }

    /* Notification par la messagerie interne (Lot 2.2). Elle est
       protégée par SAVEPOINT : l'échec d'un message ne doit pas annuler
       le changement de statut de quatre-vingts personnes. */
    const universite = await client.query(
      `SELECT un."nomUniversite", un."idUtilisateur"
         FROM universite un WHERE un."idUniversite" = $1`,
      [payload.idUniversite]
    );
    const nomUniversite = universite.rows[0]?.nomUniversite || 'Votre établissement';
    const expediteur = universite.rows[0]?.idUtilisateur;

    let notifies = 0;
    for (const etudiant of cibles.rows) {
      const contenu = statut === 'Diplome'
        ? `Félicitations ! ${nomUniversite} vous a déclaré diplômé. ` +
          `Votre compte reste actif : vous continuez à recevoir des recommandations ` +
          `et à candidater, désormais en tant qu'ancien étudiant de l'établissement.`
        : `${nomUniversite} a mis fin à votre rattachement à l'établissement` +
          `${motif?.trim() ? ` (motif : ${motif.trim()})` : ''}. ` +
          `Votre compte reste actif : vous pouvez continuer à utiliser la plateforme ` +
          `et rattacher un autre établissement depuis votre profil.`;

      const envoye = await envoyerMessageInterne(client, {
        idExpediteur: expediteur,
        idDestinataire: etudiant.idUtilisateur,
        contenu
      });
      if (envoye) notifies++;
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      statut,
      traites: ids.length,
      notifies,
      exclus: exclus.length,
      promotionClose,
      message:
        `${ids.length} étudiant${ids.length > 1 ? 's' : ''} ${LIBELLES[statut](ids.length)}` +
        `${exclus.length > 0 ? `, ${exclus.length} exclu${exclus.length > 1 ? 's' : ''} de l'opération` : ''}.` +
        (promotionClose ? ` La promotion « ${promotionClose.libelle} — ${promotionClose.annee} » est close.` : '')
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur cycle de vie du rattachement :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
