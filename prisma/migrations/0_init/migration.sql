-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."AnnonceCohorte" (
    "idAnnonceCohorte" SERIAL NOT NULL,
    "idUniversite" INTEGER NOT NULL,
    "titre" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "filiereConcernee" VARCHAR(255),
    "niveauAcademique" VARCHAR(100),
    "domainesRecherche" TEXT,
    "periodeDebut" DATE,
    "periodeFin" DATE,
    "dureeStage" VARCHAR(50),
    "villePreferee" VARCHAR(100),
    "accepteTeletravail" VARCHAR(20),
    "statut" VARCHAR(20) DEFAULT 'Active',
    "datePublication" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "dateLimite" DATE,
    "idPromotion" INTEGER,

    CONSTRAINT "AnnonceCohorte_pkey" PRIMARY KEY ("idAnnonceCohorte")
);

-- CreateTable
CREATE TABLE "public"."CV" (
    "idCV" SERIAL NOT NULL,
    "idEtudiant" INTEGER NOT NULL,
    "libelle" VARCHAR(150) NOT NULL,
    "nomFichier" VARCHAR(255) NOT NULL,
    "nomFichierOriginal" VARCHAR(255),
    "tailleOctets" INTEGER,
    "estPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "dateAjout" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statutAnalyse" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "texteExtrait" TEXT,
    "nombrePages" INTEGER,
    "pagesOcr" INTEGER,
    "confianceOcr" DECIMAL(5,2),
    "dateAnalyse" TIMESTAMP(6),
    "messageAnalyse" TEXT,

    CONSTRAINT "CV_pkey" PRIMARY KEY ("idCV")
);

-- CreateTable
CREATE TABLE "public"."Candidature" (
    "idCandidature" SERIAL NOT NULL,
    "idEtudiant" INTEGER NOT NULL,
    "idOffre" INTEGER NOT NULL,
    "lettreMotivation" TEXT,
    "cv" VARCHAR(500),
    "dateCandidature" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "statut" VARCHAR(30) DEFAULT 'En attente',
    "noteQCM" DECIMAL(5,2),
    "idCV" INTEGER,
    "nomFichierLettre" VARCHAR(255),

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("idCandidature")
);

-- CreateTable
CREATE TABLE "public"."ChoixReponse" (
    "idChoix" SERIAL NOT NULL,
    "idQuestion" INTEGER NOT NULL,
    "enonce" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "estCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChoixReponse_pkey" PRIMARY KEY ("idChoix")
);

-- CreateTable
CREATE TABLE "public"."CompetenceDetectee" (
    "idCompetenceDetectee" SERIAL NOT NULL,
    "idCV" INTEGER NOT NULL,
    "idCompetenceReference" INTEGER,
    "termeDetecte" VARCHAR(150) NOT NULL,
    "methode" VARCHAR(20) NOT NULL,
    "confiance" DECIMAL(4,3) NOT NULL,
    "page" INTEGER,
    "section" VARCHAR(40),
    "contexte" TEXT,
    "decision" VARCHAR(15),
    "dateDecision" TIMESTAMP(6),
    "dateDetection" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetenceDetectee_pkey" PRIMARY KEY ("idCompetenceDetectee")
);

-- CreateTable
CREATE TABLE "public"."CompetenceEtudiant" (
    "idCompetenceEtudiant" SERIAL NOT NULL,
    "idEtudiant" INTEGER NOT NULL,
    "idCompetenceReference" INTEGER NOT NULL,
    "niveau" VARCHAR(50),
    "dateAjout" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetenceEtudiant_pkey" PRIMARY KEY ("idCompetenceEtudiant")
);

-- CreateTable
CREATE TABLE "public"."CompetenceOffre" (
    "idCompetenceOffre" SERIAL NOT NULL,
    "idOffre" INTEGER NOT NULL,
    "idCompetenceReference" INTEGER NOT NULL,
    "niveauSouhaitee" VARCHAR(30) DEFAULT 'D‚butant',
    "estObligatoire" BOOLEAN DEFAULT false,

    CONSTRAINT "CompetenceOffre_pkey" PRIMARY KEY ("idCompetenceOffre")
);

-- CreateTable
CREATE TABLE "public"."CompetenceReference" (
    "idCompetenceReference" SERIAL NOT NULL,
    "nomCompetenceReference" VARCHAR(100) NOT NULL,
    "categorieCompetenceReference" VARCHAR(50),
    "description" TEXT,

    CONSTRAINT "CompetenceReference_pkey" PRIMARY KEY ("idCompetenceReference")
);

-- CreateTable
CREATE TABLE "public"."Conversation" (
    "idConversation" SERIAL NOT NULL,
    "dateCreation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "dateDernierMessage" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("idConversation")
);

-- CreateTable
CREATE TABLE "public"."FileCourriel" (
    "idCourriel" SERIAL NOT NULL,
    "destinataire" VARCHAR(254) NOT NULL,
    "sujet" VARCHAR(300) NOT NULL,
    "corpsHtml" TEXT NOT NULL,
    "statut" VARCHAR(20) NOT NULL DEFAULT 'en_attente',
    "tentatives" INTEGER NOT NULL DEFAULT 0,
    "derniereErreur" TEXT,
    "categorie" VARCHAR(30),
    "dateCreation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEnvoi" TIMESTAMP(6),

    CONSTRAINT "FileCourriel_pkey" PRIMARY KEY ("idCourriel")
);

-- CreateTable
CREATE TABLE "public"."JetonUtilisateur" (
    "idJeton" SERIAL NOT NULL,
    "idUtilisateur" INTEGER NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "jetonHache" CHAR(64) NOT NULL,
    "dateExpiration" TIMESTAMP(6) NOT NULL,
    "dateUtilisation" TIMESTAMP(6),
    "dateCreation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JetonUtilisateur_pkey" PRIMARY KEY ("idJeton")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "idMessage" SERIAL NOT NULL,
    "idConversation" INTEGER NOT NULL,
    "idExpediteur" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,
    "dateEnvoi" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "estLu" BOOLEAN DEFAULT false,
    "pieceJointe" VARCHAR(255),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("idMessage")
);

-- CreateTable
CREATE TABLE "public"."Promotion" (
    "idPromotion" SERIAL NOT NULL,
    "idUniversite" INTEGER NOT NULL,
    "libelle" VARCHAR(120) NOT NULL,
    "annee" VARCHAR(9) NOT NULL,
    "niveauAcademique" VARCHAR(50),
    "filiere" VARCHAR(150),
    "specialisation" VARCHAR(150),
    "statut" VARCHAR(20) NOT NULL DEFAULT 'Active',
    "dateCreation" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("idPromotion")
);

-- CreateTable
CREATE TABLE "public"."QCM" (
    "idQCM" SERIAL NOT NULL,
    "idOffre" INTEGER NOT NULL,
    "titre" VARCHAR(200),
    "description" TEXT,
    "duree" INTEGER,
    "noteMinimal" INTEGER DEFAULT 0,
    "dateCreation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "estActif" BOOLEAN DEFAULT true,

    CONSTRAINT "QCM_pkey" PRIMARY KEY ("idQCM")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "idQuestion" SERIAL NOT NULL,
    "idQCM" INTEGER NOT NULL,
    "enonce" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 1,
    "explication" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("idQuestion")
);

-- CreateTable
CREATE TABLE "public"."ReponseEtudiant" (
    "idReponse" SERIAL NOT NULL,
    "idCandidature" INTEGER NOT NULL,
    "idQuestion" INTEGER NOT NULL,
    "idChoixOffre" INTEGER NOT NULL,
    "enonce" TEXT,
    "estCorrecte" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReponseEtudiant_pkey" PRIMARY KEY ("idReponse")
);

-- CreateTable
CREATE TABLE "public"."UniversiteDomaine" (
    "idUniversiteDomaine" SERIAL NOT NULL,
    "idUniversite" INTEGER NOT NULL,
    "domaine" VARCHAR(150) NOT NULL,
    "dateAjout" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversiteDomaine_pkey" PRIMARY KEY ("idUniversiteDomaine")
);

-- CreateTable
CREATE TABLE "public"."admin" (
    "idAdmin" SERIAL NOT NULL,
    "idUtilisateur" INTEGER NOT NULL,
    "nomAdmin" VARCHAR(100) NOT NULL,
    "prenomAdmin" VARCHAR(100) NOT NULL,
    "telephone" VARCHAR(30),
    "dateCreation" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("idAdmin")
);

-- CreateTable
CREATE TABLE "public"."centre-interet" (
    "idCentreInteret" SERIAL NOT NULL,
    "idEtudiant" INTEGER,
    "domaineInteret" TEXT,
    "missionPreferee" TEXT,

    CONSTRAINT "centre-interet_pkey" PRIMARY KEY ("idCentreInteret")
);

-- CreateTable
CREATE TABLE "public"."entreprise" (
    "idEntreprise" SERIAL NOT NULL,
    "idUtilisateur" INTEGER,
    "nomEntreprise" TEXT,
    "numeroIdentificationFiscal" TEXT,
    "numeroStat" TEXT,
    "formeJuridique" TEXT,
    "secteurActivitePrincipal" TEXT,
    "adresseSiegeSocial" TEXT,
    "telephonePrincipal" TEXT,
    "telephoneSecondaire" TEXT,
    "siteWeb" TEXT,
    "reseauxSociaux" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "dateInscription" DATE,
    "estVerifie" BOOLEAN,
    "dateVerification" DATE,

    CONSTRAINT "entreprise_pkey" PRIMARY KEY ("idEntreprise")
);

-- CreateTable
CREATE TABLE "public"."etudiant" (
    "idEtudiant" SERIAL NOT NULL,
    "idUtilisateur" INTEGER,
    "nomEtudiant" TEXT,
    "prenomEtudiant" TEXT,
    "telephoneEtudiant" TEXT,
    "genre" TEXT,
    "adresse" TEXT,
    "photoProfil" TEXT,
    "bio" TEXT,
    "idUniversite" INTEGER,
    "matricule" TEXT,
    "filiere" TEXT,
    "specialisation" TEXT,
    "niveauAcademique" TEXT,
    "dateInscription" DATE,
    "estActif" BOOLEAN,
    "nomUniversiteSaisi" TEXT,
    "statutRattachement" VARCHAR(20),
    "dateRattachement" TIMESTAMP(6),
    "idPromotion" INTEGER,
    "dateFinRattachement" TIMESTAMP(6),
    "motifFinRattachement" TEXT,

    CONSTRAINT "etudiant_pkey" PRIMARY KEY ("idEtudiant")
);

-- CreateTable
CREATE TABLE "public"."offre" (
    "idOffre" SERIAL NOT NULL,
    "idEntreprise" INTEGER NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "domaine" VARCHAR(100),
    "niveauRequis" VARCHAR(50),
    "duree" VARCHAR(50),
    "dateDebut" DATE,
    "dateFin" DATE,
    "remuneration" VARCHAR(100),
    "lieu" VARCHAR(200),
    "ville" VARCHAR(100),
    "accepteTeletravail" VARCHAR(20),
    "typeStage" VARCHAR(50),
    "statut" VARCHAR(20) DEFAULT 'Active',
    "datePublication" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "dateLimites" DATE,

    CONSTRAINT "offre_pkey" PRIMARY KEY ("idOffre")
);

-- CreateTable
CREATE TABLE "public"."parcours-realisation" (
    "idParcoursRealisation" SERIAL NOT NULL,
    "idEtudiant" INTEGER,
    "type" TEXT,
    "titre" TEXT,
    "description" TEXT,
    "entreprise" TEXT,
    "dateDebut" DATE,
    "dateFin" DATE,
    "lien" TEXT,

    CONSTRAINT "parcours-realisation_pkey" PRIMARY KEY ("idParcoursRealisation")
);

-- CreateTable
CREATE TABLE "public"."participantConversation" (
    "idParticipantConversation" SERIAL NOT NULL,
    "idConversation" INTEGER NOT NULL,
    "idUtilisateur" INTEGER NOT NULL,

    CONSTRAINT "participantConversation_pkey" PRIMARY KEY ("idParticipantConversation")
);

-- CreateTable
CREATE TABLE "public"."preference-stage" (
    "idPreferenceStage" SERIAL NOT NULL,
    "idEtudiant" INTEGER,
    "villePreferee" TEXT,
    "accepteTeletravail" VARCHAR(20),
    "rayonDeplacement" TEXT,
    "mobiliteNational" BOOLEAN,
    "typeStagePreferee" TEXT,
    "dureeSouhaitee" TEXT,
    "dateDebutDisponibilite" DATE,
    "dateFinDisponibilite" DATE,
    "typeEntreprisePreferee" TEXT,
    "disponibiliteImmediate" BOOLEAN,

    CONSTRAINT "preference-stage_pkey" PRIMARY KEY ("idPreferenceStage")
);

-- CreateTable
CREATE TABLE "public"."recommandation" (
    "idRecommandation" SERIAL NOT NULL,
    "idEtudiant" INTEGER NOT NULL,
    "idOffre" INTEGER NOT NULL,
    "scoresGlobal" DECIMAL(5,2),
    "scoresCompetence" DECIMAL(5,2),
    "scoresFiliere" DECIMAL(5,2),
    "scoreNiveau" DECIMAL(5,2),
    "scoreLocalisation" DECIMAL(5,2),
    "scorePreference" DECIMAL(5,2),
    "dateGeneration" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommandation_pkey" PRIMARY KEY ("idRecommandation")
);

-- CreateTable
CREATE TABLE "public"."universite" (
    "idUniversite" SERIAL NOT NULL,
    "idUtilisateur" INTEGER,
    "nomUniversite" TEXT,
    "sigleUniversitaire" TEXT,
    "telephoneUniversite" TEXT,
    "adresseUniversite" TEXT,
    "ville" TEXT,
    "siteWeb" TEXT,
    "logo" TEXT,
    "dateInscription" DATE,
    "estVerifie" BOOLEAN,
    "dateVerification" DATE,

    CONSTRAINT "universite_pkey" PRIMARY KEY ("idUniversite")
);

-- CreateTable
CREATE TABLE "public"."utilisateur" (
    "idUtilisateur" SERIAL NOT NULL,
    "typeUtilisateur" TEXT,
    "emailUtilisateur" TEXT,
    "motDePasse" TEXT,
    "compteActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "utilisateur_pkey" PRIMARY KEY ("idUtilisateur")
);

-- CreateIndex
CREATE INDEX "idx_annonce_promotion" ON "public"."AnnonceCohorte"("idPromotion" ASC);

-- CreateIndex
CREATE INDEX "idx_cv_etudiant" ON "public"."CV"("idEtudiant" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_cv_principal_unique" ON "public"."CV"("idEtudiant" ASC) WHERE "estPrincipal";

-- CreateIndex
CREATE UNIQUE INDEX "Candidature_idEtudiant_idOffre_key" ON "public"."Candidature"("idEtudiant" ASC, "idOffre" ASC);

-- CreateIndex
CREATE INDEX "idx_competence_detectee_cv" ON "public"."CompetenceDetectee"("idCV" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_competenceetudiant" ON "public"."CompetenceEtudiant"("idEtudiant" ASC, "idCompetenceReference" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceOffre_idOffre_idCompetenceReference_key" ON "public"."CompetenceOffre"("idOffre" ASC, "idCompetenceReference" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CompetenceReference_nomCompetenceReference_key" ON "public"."CompetenceReference"("nomCompetenceReference" ASC);

-- CreateIndex
CREATE INDEX "idx_file_courriel_attente" ON "public"."FileCourriel"("statut" ASC, "idCourriel" ASC) WHERE ((statut)::text = 'en_attente'::text);

-- CreateIndex
CREATE UNIQUE INDEX "idx_jeton_hache" ON "public"."JetonUtilisateur"("jetonHache" ASC);

-- CreateIndex
CREATE INDEX "idx_jeton_utilisateur" ON "public"."JetonUtilisateur"("idUtilisateur" ASC, "type" ASC);

-- CreateIndex
CREATE INDEX "idx_promotion_universite" ON "public"."Promotion"("idUniversite" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "QCM_idOffre_key" ON "public"."QCM"("idOffre" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReponseEtudiant_idCandidature_idQuestion_key" ON "public"."ReponseEtudiant"("idCandidature" ASC, "idQuestion" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "idx_universite_domaine_unique" ON "public"."UniversiteDomaine"("idUniversite" ASC, "domaine" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "admin_idUtilisateur_key" ON "public"."admin"("idUtilisateur" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "entreprise_idUtilisateur_key" ON "public"."entreprise"("idUtilisateur" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "etudiant_idUtilisateur_key" ON "public"."etudiant"("idUtilisateur" ASC);

-- CreateIndex
CREATE INDEX "idx_etudiant_promotion" ON "public"."etudiant"("idPromotion" ASC);

-- CreateIndex
CREATE INDEX "idx_etudiant_rattachement" ON "public"."etudiant"("idUniversite" ASC, "statutRattachement" ASC);

-- CreateIndex
CREATE INDEX "idx_etudiant_universite_statut" ON "public"."etudiant"("idUniversite" ASC, "statutRattachement" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "participantConversation_idConversation_idUtilisateur_key" ON "public"."participantConversation"("idConversation" ASC, "idUtilisateur" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_recommandation" ON "public"."recommandation"("idEtudiant" ASC, "idOffre" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "universite_idUtilisateur_key" ON "public"."universite"("idUtilisateur" ASC);

-- AddForeignKey
ALTER TABLE "public"."AnnonceCohorte" ADD CONSTRAINT "AnnonceCohorte_idPromotion_fkey" FOREIGN KEY ("idPromotion") REFERENCES "public"."Promotion"("idPromotion") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."AnnonceCohorte" ADD CONSTRAINT "AnnonceCohorte_idUniversite_fkey" FOREIGN KEY ("idUniversite") REFERENCES "public"."universite"("idUniversite") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CV" ADD CONSTRAINT "CV_idEtudiant_fkey" FOREIGN KEY ("idEtudiant") REFERENCES "public"."etudiant"("idEtudiant") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Candidature" ADD CONSTRAINT "Candidature_idCV_fkey" FOREIGN KEY ("idCV") REFERENCES "public"."CV"("idCV") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Candidature" ADD CONSTRAINT "Candidature_idEtudiant_fkey" FOREIGN KEY ("idEtudiant") REFERENCES "public"."etudiant"("idEtudiant") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Candidature" ADD CONSTRAINT "Candidature_idOffre_fkey" FOREIGN KEY ("idOffre") REFERENCES "public"."offre"("idOffre") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ChoixReponse" ADD CONSTRAINT "ChoixReponse_idQuestion_fkey" FOREIGN KEY ("idQuestion") REFERENCES "public"."Question"("idQuestion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CompetenceDetectee" ADD CONSTRAINT "CompetenceDetectee_idCV_fkey" FOREIGN KEY ("idCV") REFERENCES "public"."CV"("idCV") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CompetenceDetectee" ADD CONSTRAINT "CompetenceDetectee_idCompetenceReference_fkey" FOREIGN KEY ("idCompetenceReference") REFERENCES "public"."CompetenceReference"("idCompetenceReference") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CompetenceEtudiant" ADD CONSTRAINT "fk_competenceetudiant_etudiant" FOREIGN KEY ("idEtudiant") REFERENCES "public"."etudiant"("idEtudiant") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CompetenceEtudiant" ADD CONSTRAINT "fk_competenceetudiant_reference" FOREIGN KEY ("idCompetenceReference") REFERENCES "public"."CompetenceReference"("idCompetenceReference") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CompetenceOffre" ADD CONSTRAINT "CompetenceOffre_idCompetenceReference_fkey" FOREIGN KEY ("idCompetenceReference") REFERENCES "public"."CompetenceReference"("idCompetenceReference") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."CompetenceOffre" ADD CONSTRAINT "CompetenceOffre_idOffre_fkey" FOREIGN KEY ("idOffre") REFERENCES "public"."offre"("idOffre") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."JetonUtilisateur" ADD CONSTRAINT "JetonUtilisateur_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "public"."utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_idConversation_fkey" FOREIGN KEY ("idConversation") REFERENCES "public"."Conversation"("idConversation") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_idExpediteur_fkey" FOREIGN KEY ("idExpediteur") REFERENCES "public"."utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Promotion" ADD CONSTRAINT "Promotion_idUniversite_fkey" FOREIGN KEY ("idUniversite") REFERENCES "public"."universite"("idUniversite") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."QCM" ADD CONSTRAINT "QCM_idOffre_fkey" FOREIGN KEY ("idOffre") REFERENCES "public"."offre"("idOffre") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_idQCM_fkey" FOREIGN KEY ("idQCM") REFERENCES "public"."QCM"("idQCM") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ReponseEtudiant" ADD CONSTRAINT "ReponseEtudiant_idCandidature_fkey" FOREIGN KEY ("idCandidature") REFERENCES "public"."Candidature"("idCandidature") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ReponseEtudiant" ADD CONSTRAINT "ReponseEtudiant_idChoixOffre_fkey" FOREIGN KEY ("idChoixOffre") REFERENCES "public"."ChoixReponse"("idChoix") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."ReponseEtudiant" ADD CONSTRAINT "ReponseEtudiant_idQuestion_fkey" FOREIGN KEY ("idQuestion") REFERENCES "public"."Question"("idQuestion") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."UniversiteDomaine" ADD CONSTRAINT "UniversiteDomaine_idUniversite_fkey" FOREIGN KEY ("idUniversite") REFERENCES "public"."universite"("idUniversite") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."admin" ADD CONSTRAINT "admin_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "public"."utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."centre-interet" ADD CONSTRAINT "idEtudiant" FOREIGN KEY ("idEtudiant") REFERENCES "public"."etudiant"("idEtudiant") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."entreprise" ADD CONSTRAINT "idUtilisateur" FOREIGN KEY ("idUtilisateur") REFERENCES "public"."utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."etudiant" ADD CONSTRAINT "etudiant_idPromotion_fkey" FOREIGN KEY ("idPromotion") REFERENCES "public"."Promotion"("idPromotion") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."etudiant" ADD CONSTRAINT "idUtilisateur" FOREIGN KEY ("idUtilisateur") REFERENCES "public"."utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."offre" ADD CONSTRAINT "offre_idEntreprise_fkey" FOREIGN KEY ("idEntreprise") REFERENCES "public"."entreprise"("idEntreprise") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."parcours-realisation" ADD CONSTRAINT "idEtudiant" FOREIGN KEY ("idEtudiant") REFERENCES "public"."etudiant"("idEtudiant") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."participantConversation" ADD CONSTRAINT "participantConversation_idConversation_fkey" FOREIGN KEY ("idConversation") REFERENCES "public"."Conversation"("idConversation") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."participantConversation" ADD CONSTRAINT "participantConversation_idUtilisateur_fkey" FOREIGN KEY ("idUtilisateur") REFERENCES "public"."utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."preference-stage" ADD CONSTRAINT "idEtudiant" FOREIGN KEY ("idEtudiant") REFERENCES "public"."etudiant"("idEtudiant") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recommandation" ADD CONSTRAINT "fk_recommandation_etudiant" FOREIGN KEY ("idEtudiant") REFERENCES "public"."etudiant"("idEtudiant") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."recommandation" ADD CONSTRAINT "fk_recommandation_offre" FOREIGN KEY ("idOffre") REFERENCES "public"."offre"("idOffre") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."universite" ADD CONSTRAINT "idUtilisateur" FOREIGN KEY ("idUtilisateur") REFERENCES "public"."utilisateur"("idUtilisateur") ON DELETE CASCADE ON UPDATE CASCADE;
