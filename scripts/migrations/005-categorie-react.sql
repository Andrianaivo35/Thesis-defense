-- =====================================================================
-- 005 — Harmonisation de la catégorie de « React »
--
-- Contexte
--   React était seul dans une catégorie « Developpement », reliquat des
--   toutes premières données du dépôt, alors que l'ensemble des autres
--   technologies web (Vue.js, Angular, Node.js, TypeScript…) relèvent de
--   « Technique ».
--
--   Cette incohérence n'était pas seulement cosmétique : la matrice de
--   co-occurrence utilise la catégorie comme a priori lorsqu'aucune
--   observation n'est disponible. React et Vue.js n'apparaissant jamais
--   ensemble — ce sont des alternatives — l'a priori était leur seul
--   rapprochement possible, et une catégorie divergente le réduisait à
--   zéro.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

UPDATE public."CompetenceReference"
SET "categorieCompetenceReference" = 'Technique'
WHERE "nomCompetenceReference" = 'React'
  AND "categorieCompetenceReference" = 'Developpement';
