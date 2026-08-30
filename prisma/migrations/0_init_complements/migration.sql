-- =====================================================================
-- Complements de la ligne de base
--
-- POURQUOI CE FICHIER EXISTE
--
--   La migration 0_init est engendree par Prisma a partir de la base
--   reelle. Prisma ne sait pourtant pas TOUT exprimer : sept objets sont
--   perdus a la generation, et ils portent des garanties essentielles.
--
--   Les index PARTIELS (clause WHERE) survivent ; les index
--   FONCTIONNELS (portant sur une expression, ici lower(...)) et les
--   contraintes CHECK, non.
--
--   Sans ce fichier, une base recreee a partir des migrations
--   accepterait « Jean@Univ.mg » et « jean@univ.mg » comme deux comptes
--   distincts — c'est-a-dire exactement le defaut que le Lot 6.1 avait
--   ferme. Le manque serait silencieux : aucune erreur, seulement des
--   doublons qui apparaissent des le premier import.
--
--   C'est la limite connue de tout outil de migration declaratif. La
--   reponse habituelle est celle-ci : une migration ecrite a la main,
--   appliquee juste apres la ligne de base.
--
-- Idempotent : peut etre rejoue sans effet de bord.
-- =====================================================================

-- --- 1. Index fonctionnels (Prisma ne represente pas les expressions) --

-- Unicite de l'adresse INSENSIBLE A LA CASSE. Voir migration 008.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_utilisateur_email_unique"
  ON public.utilisateur (lower("emailUtilisateur"));

-- Un meme terme n'est propose qu'une fois par CV. Voir migration 007.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_competence_detectee_unique"
  ON public."CompetenceDetectee" ("idCV", lower("termeDetecte"));

-- Une seule promotion par (etablissement, libelle, annee), la casse du
-- libelle etant sans importance. Voir migration 010.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_promotion_unique"
  ON public."Promotion" ("idUniversite", lower("libelle"), "annee");

-- --- 2. Contraintes CHECK (non supportees par Prisma) ------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'etudiant_statutRattachement_check') THEN
    ALTER TABLE public.etudiant
      ADD CONSTRAINT "etudiant_statutRattachement_check"
      CHECK ("statutRattachement" IS NULL OR "statutRattachement" IN
             ('En attente', 'Valide', 'Refuse', 'Diplome', 'Sorti'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Promotion_statut_check') THEN
    ALTER TABLE public."Promotion"
      ADD CONSTRAINT "Promotion_statut_check"
      CHECK ("statut" IN ('Active', 'Diplomee', 'Archivee'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JetonUtilisateur_type_check') THEN
    ALTER TABLE public."JetonUtilisateur"
      ADD CONSTRAINT "JetonUtilisateur_type_check"
      CHECK ("type" IN ('activation', 'reinitialisation'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FileCourriel_statut_check') THEN
    ALTER TABLE public."FileCourriel"
      ADD CONSTRAINT "FileCourriel_statut_check"
      CHECK ("statut" IN ('en_attente', 'envoye', 'echec', 'abandonne'));
  END IF;
END $$;
