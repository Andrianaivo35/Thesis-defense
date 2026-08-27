-- =====================================================================
-- 001 — Rattachement d'un étudiant à son université : ajout d'un statut
--
-- Contexte
--   Jusqu'ici, un étudiant était rattaché à une université par simple
--   déclaration : aucune validation n'était demandée à l'établissement, et
--   aucun rattachement différé n'existait réellement (le message affiché à
--   l'étudiant le promettait pourtant).
--
--   On introduit un statut de rattachement, validé par l'université.
--
-- Valeurs
--   'En attente' : l'étudiant s'est déclaré, l'université n'a pas encore statué
--   'Valide'     : l'université a confirmé le rattachement
--   'Refuse'     : l'université a refusé (l'étudiant n'apparaît plus chez elle)
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

ALTER TABLE public.etudiant
  ADD COLUMN IF NOT EXISTS "statutRattachement" character varying(20);

ALTER TABLE public.etudiant
  ADD COLUMN IF NOT EXISTS "dateRattachement" timestamp without time zone;

-- Les étudiants déjà rattachés avant cette migration sont considérés comme
-- validés : leur rattachement était acquis, on ne le remet pas en cause.
UPDATE public.etudiant
SET "statutRattachement" = 'Valide',
    "dateRattachement" = COALESCE("dateRattachement", now())
WHERE "idUniversite" IS NOT NULL
  AND "statutRattachement" IS NULL;

-- Étudiants sans université rattachée : aucun statut tant qu'aucune
-- université n'est revendiquée.
UPDATE public.etudiant
SET "statutRattachement" = NULL
WHERE "idUniversite" IS NULL;

-- Index : l'écran université filtre systématiquement sur ce couple.
CREATE INDEX IF NOT EXISTS "idx_etudiant_universite_statut"
  ON public.etudiant ("idUniversite", "statutRattachement");
