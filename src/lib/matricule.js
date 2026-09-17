/* =====================================================================
   LE MATRICULE

   Le numéro d'inscription qu'un établissement attribue à son étudiant.
   Sur la plateforme, il a trois rôles :

     1. permettre à l'établissement de RECONNAÎTRE l'étudiant qui demande
        son rattachement, en le comparant à ses registres ;
     2. servir de base à la VÉRIFICATION D'IDENTITÉ, qui n'est possible
        que si un matricule est renseigné, et qui tombe s'il change ;
     3. RAPPROCHER un étudiant déjà inscrit de la ligne qui le concerne
        dans le fichier d'une promotion importée, au lieu de lui créer un
        second compte.

   UNICITÉ PAR ÉTABLISSEMENT

   Un matricule n'identifie quelqu'un qu'à l'intérieur de son
   établissement : deux universités peuvent attribuer le même numéro à
   deux personnes différentes. L'unicité porte donc sur le couple
   (établissement, matricule), et elle est garantie par la base elle-même
   (index idx_etudiant_matricule_unique).

   Elle ne vaut que pour les étudiants qui OCCUPENT un matricule dans
   l'établissement : ni un étudiant refusé (ce numéro n'était pas le
   sien), ni un étudiant sorti (il l'a quitté) n'empêchent le vrai
   titulaire de s'inscrire.

   « ENI-2023-0142 », « eni-2023-0142 » et « ENI 2023 0142 » désignent le
   même matricule : la comparaison ignore la casse et les espaces.
   ===================================================================== */

export const INDEX_UNICITE_MATRICULE = 'idx_etudiant_matricule_unique';

/* Statuts pour lesquels un étudiant n'occupe plus de matricule dans
   l'établissement. Doit rester identique à la clause WHERE de l'index. */
export const STATUTS_SANS_MATRICULE = ['Refuse', 'Sorti'];

/** Forme de comparaison : majuscules, sans aucun espace. */
export function normaliserMatricule(matricule) {
  return String(matricule ?? '').toUpperCase().replace(/\s+/g, '');
}

/* Même normalisation, côté SQL. Doit rester identique à l'expression de
   l'index, sans quoi PostgreSQL ne s'en servirait pas. */
export const MATRICULE_SQL = `upper(regexp_replace(e."matricule", '\\s', '', 'g'))`;

/** Comparaison de noms de personnes : sans casse, accents ni ponctuation. */
export function memeNom(a, b) {
  const n = (t) => String(t ?? '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, ' ').trim();
  return n(a) === n(b);
}

/**
 * L'étudiant qui occupe ce matricule dans cet établissement, ou null.
 *
 * @param idEtudiantExclu  l'étudiant lui-même, lors d'une modification
 */
export async function titulaireDuMatricule(client, idUniversite, matricule, idEtudiantExclu = null) {
  const cle = normaliserMatricule(matricule);
  if (!idUniversite || !cle) return null;
  const { rows } = await client.query(
    `SELECT e."idEtudiant", e."nomEtudiant", e."prenomEtudiant", e."statutRattachement",
            u."compteActive", un."nomUniversite"
       FROM etudiant e
       JOIN utilisateur u ON u."idUtilisateur" = e."idUtilisateur"
       JOIN universite un ON un."idUniversite" = e."idUniversite"
      WHERE e."idUniversite" = $1
        AND ${MATRICULE_SQL} = $2
        AND COALESCE(e."statutRattachement", '') <> ALL($3)
        AND ($4::int IS NULL OR e."idEtudiant" <> $4)
      LIMIT 1`,
    [idUniversite, cle, STATUTS_SANS_MATRICULE, idEtudiantExclu]);
  return rows[0] || null;
}

/** Tous les matricules occupés d'un établissement, indexés par leur forme normalisée. */
export async function matriculesOccupes(client, idUniversite) {
  const { rows } = await client.query(
    `SELECT e."idEtudiant", e."nomEtudiant", e."prenomEtudiant", e."statutRattachement",
            e."idPromotion", ${MATRICULE_SQL} AS cle
       FROM etudiant e
      WHERE e."idUniversite" = $1
        AND e."matricule" IS NOT NULL AND btrim(e."matricule") <> ''
        AND COALESCE(e."statutRattachement", '') <> ALL($2)`,
    [idUniversite, STATUTS_SANS_MATRICULE]);
  return new Map(rows.map(r => [r.cle, r]));
}

export function estConflitMatricule(erreur) {
  return erreur?.code === '23505' && erreur.constraint === INDEX_UNICITE_MATRICULE;
}

/** Message affiché à un étudiant dont le matricule est déjà pris. */
export function messageMatriculePris(titulaire, pourLuiMeme = false) {
  const etablissement = titulaire?.nomUniversite || 'cet établissement';
  if (pourLuiMeme && titulaire && titulaire.compteActive === false) {
    return `${etablissement} vous a déjà inscrit sur Stage Share avec ce matricule. ` +
           "Activez ce compte avec le lien qu'il vous a transmis plutôt que d'en créer un second ; " +
           "si vous ne l'avez pas reçu, demandez-le à votre établissement.";
  }
  return `Ce matricule est déjà enregistré pour un autre étudiant de ${etablissement}. ` +
         "Vérifiez votre saisie ; s'il s'agit bien du vôtre, contactez votre établissement.";
}
