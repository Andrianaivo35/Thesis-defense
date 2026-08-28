-- =====================================================================
-- 007 — Analyse des CV : texte extrait et compétences détectées
--
-- Contexte
--   Le Lot 3 a créé la bibliothèque de CV : l'étudiant dépose un fichier,
--   l'entreprise peut le télécharger. Mais le CV restait un octet-stream
--   opaque — jamais lu par la plateforme. Or « recommander à partir du
--   CV » est le sujet annoncé du mémoire.
--
-- Ce que fait cette migration
--
--   1. Sur "CV", les colonnes du RÉSULTAT D'ANALYSE. On conserve le texte
--      brut extrait, la voie empruntée (native / OCR / mixte) et la
--      confiance OCR. Ces trois informations servent directement au
--      chapitre d'évaluation : « X % des CV ont nécessité l'OCR,
--      confiance moyenne Y ».
--
--   2. La table "CompetenceDetectee" : ce que le pipeline a cru lire.
--
-- Pourquoi une table séparée plutôt qu'écrire directement dans
-- "CompetenceEtudiant"
--
--   Parce que l'OCR et l'extraction ne seront jamais fiables à 100 %.
--   Écrire directement dans le profil reviendrait à corrompre
--   silencieusement les données de l'étudiant sur une erreur de lecture.
--
--   La détection est donc une PROPOSITION, que l'étudiant confirme ou
--   rejette. La colonne "decision" reste NULL tant qu'il n'a pas tranché.
--
--   Cette séparation a un second usage, décisif pour le mémoire : elle
--   conserve l'état AVANT et APRÈS l'arbitrage humain. C'est exactement
--   ce qu'il faut pour mesurer la précision et le rappel de l'extraction
--   (PLAN §5.3) — sans elle, la correction humaine effacerait la trace de
--   l'erreur, et le chapitre d'évaluation n'aurait rien à mesurer.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

-- --- 1. Résultat d'analyse porté par le CV -----------------------------

ALTER TABLE public."CV"
  -- 'en_attente' | 'en_cours' | 'analyse' | 'echec'
  ADD COLUMN IF NOT EXISTS "statutAnalyse"  character varying(20) NOT NULL DEFAULT 'en_attente',
  -- Texte brut, toutes pages concaténées. Conservé pour le retraitement
  -- (un futur extracteur pourra rejouer sans redemander le fichier) et
  -- pour la recherche plein texte.
  ADD COLUMN IF NOT EXISTS "texteExtrait"   text,
  ADD COLUMN IF NOT EXISTS "nombrePages"    integer,
  -- Nombre de pages passées par l'OCR. 0 = CV entièrement natif.
  ADD COLUMN IF NOT EXISTS "pagesOcr"       integer,
  -- Confiance moyenne de l'OCR sur les pages concernées, en pourcentage.
  -- NULL si aucune page n'a nécessité l'OCR.
  ADD COLUMN IF NOT EXISTS "confianceOcr"   numeric(5,2),
  ADD COLUMN IF NOT EXISTS "dateAnalyse"    timestamp without time zone,
  -- Message d'erreur en clair si "statutAnalyse" = 'echec'
  ADD COLUMN IF NOT EXISTS "messageAnalyse" text;

-- --- 2. Compétences proposées par le pipeline --------------------------

CREATE TABLE IF NOT EXISTS public."CompetenceDetectee" (
    "idCompetenceDetectee"  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "idCV"                  integer NOT NULL
        REFERENCES public."CV"("idCV") ON DELETE CASCADE,

    -- NULL lorsque le terme lu ne correspond à aucune entrée du
    -- référentiel. On le conserve tout de même : c'est une candidature à
    -- l'enrichissement du vocabulaire (PLAN §5.2 étape 5), soumise à
    -- validation plutôt qu'inventée en base.
    "idCompetenceReference" integer
        REFERENCES public."CompetenceReference"("idCompetenceReference") ON DELETE CASCADE,

    -- Le terme tel qu'il a été lu dans le CV, avant correction. C'est lui
    -- qui porte la trace de l'erreur OCR : « Javascrpt » face à
    -- « Javascript ».
    "termeDetecte"          character varying(150) NOT NULL,

    -- 'exacte' | 'floue' | 'inconnue'
    "methode"               character varying(20) NOT NULL,
    -- 0 à 1. Combine la qualité de l'appariement et la pertinence de la
    -- section où le terme a été lu.
    "confiance"             numeric(4,3) NOT NULL,

    -- Page d'origine et section détectée : permettent d'expliquer à
    -- l'étudiant POURQUOI une compétence lui est proposée.
    "page"                  integer,
    "section"               character varying(40),
    -- La ligne d'origine, affichée comme justification
    "contexte"              text,

    -- NULL = l'étudiant n'a pas encore tranché.
    -- 'confirmee' | 'rejetee'
    "decision"              character varying(15),
    "dateDecision"          timestamp without time zone,

    "dateDetection"         timestamp without time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_competence_detectee_cv"
  ON public."CompetenceDetectee" ("idCV");

-- Un même terme ne doit être proposé qu'une fois par CV, même s'il
-- apparaît dans plusieurs sections. La détection retient l'occurrence la
-- plus fiable.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_competence_detectee_unique"
  ON public."CompetenceDetectee" ("idCV", lower("termeDetecte"));
