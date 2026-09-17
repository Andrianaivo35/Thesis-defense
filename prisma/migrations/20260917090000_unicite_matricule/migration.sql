-- =====================================================================
-- Unicite du matricule au sein d'un etablissement
--
-- Un matricule identifie un etudiant A L'INTERIEUR de son etablissement :
-- deux universites peuvent attribuer le meme numero a deux personnes. La
-- contrainte porte donc sur le couple (etablissement, matricule).
--
-- La comparaison ignore la casse et les espaces : « ENI-2023-0142 » et
-- « eni 2023 0142 » sont le meme matricule.
--
-- Seuls les etudiants qui OCCUPENT un matricule sont concernes. Un etudiant
-- refuse (le numero n'etait pas le sien) ou sorti de l'etablissement ne
-- doit pas empecher le vrai titulaire de s'inscrire.
--
-- Index fonctionnel et partiel : Prisma ne sait pas le decrire dans le
-- schema, d'ou cette migration ecrite a la main (voir 0_init_complements).
-- L'expression et la clause WHERE doivent rester identiques a celles de
-- src/lib/matricule.js.
--
-- Idempotent.
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "idx_etudiant_matricule_unique"
  ON public.etudiant ("idUniversite", upper(regexp_replace("matricule", '\s', '', 'g')))
  WHERE "idUniversite" IS NOT NULL
    AND "matricule" IS NOT NULL
    AND btrim("matricule") <> ''
    AND COALESCE("statutRattachement", '') NOT IN ('Refuse', 'Sorti');
