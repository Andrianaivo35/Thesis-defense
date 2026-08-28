-- =====================================================================
-- 002 — Bibliothèque de CV de l'étudiant
--
-- Contexte
--   Le CV n'existait qu'au niveau de la candidature (Candidature.cv, une
--   chaîne de caractères) ou de l'import de cohorte (EtudiantExterne.cvPdf,
--   du base64). Aucune entité CV au niveau du profil étudiant : l'étudiant
--   devait donc redéposer son CV à chaque candidature.
--
--   Par ailleurs, les fichiers étaient écrits dans public/uploads/, que
--   Next.js ne sert qu'à partir de son état au moment du build : en
--   production, un CV déposé après le build renvoyait 404 et l'entreprise
--   ne pouvait jamais le consulter.
--
-- Ce que fait cette migration
--   - table "CV" : la bibliothèque de CV d'un étudiant
--   - Candidature."idCV" : la candidature référence un CV de la
--     bibliothèque au lieu de porter un chemin en texte libre
--   - les chemins stockés sont désormais relatifs à un volume dédié,
--     hors de public/
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public."CV" (
    "idCV"                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "idEtudiant"          integer NOT NULL
        REFERENCES public.etudiant("idEtudiant") ON DELETE CASCADE,
    -- Nom donné par l'étudiant, ex. « CV Développement web »
    "libelle"             character varying(150) NOT NULL,
    -- Nom du fichier sur le volume (jamais un chemin fourni par le client)
    "nomFichier"          character varying(255) NOT NULL,
    -- Nom d'origine, réaffiché au téléchargement
    "nomFichierOriginal"  character varying(255),
    "tailleOctets"        integer,
    -- Un seul CV principal par étudiant : proposé par défaut à la candidature
    "estPrincipal"        boolean DEFAULT false NOT NULL,
    "dateAjout"           timestamp without time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_cv_etudiant"
  ON public."CV" ("idEtudiant");

-- Un seul CV principal par étudiant, garanti par la base et non par le code
CREATE UNIQUE INDEX IF NOT EXISTS "idx_cv_principal_unique"
  ON public."CV" ("idEtudiant") WHERE "estPrincipal";

-- La candidature référence un CV de la bibliothèque.
-- ON DELETE SET NULL : supprimer un CV ne doit jamais détruire l'historique
-- des candidatures déjà envoyées.
ALTER TABLE public."Candidature"
  ADD COLUMN IF NOT EXISTS "idCV" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Candidature_idCV_fkey'
  ) THEN
    ALTER TABLE public."Candidature"
      ADD CONSTRAINT "Candidature_idCV_fkey"
      FOREIGN KEY ("idCV") REFERENCES public."CV"("idCV") ON DELETE SET NULL;
  END IF;
END $$;

-- Nom du fichier de la lettre de motivation sur le volume.
-- La lettre reste propre à une candidature : elle n'entre pas dans la
-- bibliothèque, mais quitte elle aussi public/.
ALTER TABLE public."Candidature"
  ADD COLUMN IF NOT EXISTS "nomFichierLettre" character varying(255);
