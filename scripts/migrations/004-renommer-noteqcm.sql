-- =====================================================================
-- 004 — Renommage de Candidature."scoreMatching" en "noteQCM"
--
-- Contexte
--   La colonne s'appelait "scoreMatching" mais recevait
--   (points obtenus / points totaux) × 100, c'est-à-dire la **note au
--   QCM de présélection** — et non un score d'adéquation entre le profil
--   de l'étudiant et l'offre.
--
--   Le Lot 5 introduit un véritable score d'adéquation, issu de la
--   matrice de co-occurrence des compétences. Deux notions distinctes ne
--   peuvent pas cohabiter sous un nom ambigu : la colonne existante prend
--   le nom qui correspond à son contenu réel, et « score d'adéquation »
--   reste disponible pour ce qu'il désigne vraiment.
--
--   Le score d'adéquation n'est pas ajouté ici : il vit déjà dans la
--   table `recommandation` (scoresGlobal, scoresCompetence, …), qui est
--   sa place naturelle puisqu'il se recalcule indépendamment des
--   candidatures.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Candidature' AND column_name = 'scoreMatching'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Candidature' AND column_name = 'noteQCM'
  ) THEN
    ALTER TABLE public."Candidature" RENAME COLUMN "scoreMatching" TO "noteQCM";
  END IF;
END $$;
