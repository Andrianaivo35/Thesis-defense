/* =====================================================================
   NETTOYAGE DE LA BASE — traces personnelles, comptes d'essai,
   incohérences

   Usage : node scripts/nettoyer-base.mjs

   POURQUOI

   La base traîne encore les comptes créés à la main pendant le
   développement initial : adresses personnelles en clair, noms réels,
   une université « Test », une annonce de cohorte rédigée en malgache
   pour essayer le formulaire. Tout cela s'affiche dans les listes, donc
   en démonstration et en soutenance.

   DEUX TRAITEMENTS, SELON CE QUE LA DONNÉE PORTE

   Supprimer n'est pas toujours le bon geste. Une entité d'essai qui ne
   porte rien se supprime ; une entité qui porte du corpus utile se
   RENOMME, sinon on détruit des offres et des candidatures pour un
   problème d'étiquette.

     supprimés   les comptes d'essai sans contenu propre, et les comptes
                 personnels — leurs profils, CV et candidatures partent
                 en cascade
     renommés    l'entreprise qui porte trois offres et cinq
                 candidatures, l'université réelle mal saisie, le compte
                 d'administration

   CONSÉQUENCE À NE PAS OUBLIER

   Supprimer des étudiants retire des contextes de la matrice de
   co-occurrence, et retire des CV du corpus de test. Les chiffres
   publiés dans MD/5 et MD/6 doivent donc être REMESURÉS après ce
   nettoyage. C'est fait, et les documents sont à jour.
   ===================================================================== */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});
const client = await pool.connect();

const compter = async (sql, params = []) =>
  Number((await client.query(sql, params)).rows[0].n);

await client.query('BEGIN');

/* ---------------------------------------------------------------------
   1. Comptes supprimés

   Tout part en cascade depuis "utilisateur" : profil, compétences,
   candidatures, CV, préférences, conversations. Les contraintes sont
   toutes en ON DELETE CASCADE, vérifié avant d'écrire ceci.
   --------------------------------------------------------------------- */
const A_SUPPRIMER = [
  'andrianaivo.fanomezantsoa35@gmail.com',  // compte personnel
  'rakoto@gmail.com',                        // compte d'essai
  'eddy.devoir@gmail.com',                   // compte personnel
  'test@univ.com'                            // université « Test », sans contenu
];

const avant = await compter('SELECT count(*)::int n FROM utilisateur');
const supprimes = await client.query(
  'DELETE FROM utilisateur WHERE "emailUtilisateur" = ANY($1) RETURNING "emailUtilisateur"',
  [A_SUPPRIMER]
);
console.log(`1. ${supprimes.rowCount} comptes supprimés (${avant} → ` +
            `${await compter('SELECT count(*)::int n FROM utilisateur')} utilisateurs)`);
for (const r of supprimes.rows) console.log(`     ${r.emailUtilisateur}`);

/* ---------------------------------------------------------------------
   2. L'annonce de cohorte d'essai

   Rédigée en malgache pour éprouver le formulaire, avec une filière en
   minuscules et sans date limite. Elle est remplacée par une annonce
   correctement remplie : laisser la table vide priverait le Lot 6 de
   tout point de départ visible.
   --------------------------------------------------------------------- */
await client.query(`DELETE FROM "AnnonceCohorte"`);

const universiteAnnonce = (await client.query(
  `SELECT "idUniversite" FROM universite
    WHERE "nomUniversite" ILIKE '%Antananarivo%' ORDER BY "idUniversite" LIMIT 1`
)).rows[0];

if (universiteAnnonce) {
  await client.query(`
    INSERT INTO "AnnonceCohorte"
      ("idUniversite", titre, description, "filiereConcernee", "niveauAcademique",
       "domainesRecherche", "periodeDebut", "periodeFin", "dureeStage",
       "villePreferee", "accepteTeletravail", statut, "datePublication", "dateLimite")
    VALUES ($1,
      'Recherche de stages — promotion Licence 3 Informatique',
      'Notre établissement recherche des structures d''accueil pour la promotion de Licence 3 en informatique. Les étudiants sont disponibles pour un stage conventionné de trois mois.',
      'Génie Logiciel', 'Licence 3', 'Développement web, développement mobile',
      current_date + 30, current_date + 120, '3 mois',
      'Antananarivo', 'Partiel', 'Active', now(), current_date + 21)`,
    [universiteAnnonce.idUniversite]);
}
console.log("2. Annonce de cohorte d'essai remplacée par une annonce correctement remplie");

/* ---------------------------------------------------------------------
   3. Entités renommées

   Elles portent du corpus utile : les supprimer coûterait des offres et
   des candidatures pour un simple problème de libellé.
   --------------------------------------------------------------------- */

/* Le compte d'administration : une adresse générique plutôt qu'une
   boîte personnelle. */
await client.query(
  `UPDATE utilisateur SET "emailUtilisateur" = 'admin@stageshare.mg'
    WHERE "emailUtilisateur" = 'admin@gmail.com'`);

/* L'université existe réellement — Athénée Saint Joseph Antsirabe. Elle
   avait été saisie sous son seul sigle, avec sa devise placée dans le
   champ « sigle ». */
const asja = (await client.query(
  `UPDATE universite SET "nomUniversite" = 'Athénée Saint Joseph Antsirabe',
                         "sigleUniversitaire" = 'ASJA'
    WHERE "nomUniversite" = 'ASJA' RETURNING "idUniversite", "idUtilisateur"`)).rows[0];
if (asja) {
  await client.query(
    `UPDATE utilisateur SET "emailUtilisateur" = 'contact@asja.demo.stageshare.mg'
      WHERE "idUtilisateur" = $1`, [asja.idUtilisateur]);
}

/* L'entreprise porte trois offres et cinq candidatures. On la renomme
   plutôt que de la détruire. Blueline est un opérateur malgache réel,
   absent du reste du corpus. */
const entreprise = (await client.query(
  `UPDATE entreprise SET "nomEntreprise" = 'Blueline Madagascar'
    WHERE "nomEntreprise" = 'Gamma Digital Madagascar'
    RETURNING "idEntreprise", "idUtilisateur"`)).rows[0];
if (entreprise) {
  await client.query(
    `UPDATE utilisateur SET "emailUtilisateur" = 'contact@blueline.demo.stageshare.mg'
      WHERE "idUtilisateur" = $1`, [entreprise.idUtilisateur]);
}
console.log('3. Compte administrateur, université et entreprise renommés');

/* ---------------------------------------------------------------------
   4. Incohérences de saisie

   Les trois premières offres datent des essais manuels : accent manquant
   dans un titre, ville non renseignée, dates limites dépassées alors que
   l'offre est annoncée active — une offre expirée mais « Active » est
   exactement le genre de détail qu'un jury remarque.
   --------------------------------------------------------------------- */
await client.query(
  `UPDATE offre SET titre = 'Stagiaire Développeur Front-End'
    WHERE titre = 'Stagiaire Developpeur Front-End'`);

const sansVille = await client.query(
  `UPDATE offre SET ville = 'Antananarivo'
    WHERE ville IS NULL OR btrim(ville) = '' RETURNING "idOffre"`);

const expirees = await client.query(
  `UPDATE offre
      SET "dateLimites" = current_date + (15 + ("idOffre" % 30))
    WHERE statut = 'Active' AND "dateLimites" < current_date
    RETURNING "idOffre"`);

/* Les recommandations mises en cache portaient sur des étudiants
   supprimés ou des scores calculés avant ce nettoyage. Elles se
   régénèrent à la demande ; les garder afficherait des résultats
   périmés. */
const recos = await client.query('DELETE FROM recommandation RETURNING 1');

console.log(`4. ${sansVille.rowCount} offres sans ville corrigées, ` +
            `${expirees.rowCount} dates limites dépassées repoussées, ` +
            `${recos.rowCount} recommandations périmées purgées`);

/* ---------------------------------------------------------------------
   5. Comptes dont le mot de passe s'est perdu

   Les trois comptes conservés au §3 dataient de la saisie manuelle
   initiale : leur mot de passe n'a jamais été noté nulle part. Après
   avoir changé leur adresse, plus personne ne pouvait y entrer — y
   compris dans le compte d'administration.

   Un compte inaccessible dans une base de démonstration est une
   incohérence au même titre qu'un nom d'essai. On les aligne donc sur le
   mot de passe des comptes engendrés.

   ⚠️ Base de démonstration uniquement. Un mot de passe partagé et écrit
   en clair dans un script n'a évidemment pas sa place en production ;
   c'est le Lot 6.2, avec ses jetons d'activation à usage unique, qui
   apportera le mécanisme correct. */
const MOT_DE_PASSE_DEMO = 'Demo1234!';
const empreinte = await bcrypt.hash(MOT_DE_PASSE_DEMO, 10);

const realignes = await client.query(
  `UPDATE utilisateur SET "motDePasse" = $1
    WHERE "emailUtilisateur" IN (
      'admin@stageshare.mg',
      'contact@asja.demo.stageshare.mg',
      'contact@blueline.demo.stageshare.mg')
    RETURNING "emailUtilisateur"`, [empreinte]);
console.log(`5. ${realignes.rowCount} comptes realignés sur le mot de passe de démonstration`);

await client.query('COMMIT');

/* ---------------------------------------------------------------------
   Contrôle final : plus aucune trace ne doit subsister
   --------------------------------------------------------------------- */
const restes = await client.query(`
  SELECT u."emailUtilisateur" AS email, u."typeUtilisateur" AS type
    FROM utilisateur u
   WHERE u."emailUtilisateur" !~* 'demo\\.stageshare\\.mg$'
     AND u."emailUtilisateur" !~* '^admin@stageshare\\.mg$'
   ORDER BY 2, 1`);

const nomsSuspects = await client.query(`
  SELECT 'etudiant' AS ou, "prenomEtudiant" || ' ' || "nomEtudiant" AS valeur
    FROM etudiant
   WHERE "nomEtudiant" ILIKE '%rafanomezana%' OR "prenomEtudiant" ILIKE '%eddy%'
      OR "nomEtudiant" ILIKE '%andrianaivo%'
   UNION ALL
  SELECT 'entreprise', "nomEntreprise" FROM entreprise WHERE "nomEntreprise" ILIKE '%gamma%'
   UNION ALL
  SELECT 'universite', "nomUniversite" FROM universite WHERE "nomUniversite" ILIKE '%test%'`);

console.log('\nContrôle final :');
console.log(`  adresses hors du domaine de démonstration : ${restes.rowCount}`);
for (const r of restes.rows) console.log(`     ${r.type} ${r.email}`);
console.log(`  noms personnels ou d'essai restants       : ${nomsSuspects.rowCount}`);
for (const r of nomsSuspects.rows) console.log(`     ${r.ou} « ${r.valeur} »`);

const bilan = await client.query(`
  SELECT (SELECT count(*)::int FROM utilisateur) utilisateurs,
         (SELECT count(*)::int FROM etudiant)    etudiants,
         (SELECT count(*)::int FROM entreprise)  entreprises,
         (SELECT count(*)::int FROM universite)  universites,
         (SELECT count(*)::int FROM offre)       offres,
         (SELECT count(*)::int FROM "Candidature") candidatures`);
console.log('\nBilan :');
console.table(bilan.rows);

client.release();
await pool.end();
