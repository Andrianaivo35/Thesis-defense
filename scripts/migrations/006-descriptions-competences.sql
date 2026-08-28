-- =====================================================================
-- 006 — Descriptions du référentiel de compétences
--
-- Contexte
--   La colonne "description" de CompetenceReference existait mais était
--   vide pour les 56 compétences.
--
--   Elle devient un signal de similarité à part entière, pour corriger
--   les deux échecs constatés sur la matrice de co-occurrence :
--
--   1. RARETÉ — la co-occurrence n'offre que deux ou trois voisines par
--      compétence, et certaines n'apparaissent dans aucun contexte
--      (Vue.js, Angular). Une description fournit des dizaines de termes,
--      indépendamment du nombre d'offres.
--
--   2. COMPLÉMENTARITÉ CONFONDUE AVEC SUBSTITUABILITÉ — Git et SQL
--      figurent dans les mêmes offres : aucun signal de co-occurrence ne
--      peut les distinguer. Leurs descriptions, en revanche, ne partagent
--      aucun terme (« versions de code source » contre « bases de données
--      relationnelles »), tandis que React et Vue.js partagent presque
--      tout leur vocabulaire.
--
-- Principe de rédaction
--   Le vocabulaire est délibérément normalisé : deux compétences
--   interchangeables doivent partager leurs termes structurants (le rôle,
--   la technologie de base, l'objet manipulé), et deux compétences
--   seulement complémentaires ne doivent en partager aucun.
--
--   Ce sont des données de référence rédigées, au même titre que la
--   taxonomie des filières. La similarité, elle, reste calculée par
--   comptage.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

UPDATE public."CompetenceReference" AS cr
SET "description" = d.texte
FROM (VALUES
  -- === Développement web : vocabulaire volontairement commun ===
  ('Javascript',              'Langage de programmation web pour interfaces et applications côté navigateur'),
  ('TypeScript',              'Langage de programmation web typé pour interfaces et applications côté navigateur'),
  ('React',                   'Bibliothèque JavaScript de composants pour construire des interfaces web côté navigateur'),
  ('Vue.js',                  'Framework JavaScript de composants pour construire des interfaces web côté navigateur'),
  ('Angular',                 'Framework JavaScript de composants pour construire des interfaces web côté navigateur'),
  ('HTML/CSS',                'Langages de structure et de mise en forme des pages web côté navigateur'),
  ('Node.js',                 'Environnement JavaScript pour construire des services applicatifs côté serveur'),

  -- === Langages et frameworks côté serveur ===
  ('PHP',                     'Langage de programmation pour construire des applications côté serveur'),
  ('Python',                  'Langage de programmation généraliste pour applications, automatisation et traitement de données'),
  ('Java',                    'Langage de programmation généraliste pour applications d''entreprise côté serveur'),
  ('C++',                     'Langage de programmation système pour applications performantes et logiciels embarqués'),
  ('.NET',                    'Plateforme de développement pour applications d''entreprise côté serveur'),
  ('Laravel',                 'Framework PHP pour construire des applications côté serveur'),
  ('Symfony',                 'Framework PHP pour construire des applications côté serveur'),

  -- === Outils d'ingénierie : vocabulaire distinct des langages ===
  ('Git',                     'Système de gestion des versions du code source et de collaboration entre développeurs'),
  ('Docker',                  'Conteneurisation et déploiement reproductible d''applications sur des environnements isolés'),
  ('Linux',                   'Administration de systèmes d''exploitation libres et scripts en ligne de commande'),

  -- === Bases de données : vocabulaire propre au stockage ===
  ('SQL',                     'Langage d''interrogation et de manipulation de bases de données relationnelles'),
  ('MySQL',                   'Système de gestion de bases de données relationnelles et requêtes de stockage'),
  ('PostgreSQL',              'Système de gestion de bases de données relationnelles et requêtes de stockage'),
  ('NoSQL (MongoDB)',         'Système de gestion de bases de données non relationnelles et requêtes de stockage'),

  -- === Données et analyse ===
  ('Analyse de données',      'Exploration statistique de jeux de données et production d''indicateurs de décision'),
  ('Statistiques',            'Exploration statistique de jeux de données, modélisation et inférence quantitative'),
  ('Machine Learning',        'Modélisation statistique prédictive et apprentissage automatique sur jeux de données'),
  ('Power BI',                'Restitution visuelle de jeux de données et tableaux de bord d''indicateurs de décision'),
  ('Excel avancé',            'Restitution et calcul sur jeux de données en tableur, tableaux croisés et indicateurs'),

  -- === Réseaux et infrastructure ===
  ('Administration réseau',   'Configuration et supervision d''infrastructures réseau et d''équipements de connexion'),
  ('Cybersécurité',           'Protection des systèmes d''information, analyse des vulnérabilités et des menaces'),
  ('Cloud (AWS/Azure)',       'Déploiement et supervision d''infrastructures hébergées chez un fournisseur cloud'),
  ('Télécommunications',      'Configuration et supervision d''infrastructures de transmission et de réseaux mobiles'),

  -- === Gestion, finance et commerce ===
  ('Comptabilité',            'Tenue des comptes, écritures financières et établissement des états financiers'),
  ('Audit financier',         'Contrôle et vérification des comptes, des écritures financières et de leur conformité'),
  ('Actuariat',               'Modélisation quantitative des risques financiers, provisions et tarification'),
  ('Microfinance',            'Instruction et suivi de crédits financiers destinés aux petits entrepreneurs'),
  ('Gestion de projet',       'Planification, coordination des équipes et pilotage de l''avancement des travaux'),
  ('Ressources humaines',     'Recrutement, gestion administrative du personnel et accompagnement des équipes'),
  ('Marketing digital',       'Promotion commerciale d''une marque et animation de campagnes sur les canaux numériques'),
  ('Communication',           'Élaboration de messages et diffusion de l''information vers les publics d''une organisation'),
  ('Relation client',         'Accueil, conseil et accompagnement commercial de la clientèle'),
  ('Merchandising',           'Mise en valeur commerciale des produits en rayon et animation des espaces de vente'),
  ('Gestion de stocks',       'Suivi des niveaux de marchandises, approvisionnement et rotation des références'),
  ('Logistique',              'Organisation du transport, des flux de marchandises et de la chaîne d''approvisionnement'),
  ('Hôtellerie et Tourisme',  'Accueil et accompagnement de la clientèle en établissement hôtelier et touristique'),

  -- === Langues ===
  ('Anglais professionnel',   'Expression écrite et orale en anglais dans un contexte professionnel'),
  ('Français rédactionnel',   'Expression écrite et rédaction de documents en français dans un contexte professionnel'),
  ('Malagasy',                'Expression écrite et orale en malagasy dans un contexte professionnel'),

  -- === Industrie et ingénierie ===
  ('Génie civil',             'Conception et suivi de chantiers de construction de bâtiments et d''ouvrages'),
  ('Génie électrique',        'Conception et maintenance d''installations électriques et de réseaux de distribution'),
  ('Génie mécanique',         'Conception et maintenance d''équipements mécaniques et de machines industrielles'),
  ('Génie des procédés',      'Conduite et optimisation de procédés de transformation en production industrielle'),
  ('Génie textile',           'Conduite de procédés de fabrication textile et suivi des lignes de production'),
  ('Contrôle qualité',        'Vérification de la conformité des produits aux normes et suivi des non-conformités'),
  ('Sécurité minière',        'Prévention des risques et application des règles de sécurité sur site industriel minier'),
  ('Énergies renouvelables',  'Conception et exploitation d''installations de production d''énergie solaire et renouvelable'),
  ('Agronomie',               'Conduite de cultures agricoles, itinéraires techniques et suivi des rendements'),
  ('Aquaculture',             'Conduite d''élevages aquacoles, suivi des bassins et des conditions de croissance')
) AS d(nom, texte)
WHERE cr."nomCompetenceReference" = d.nom;
