-- =====================================================================
-- 011 — Cycle de vie du rattachement : diplômé, sorti
--
-- POURQUOI
--
--   Sans fin de rattachement, la liste d'une université ne cesse de
--   croître. Au bout de quatre ans, elle mêle les étudiants de l'année
--   à ceux qui sont partis depuis longtemps, et devient inexploitable.
--
-- DEUX FINS, QUI NE SE VALENT PAS
--
--   'Diplome'  l'étudiant a terminé son cursus. Il CONSERVE son
--              rattachement : il reste sur la plateforme, affiché
--              « ancien étudiant de X ». C'est l'intention — un diplômé
--              cherche encore un stage de fin d'études, et
--              l'établissement reste une information utile aux
--              entreprises.
--
--   'Sorti'    départ ou exclusion. L'étudiant quitte les effectifs de
--              l'établissement.
--
-- POURQUOI 'Sorti' NE MET PAS "idUniversite" À NULL
--
--   Le plan disait « détache ». Détacher au sens de vider la colonne
--   effacerait l'information : plus personne ne saurait d'où vient cet
--   étudiant, ni ne pourrait revenir sur une exclusion prononcée par
--   erreur.
--
--   Le rattachement est donc conservé, et c'est le STATUT qui détache :
--   l'étudiant sort des effectifs, son profil n'affiche plus
--   l'établissement, et l'université ne le voit plus dans sa liste
--   active. L'opération reste réversible, et l'historique intact.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

-- Date de fin du rattachement. Distincte de "dateRattachement", qui est
-- sa date de début : afficher « diplômé en juillet 2026 » exige les deux.
ALTER TABLE public.etudiant
  ADD COLUMN IF NOT EXISTS "dateFinRattachement" timestamp without time zone;

-- Motif libre, saisi par l'université. Une exclusion et un départ
-- volontaire portent le même statut ; seul le motif les distingue, et
-- l'établissement doit pouvoir s'en souvenir.
ALTER TABLE public.etudiant
  ADD COLUMN IF NOT EXISTS "motifFinRattachement" text;

-- Aucune contrainte n'encadrait "statutRattachement" : une faute de
-- frappe dans une route aurait créé un statut fantôme, et l'étudiant
-- aurait disparu de tous les écrans sans qu'aucune erreur ne le signale.
--
-- Les 38 lignes existantes sont toutes 'Valide' ; la contrainte tolère
-- NULL pour les comptes antérieurs au Lot 1.2b.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'etudiant_statutRattachement_check') THEN
    ALTER TABLE public.etudiant
      ADD CONSTRAINT "etudiant_statutRattachement_check"
      CHECK ("statutRattachement" IS NULL OR "statutRattachement" IN
             ('En attente', 'Valide', 'Refuse', 'Diplome', 'Sorti'));
  END IF;
END $$;

-- Les écrans filtrent en permanence sur le statut : « mes étudiants
-- actifs », « mes anciens ». Sans index, chaque affichage parcourt la
-- table entière.
CREATE INDEX IF NOT EXISTS "idx_etudiant_rattachement"
  ON public.etudiant ("idUniversite", "statutRattachement");
