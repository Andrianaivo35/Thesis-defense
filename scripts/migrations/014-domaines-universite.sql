-- =====================================================================
-- 014 — Les domaines enseignés par chaque université
--
-- POURQUOI
--
--   À l'inscription, l'étudiant choisit son université PUIS sa filière,
--   dans deux listes indépendantes. Rien n'empêche donc de déclarer
--   « École Nationale d'Informatique » et « Hôtellerie et Tourisme ».
--
--   La saisie est fausse, personne ne le remarque, et elle se propage :
--   le score de filière compare une spécialité inexistante, les
--   recommandations s'appuient dessus, et l'université découvre
--   l'incohérence en validant le rattachement — quand elle la remarque.
--
--   Une école qui n'enseigne qu'une chose ne doit proposer que cette
--   chose. C'est une contrainte que la plateforme peut connaître.
--
-- D'OÙ VIENNENT CES DOMAINES
--
--   Ils sont d'abord DÉDUITS des étudiants déjà rattachés : si les
--   quatre inscrits de l'ENI sont tous en informatique, c'est le domaine
--   de l'établissement. C'est une amorce, pas une vérité — une
--   université qui vient d'arriver n'a aucun étudiant, et un
--   établissement pluridisciplinaire dont un seul étudiant s'est inscrit
--   paraîtrait monodisciplinaire.
--
--   L'université reste donc maîtresse de sa liste, qu'elle corrige
--   depuis son profil.
--
-- LA LISTE VIDE N'EST PAS UNE LISTE FERMÉE
--
--   Une université sans domaine déclaré n'impose AUCUNE restriction.
--   C'est délibéré : traiter « je ne sais pas » comme « rien n'est
--   autorisé » bloquerait tous les étudiants d'un établissement qui
--   vient de s'inscrire — exactement le genre d'impasse silencieuse que
--   ce projet a déjà rencontrée avec le rattachement.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public."UniversiteDomaine" (
    "idUniversiteDomaine" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "idUniversite"        integer NOT NULL
        REFERENCES public.universite("idUniversite") ON DELETE CASCADE,
    -- Libellé issu du référentiel des domaines (src/lib/referentiels.js)
    "domaine"             character varying(150) NOT NULL,
    "dateAjout"           timestamp without time zone DEFAULT now() NOT NULL
);

-- Un domaine ne figure qu'une fois par établissement.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_universite_domaine_unique"
  ON public."UniversiteDomaine" ("idUniversite", "domaine");

-- --- Amorce : ce que les étudiants déjà rattachés révèlent ------------
--
-- ON CONFLICT DO NOTHING rend l'opération rejouable, et surtout
-- n'écrase JAMAIS une liste que l'université aurait corrigée à la main.
INSERT INTO public."UniversiteDomaine" ("idUniversite", "domaine")
SELECT DISTINCT e."idUniversite", e."filiere"
  FROM public.etudiant e
 WHERE e."idUniversite" IS NOT NULL
   AND e."filiere" IS NOT NULL
   AND btrim(e."filiere") <> ''
ON CONFLICT DO NOTHING;
