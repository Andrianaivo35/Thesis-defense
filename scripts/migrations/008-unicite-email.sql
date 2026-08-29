-- =====================================================================
-- 008 — Unicité de l'adresse électronique et du lien profil ↔ compte
--
-- Contexte
--   Il n'existait AUCUNE contrainte d'unicité sur
--   utilisateur."emailUtilisateur". Les routes d'inscription
--   procédaient par « vérifier puis insérer », sans verrou : entre le
--   SELECT et l'INSERT, rien n'empêchait une seconde requête de passer.
--
--   Le défaut était jusqu'ici théorique — les inscriptions arrivent une
--   par une, et la fenêtre est étroite. Il devient GARANTI avec l'import
--   de promotions du Lot 6.3 : un double clic sur « importer », un
--   fichier envoyé deux fois, et ce sont des centaines de comptes en
--   double qui apparaissent d'un coup.
--
--   La conséquence est grave et silencieuse. La connexion lit `rows[0]`
--   d'un SELECT sans ORDER BY : face à deux comptes de même adresse,
--   PostgreSQL est libre de renvoyer l'un ou l'autre. L'utilisateur
--   entrerait le bon mot de passe et se verrait refuser l'accès une fois
--   sur deux, sans qu'aucune erreur ne soit journalisée.
--
-- POURQUOI UN INDEX FONCTIONNEL SUR lower() ET NON UN SIMPLE UNIQUE
--
--   Une contrainte UNIQUE ordinaire compare les chaînes telles quelles.
--   « Jean@Univ.mg » et « jean@univ.mg » seraient donc deux comptes
--   distincts — alors que ce sont, pour tout fournisseur de messagerie,
--   la même boîte. L'utilisateur créerait un doublon sans le vouloir,
--   puis échouerait à se connecter selon la casse employée.
--
--   L'index sur lower() ferme cette porte au niveau de la base, et non
--   du code. C'est délibéré : le code applique désormais la
--   normalisation (src/lib/email.js), mais un futur chemin d'écriture
--   pourrait l'oublier. La base, elle, ne l'oubliera pas.
--
-- Unicité de "idUtilisateur" sur les profils
--
--   Seule la table admin la possédait. Rien n'empêchait deux fiches
--   étudiant de pointer vers le même compte — auquel cas le profil
--   affiché dépendrait de l'ordre de lecture.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

-- --- 1. Normalisation préalable ---------------------------------------
-- Sans elle, la création de l'index échouerait sur des adresses ne
-- différant que par la casse ou des espaces de bord.
UPDATE public.utilisateur
   SET "emailUtilisateur" = lower(btrim("emailUtilisateur"))
 WHERE "emailUtilisateur" <> lower(btrim("emailUtilisateur"));

-- --- 2. Unicité de l'adresse, insensible à la casse --------------------
CREATE UNIQUE INDEX IF NOT EXISTS "idx_utilisateur_email_unique"
  ON public.utilisateur (lower("emailUtilisateur"));

-- --- 3. Un profil au plus par compte -----------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['etudiant', 'entreprise', 'universite'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
       WHERE conname = t || '_idUtilisateur_key'
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE ("idUtilisateur")',
        t, t || '_idUtilisateur_key'
      );
    END IF;
  END LOOP;
END $$;
