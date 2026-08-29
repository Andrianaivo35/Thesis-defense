-- =====================================================================
-- 010 — Promotions : l'unité de gestion de l'université
--
-- POURQUOI
--
--   Une université ne raisonne pas en individus mais en promotions.
--   « La L3 Informatique 2026 est diplômée » doit être une action en un
--   geste, pas quatre-vingts. Sans cette entité, les actions de cycle de
--   vie du Lot 6.5 seraient inutilisables à l'échelle réelle, et l'écran
--   université resterait une liste de plusieurs centaines de noms.
--
-- ARBITRAGE : PROMOTION CONTRE "EtudiantExterne"
--
--   Le backlog demandait de trancher entre deux notions parallèles
--   d'« étudiant rattaché à une université ». Elles coexistaient sans
--   rôle distinct, ce qui est une dette.
--
--     "AnnonceCohorte"  une université publie « je cherche des stages
--                       pour un groupe d'étudiants ». C'est une DEMANDE
--                       adressée aux entreprises. Rôle légitime, on la
--                       garde.
--
--     "EtudiantExterne" les étudiants de cette annonce, SANS compte,
--                       avec un CV en base64. C'était le seul moyen, pour
--                       une université, de présenter ses étudiants sans
--                       les inscrire un par un.
--
--   Le Lot 6.3 a supprimé cette raison d'être : l'université importe
--   désormais sa promotion et chacun obtient un vrai compte, un vrai
--   profil, un vrai CV analysable. Une liste parallèle de noms sans
--   compte n'apporte plus rien et prive ces étudiants de tout le reste
--   de la plateforme.
--
--   DÉCISION : la promotion devient l'unité de rattachement.
--   "EtudiantExterne" est ABANDONNÉE — plus aucune écriture. La table
--   n'est pas supprimée ici : elle est vide, et détruire une structure
--   n'apporte rien de plus que cesser de s'en servir. Sa suppression
--   sera un nettoyage de schéma, pas une migration de données.
--
--   "AnnonceCohorte" reçoit "idPromotion" : une annonce peut désormais
--   désigner une promotion réelle, et l'entreprise qui la consulte voit
--   de véritables profils au lieu d'une liste de noms.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public."Promotion" (
    "idPromotion"    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "idUniversite"   integer NOT NULL
        REFERENCES public.universite("idUniversite") ON DELETE CASCADE,

    -- Ce que l'université écrit sur ses documents : « L3 Informatique »
    "libelle"        character varying(120) NOT NULL,
    -- Forme « 2025-2026 ». Une promotion se définit par son année : deux
    -- « L3 Informatique » d'années différentes sont deux promotions.
    "annee"          character varying(9) NOT NULL,

    -- Reprises sur chaque étudiant importé, ce qui évite de ressaisir la
    -- filière pour quatre-vingts personnes identiques.
    "niveauAcademique" character varying(50),
    "filiere"          character varying(150),
    "specialisation"   character varying(150),

    -- 'Active' | 'Diplomee' | 'Archivee'. Le Lot 6.5 s'en servira ;
    -- la colonne est posée maintenant pour éviter une seconde migration.
    "statut"         character varying(20) NOT NULL DEFAULT 'Active',

    "dateCreation"   timestamp without time zone DEFAULT now() NOT NULL
);

-- Deux promotions de même libellé et même année dans un établissement
-- seraient forcément la même : l'import doit retrouver l'existante au
-- lieu d'en créer une seconde.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_promotion_unique"
  ON public."Promotion" ("idUniversite", lower("libelle"), "annee");

CREATE INDEX IF NOT EXISTS "idx_promotion_universite"
  ON public."Promotion" ("idUniversite");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Promotion_statut_check') THEN
    ALTER TABLE public."Promotion"
      ADD CONSTRAINT "Promotion_statut_check"
      CHECK ("statut" IN ('Active', 'Diplomee', 'Archivee'));
  END IF;
END $$;

-- --- Rattachement de l'étudiant ---------------------------------------
--
-- ON DELETE SET NULL, jamais CASCADE : supprimer une promotion ne doit
-- en aucun cas supprimer des étudiants. Ils perdent leur groupe, pas
-- leur compte, leurs candidatures ni leurs CV.
ALTER TABLE public.etudiant
  ADD COLUMN IF NOT EXISTS "idPromotion" integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'etudiant_idPromotion_fkey') THEN
    ALTER TABLE public.etudiant
      ADD CONSTRAINT "etudiant_idPromotion_fkey"
      FOREIGN KEY ("idPromotion") REFERENCES public."Promotion"("idPromotion")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_etudiant_promotion"
  ON public.etudiant ("idPromotion");

-- --- Une annonce peut désigner une promotion ---------------------------
ALTER TABLE public."AnnonceCohorte"
  ADD COLUMN IF NOT EXISTS "idPromotion" integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AnnonceCohorte_idPromotion_fkey') THEN
    ALTER TABLE public."AnnonceCohorte"
      ADD CONSTRAINT "AnnonceCohorte_idPromotion_fkey"
      FOREIGN KEY ("idPromotion") REFERENCES public."Promotion"("idPromotion")
      ON DELETE SET NULL;
  END IF;
END $$;
