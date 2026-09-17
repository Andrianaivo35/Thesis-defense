import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { obtenirMatrice, invaliderCache, competencesProches } from '@/lib/cooccurrence';
import {
  CATEGORIES_COMPETENCE, DESCRIPTION_COMPETENCE_MIN, DESCRIPTION_COMPETENCE_MAX
} from '@/lib/referentiels';

/* =====================================================================
   /api/admin/competences — le référentiel de compétences

   GET              le référentiel, avec le nombre d'étudiants, d'offres et
                    de CV qui emploient chaque compétence
   GET ?proches=id  les compétences les plus proches de celle-ci
   POST             ajoute une compétence
   PATCH            modifie une compétence (nom, catégorie, description)

   POURQUOI LA DESCRIPTION EST OBLIGATOIRE

   Elle n'est pas décorative : la mesure de similarité entre compétences
   repose à 60 % sur le vocabulaire commun des descriptions. Une compétence
   sans description n'est proche d'aucune autre, et ne profite donc jamais
   du rapprochement « React est proche de Vue.js ». La réponse renvoie les
   compétences voisines calculées, pour que l'administrateur voie aussitôt
   si sa description rapproche la compétence de celles qu'il attendait.

   PAS DE SUPPRESSION

   Retirer une compétence effacerait en cascade les compétences déclarées
   par les étudiants et exigées par les offres. Ce n'est pas un geste
   d'administration courante : il n'est pas proposé.
   ===================================================================== */

function authentifierAdmin(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const payload = verifyToken(token);
  return payload && payload.typeUtilisateur === 'Admin' ? payload : null;
}

const CATEGORIES = CATEGORIES_COMPETENCE.map(c => c.valeur);

/* Deux noms qui ne diffèrent que par la casse, les accents ou la
   ponctuation désignent la même compétence : « NodeJS », « Node.js » et
   « node js » ne doivent pas coexister dans le référentiel. */
const NOM_NORMALISE_SQL = `
  regexp_replace(
    lower(translate("nomCompetenceReference",
      'àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ', 'aaaeeeeiioouuuycAAAEEEEIIOOUUUYC')),
    '[^a-z0-9+#]+', '', 'g')`;

function normaliserNom(nom) {
  return nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9+#]+/g, '');
}

/* Contrôle commun à l'ajout et à la modification. Renvoie un message
   d'erreur, ou null. `partiel` autorise l'absence des champs non fournis. */
function valider({ nom, categorie, description }, partiel = false) {
  if (!partiel || nom !== undefined) {
    if (!nom || !nom.trim()) return 'Le nom de la compétence est obligatoire.';
    if (nom.trim().length > 100) return 'Le nom ne doit pas dépasser 100 caractères.';
  }
  if (!partiel || categorie !== undefined) {
    if (!CATEGORIES.includes(categorie)) return 'Choisissez une catégorie dans la liste.';
  }
  if (!partiel || description !== undefined) {
    const d = (description || '').trim();
    if (d.length < DESCRIPTION_COMPETENCE_MIN) {
      return `La description doit compter au moins ${DESCRIPTION_COMPETENCE_MIN} caractères : ` +
             "c'est elle qui permet de rapprocher cette compétence des autres.";
    }
    if (d.length > DESCRIPTION_COMPETENCE_MAX) {
      return `La description ne doit pas dépasser ${DESCRIPTION_COMPETENCE_MAX} caractères.`;
    }
  }
  return null;
}

async function nomDejaPris(client, nom, idExclu = null) {
  const { rows } = await client.query(
    `SELECT "nomCompetenceReference" FROM "CompetenceReference"
      WHERE ${NOM_NORMALISE_SQL} = $1 AND ($2::int IS NULL OR "idCompetenceReference" <> $2)`,
    [normaliserNom(nom), idExclu]);
  return rows[0]?.nomCompetenceReference || null;
}

/* La matrice est recalculée après chaque écriture : le cache servirait
   sinon, pendant cinq minutes, des similarités qui ignorent la nouvelle
   description. */
async function voisines(client, id) {
  invaliderCache();
  const matrice = await obtenirMatrice(client, true);
  return competencesProches(matrice, id, 5);
}

export async function GET(req) {
  if (!authentifierAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const client = await pool.connect();
  try {
    const proches = new URL(req.url).searchParams.get('proches');
    if (proches) {
      const matrice = await obtenirMatrice(client);
      return NextResponse.json({ proches: competencesProches(matrice, Number(proches), 5) });
    }
    const { rows } = await client.query(`
      SELECT cr."idCompetenceReference", cr."nomCompetenceReference",
             cr."categorieCompetenceReference", cr."description",
             (SELECT count(*)::int FROM "CompetenceEtudiant" ce
               WHERE ce."idCompetenceReference" = cr."idCompetenceReference") AS "etudiants",
             (SELECT count(*)::int FROM "CompetenceOffre" co
               WHERE co."idCompetenceReference" = cr."idCompetenceReference") AS "offres",
             (SELECT count(*)::int FROM "CompetenceDetectee" cd
               WHERE cd."idCompetenceReference" = cr."idCompetenceReference") AS "detections"
        FROM "CompetenceReference" cr
       ORDER BY cr."categorieCompetenceReference", cr."nomCompetenceReference"`);
    return NextResponse.json({ competences: rows, categories: CATEGORIES_COMPETENCE });
  } catch (error) {
    console.error('Erreur GET admin/competences :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req) {
  if (!authentifierAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const client = await pool.connect();
  try {
    const { nom, categorie, description } = await req.json();
    const erreur = valider({ nom, categorie, description });
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });

    const existant = await nomDejaPris(client, nom);
    if (existant) {
      return NextResponse.json(
        { error: `Cette compétence existe déjà dans le référentiel : « ${existant} ».` },
        { status: 409 });
    }

    const { rows: [cree] } = await client.query(
      `INSERT INTO "CompetenceReference"
         ("nomCompetenceReference", "categorieCompetenceReference", "description")
       VALUES ($1, $2, $3)
       RETURNING "idCompetenceReference", "nomCompetenceReference",
                 "categorieCompetenceReference", "description"`,
      [nom.trim(), categorie, description.trim()]);

    return NextResponse.json({
      message: `« ${cree.nomCompetenceReference} » a été ajoutée au référentiel.`,
      competence: { ...cree, etudiants: 0, offres: 0, detections: 0 },
      proches: await voisines(client, cree.idCompetenceReference),
    }, { status: 201 });
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cette compétence existe déjà dans le référentiel.' }, { status: 409 });
    }
    console.error('Erreur POST admin/competences :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PATCH(req) {
  if (!authentifierAdmin(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const client = await pool.connect();
  try {
    const { idCompetenceReference, nom, categorie, description } = await req.json();
    const id = Number(idCompetenceReference);
    if (!id) return NextResponse.json({ error: 'Compétence non précisée.' }, { status: 400 });

    const erreur = valider({ nom, categorie, description }, true);
    if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });

    if (nom !== undefined) {
      const existant = await nomDejaPris(client, nom, id);
      if (existant) {
        return NextResponse.json(
          { error: `Une autre compétence porte déjà ce nom : « ${existant} ».` }, { status: 409 });
      }
    }

    const { rows } = await client.query(
      `UPDATE "CompetenceReference"
          SET "nomCompetenceReference" = COALESCE($1, "nomCompetenceReference"),
              "categorieCompetenceReference" = COALESCE($2, "categorieCompetenceReference"),
              "description" = COALESCE($3, "description")
        WHERE "idCompetenceReference" = $4
        RETURNING "idCompetenceReference", "nomCompetenceReference",
                  "categorieCompetenceReference", "description"`,
      [nom?.trim() ?? null, categorie ?? null, description?.trim() ?? null, id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Compétence introuvable.' }, { status: 404 });

    return NextResponse.json({
      message: `« ${rows[0].nomCompetenceReference} » a été mise à jour.`,
      competence: rows[0],
      proches: await voisines(client, id),
    });
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Une autre compétence porte déjà ce nom.' }, { status: 409 });
    }
    console.error('Erreur PATCH admin/competences :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
