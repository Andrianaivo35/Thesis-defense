-- =====================================================================
-- 003 — Normalisation des domaines, filières et spécialisations
--
-- Contexte
--   Ces trois champs restaient saisis en texte libre alors que
--   scoreFiliere() les compare pour calculer la pertinence d'une offre.
--   La base contenait déjà deux valeurs « Informatique » distinctes pour
--   le domaine, dont une suivie d'espaces — invisibles à l'affichage,
--   mais suffisants pour faire échouer une comparaison exacte.
--
--   Les valeurs sont alignées sur le référentiel hiérarchique défini dans
--   src/lib/referentiels.js (domaine -> filières).
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

-- Espaces superflus, cause de doublons invisibles
UPDATE public.offre    SET "domaine" = TRIM("domaine")            WHERE "domaine" <> TRIM("domaine");
UPDATE public.etudiant SET "filiere" = TRIM("filiere")            WHERE "filiere" <> TRIM("filiere");
UPDATE public.etudiant SET "specialisation" = TRIM("specialisation") WHERE "specialisation" <> TRIM("specialisation");

-- === Domaines des offres ===
UPDATE public.offre SET "domaine" = 'Informatique et Numérique'
  WHERE "domaine" IN ('Informatique', 'Data');
UPDATE public.offre SET "domaine" = 'Banque, Finance et Assurance'
  WHERE "domaine" IN ('Banque', 'Assurance', 'Microfinance');
UPDATE public.offre SET "domaine" = 'Génie Civil et BTP'
  WHERE "domaine" = 'BTP';
UPDATE public.offre SET "domaine" = 'Génie Industriel et Énergie'
  WHERE "domaine" = 'Énergie';
UPDATE public.offre SET "domaine" = 'Textile et Industrie Manufacturière'
  WHERE "domaine" = 'Textile';
UPDATE public.offre SET "domaine" = 'Gestion et Commerce'
  WHERE "domaine" IN ('Marketing', 'Distribution', 'Comptabilité', 'Relation Client', 'Transport');
UPDATE public.offre SET "domaine" = 'Tourisme et Hôtellerie'
  WHERE "domaine" = 'Hôtellerie';
UPDATE public.offre SET "domaine" = 'Pêche et Ressources Marines'
  WHERE "domaine" = 'Pêche';
UPDATE public.offre SET "domaine" = 'Agro-industrie et Agronomie'
  WHERE "domaine" IN ('Agro-export', 'Industrie Agroalimentaire');
UPDATE public.offre SET "domaine" = 'Mines et Métallurgie'
  WHERE "domaine" = 'Mines';
-- Télécommunications est déjà un libellé du référentiel

-- === Filières des étudiants ===
UPDATE public.etudiant SET "filiere" = 'Informatique et Numérique'
  WHERE "filiere" = 'Informatique';
UPDATE public.etudiant SET "filiere" = 'Gestion et Commerce'
  WHERE "filiere" IN ('Gestion', 'Comptabilité');
UPDATE public.etudiant SET "filiere" = 'Génie Industriel et Énergie'
  WHERE "filiere" IN ('Génie Industriel', 'Génie Électrique');
UPDATE public.etudiant SET "filiere" = 'Génie Civil et BTP'
  WHERE "filiere" = 'Génie Civil';
UPDATE public.etudiant SET "filiere" = 'Agro-industrie et Agronomie'
  WHERE "filiere" = 'Agro-industrie';
UPDATE public.etudiant SET "filiere" = 'Tourisme et Hôtellerie'
  WHERE "filiere" = 'Tourisme';
UPDATE public.etudiant SET "filiere" = 'Pêche et Ressources Marines'
  WHERE "filiere" = 'Sciences Halieutiques';
UPDATE public.etudiant SET "filiere" = 'Communication et Médias'
  WHERE "filiere" = 'Communication';

-- === Spécialisations des étudiants ===
UPDATE public.etudiant SET "specialisation" = 'Data Science et Intelligence Artificielle'
  WHERE "specialisation" IN ('Data Science', 'Intelligence Artificielle');
UPDATE public.etudiant SET "specialisation" = 'Réseaux et Systèmes'
  WHERE "specialisation" IN ('Réseaux et Systèmes', 'Réseaux et Télécoms');
UPDATE public.etudiant SET "specialisation" = 'Réseaux Mobiles'
  WHERE "specialisation" = 'Réseaux Mobiles';
UPDATE public.etudiant SET "specialisation" = 'Développement Web'
  WHERE "specialisation" = 'Développement Web';
UPDATE public.etudiant SET "specialisation" = 'Développement Mobile'
  WHERE "specialisation" = 'Développement Mobile';
UPDATE public.etudiant SET "specialisation" = 'Finance d''Entreprise'
  WHERE "specialisation" = 'Finance';
UPDATE public.etudiant SET "specialisation" = 'Comptabilité'
  WHERE "specialisation" IN ('Comptabilité', 'Comptabilité et Finance');
UPDATE public.etudiant SET "specialisation" = 'Marketing'
  WHERE "specialisation" IN ('Marketing', 'Marketing Digital');
UPDATE public.etudiant SET "specialisation" = 'Bâtiment'
  WHERE "specialisation" IN ('BTP', 'Bâtiment');
UPDATE public.etudiant SET "specialisation" = 'Exploitation Minière'
  WHERE "specialisation" = 'Mines et Métallurgie';
UPDATE public.etudiant SET "specialisation" = 'Logistique et Transport'
  WHERE "specialisation" IN ('Transport et Logistique', 'Gestion Portuaire et Transport');
UPDATE public.etudiant SET "specialisation" = 'Commerce et Distribution'
  WHERE "specialisation" = 'Commerce et Distribution';
UPDATE public.etudiant SET "specialisation" = 'Génie des Procédés'
  WHERE "specialisation" IN ('Génie des Procédés', 'Génie des Procédés Agroalimentaires');
UPDATE public.etudiant SET "specialisation" = "specialisation"
  WHERE false; -- garde-fou : la liste ci-dessus ne couvre que les valeurs connues
