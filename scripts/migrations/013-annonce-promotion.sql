-- =====================================================================
-- 013 — L'annonce de cohorte désigne une promotion
--
-- SUITE DE L'ARBITRAGE DU LOT 6.4
--
--   La migration 010 a tranché : la promotion devient l'unité de
--   rattachement, et "EtudiantExterne" est abandonnée. Elle donnait à
--   une université le moyen de présenter ses étudiants sans les
--   inscrire — un nom, un prénom, un CV en base64, et rien d'autre.
--
--   Le Lot 6.3 a supprimé cette raison d'être : l'université importe sa
--   promotion, chacun obtient un compte, un profil, un CV analysable.
--
--   Mais l'arbitrage n'avait supprimé que l'intention : les routes
--   continuaient d'écrire dans la table. Une dette qu'on déclare réglée
--   sans retirer le code qui la produit se réintroduit par la porte de
--   derrière — la prochaine annonce créée aurait de nouveau engendré des
--   étudiants fantômes.
--
--   La table est donc supprimée, et son dernier code d'écriture avec.
--
-- CE QUE L'ANNONCE DEVIENT
--
--   Elle désigne une promotion réelle par "idPromotion" (colonne posée
--   en 010). L'entreprise qui la consulte voit de véritables profils,
--   avec compétences, CV et parcours — au lieu d'une liste de noms sur
--   laquelle elle ne peut rien faire.
--
--   C'est aussi la seule façon dont l'annonce devient utile : jusqu'ici,
--   une entreprise intéressée n'avait aucun moyen de contacter qui que
--   ce soit.
--
-- Aucune donnée perdue : la table est vide.
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

DROP TABLE IF EXISTS public."EtudiantExterne";

-- L'annonce sans promotion reste possible — une université peut publier
-- un besoin avant d'avoir importé la promotion correspondante. L'écran
-- l'affiche alors comme « promotion non précisée ».
CREATE INDEX IF NOT EXISTS "idx_annonce_promotion"
  ON public."AnnonceCohorte" ("idPromotion");
