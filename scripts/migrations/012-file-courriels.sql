-- =====================================================================
-- 012 — File d'attente des courriels
--
-- LE PROBLÈME QUE LE PLAN AVAIT IDENTIFIÉ
--
--   « 300 e-mails synchrones dans une requête expireraient. » C'est
--   exact, et c'est le dernier point technique du Lot 6.
--
--   Un envoi SMTP prend entre 0,3 et 2 secondes. Trois cents envois
--   dans le cycle d'une requête HTTP, c'est deux à dix minutes : la
--   requête expire, le navigateur abandonne, et l'université ne sait pas
--   combien de ses étudiants ont réellement reçu leur lien.
--
-- POURQUOI UNE TABLE PLUTÔT QU'UN SIMPLE « ENVOI EN ARRIÈRE-PLAN »
--
--   Lancer les envois sans attendre réglerait le délai, mais rien
--   d'autre. Un redémarrage du serveur, une coupure réseau, une erreur
--   d'authentification SMTP : les courriels sont perdus, sans trace, et
--   trois cents étudiants n'ont jamais reçu leur lien d'activation. Or
--   c'est leur SEUL moyen d'accéder à la plateforme.
--
--   La file rend l'envoi durable. Le courriel est écrit en base DANS LA
--   MÊME TRANSACTION que l'action qui le motive :
--
--     - si l'import échoue, aucun courriel n'est mis en file — on
--       n'annonce pas un compte qui n'existe pas ;
--     - si l'import réussit, le courriel est garanti d'être tenté, même
--       si le serveur tombe juste après.
--
--   C'est le motif dit « boîte d'envoi transactionnelle ».
--
-- CE QUE LA TABLE PERMET AUSSI
--
--   Réessayer un échec passager sans redemander l'action à l'utilisateur,
--   et savoir ce qui est parti — un envoi silencieux n'est pas
--   vérifiable.
--
-- Idempotent : peut être rejoué sans effet de bord.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public."FileCourriel" (
    "idCourriel"    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    "destinataire"  character varying(254) NOT NULL,
    "sujet"         character varying(300) NOT NULL,
    "corpsHtml"     text NOT NULL,

    -- 'en_attente' | 'envoye' | 'echec' | 'abandonne'
    "statut"        character varying(20) NOT NULL DEFAULT 'en_attente',

    -- Nombre de tentatives déjà faites. Au-delà d'un seuil, le courriel
    -- passe en 'abandonne' : réessayer indéfiniment une adresse
    -- inexistante fait chuter la réputation de l'expéditeur, et c'est
    -- ainsi qu'un compte d'envoi finit par être suspendu.
    "tentatives"    integer NOT NULL DEFAULT 0,
    "derniereErreur" text,

    -- Motif de l'envoi : 'activation', 'reinitialisation', 'validation',
    -- 'cycleVie'. Sert au diagnostic et aux relances ciblées.
    "categorie"     character varying(30),

    "dateCreation"  timestamp without time zone DEFAULT now() NOT NULL,
    "dateEnvoi"     timestamp without time zone
);

-- Le vidage de la file cherche toujours les mêmes lignes : celles qui
-- restent à envoyer, les plus anciennes d'abord.
CREATE INDEX IF NOT EXISTS "idx_file_courriel_attente"
  ON public."FileCourriel" ("statut", "idCourriel")
  WHERE "statut" = 'en_attente';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FileCourriel_statut_check') THEN
    ALTER TABLE public."FileCourriel"
      ADD CONSTRAINT "FileCourriel_statut_check"
      CHECK ("statut" IN ('en_attente', 'envoye', 'echec', 'abandonne'));
  END IF;
END $$;
