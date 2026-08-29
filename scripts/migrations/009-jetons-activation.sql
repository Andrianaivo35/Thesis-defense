-- =====================================================================
-- 009 — Jetons à usage unique : activation et réinitialisation
--
-- DEUX BESOINS, UNE SEULE MÉCANIQUE
--
--   Une université qui inscrit sa promotion (Lot 6.3) doit donner un
--   accès à chaque étudiant. La solution naïve est le mot de passe
--   temporaire envoyé par courriel. Elle est mauvaise :
--
--     - le mot de passe reste en clair dans la boîte de réception, pour
--       toujours ;
--     - il est choisi par le système, donc il échappe à la politique de
--       robustesse posée au Lot 4.3 ;
--     - il est souvent conservé tel quel par l'étudiant.
--
--   Le lien d'activation à usage unique répond aux trois : rien de
--   réutilisable ne circule, et c'est l'étudiant qui choisit son mot de
--   passe, donc il passe par la validation existante.
--
--   Or c'est EXACTEMENT le mécanisme de la réinitialisation de mot de
--   passe oublié. Une seule table, une seule logique, deux usages.
--
-- POURQUOI LE JETON EST HACHÉ
--
--   Un jeton en clair en base est un mot de passe en clair. Une lecture
--   de la table — sauvegarde égarée, injection SQL, accès d'un
--   prestataire — donnerait la main sur tous les comptes en attente.
--
--   On stocke donc son empreinte SHA-256. Le jeton complet n'existe que
--   dans le courriel envoyé.
--
--   SHA-256 et non bcrypt : bcrypt est lent EXPRÈS, pour protéger des
--   secrets à faible entropie que l'on peut deviner. Un jeton de 256
--   bits tiré au hasard ne se devine pas ; le ralentir n'apporte rien et
--   interdirait la recherche par index, qui est ici indispensable.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

-- --- 1. État d'activation du compte ------------------------------------
--
-- Par défaut à `true` : tous les comptes existants ont été créés avec un
-- mot de passe choisi par leur titulaire. Seuls les comptes engendrés par
-- une université naîtront inactifs, sans mot de passe, en attente du lien.
ALTER TABLE public.utilisateur
  ADD COLUMN IF NOT EXISTS "compteActive" boolean NOT NULL DEFAULT true;

-- --- 2. Les jetons ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."JetonUtilisateur" (
    "idJeton"        integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "idUtilisateur"  integer NOT NULL
        REFERENCES public.utilisateur("idUtilisateur") ON DELETE CASCADE,

    -- 'activation' | 'reinitialisation'
    "type"           character varying(20) NOT NULL,

    -- Empreinte SHA-256 du jeton, en hexadécimal. Jamais le jeton lui-même.
    "jetonHache"     character(64) NOT NULL,

    "dateExpiration" timestamp without time zone NOT NULL,

    -- Renseignée à la première utilisation. C'est elle qui rend le jeton
    -- à usage unique : un lien intercepté et rejoué ne fonctionne plus.
    "dateUtilisation" timestamp without time zone,

    "dateCreation"   timestamp without time zone DEFAULT now() NOT NULL
);

-- La recherche se fait toujours par empreinte : c'est le seul chemin
-- d'accès, et il doit être unique.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_jeton_hache"
  ON public."JetonUtilisateur" ("jetonHache");

CREATE INDEX IF NOT EXISTS "idx_jeton_utilisateur"
  ON public."JetonUtilisateur" ("idUtilisateur", "type");

-- Contrainte de cohérence sur le type : une valeur libre finirait par
-- diverger entre les routes qui écrivent et celles qui lisent.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JetonUtilisateur_type_check') THEN
    ALTER TABLE public."JetonUtilisateur"
      ADD CONSTRAINT "JetonUtilisateur_type_check"
      CHECK ("type" IN ('activation', 'reinitialisation'));
  END IF;
END $$;
