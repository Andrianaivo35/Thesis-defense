-- CreateTable
CREATE TABLE "DocumentCandidature" (
    "idDocument" SERIAL NOT NULL,
    "idCandidature" INTEGER NOT NULL,
    "nomFichier" VARCHAR(255) NOT NULL,
    "nomFichierOriginal" VARCHAR(255),
    "tailleOctets" INTEGER,
    "dateAjout" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCandidature_pkey" PRIMARY KEY ("idDocument")
);

-- CreateIndex
CREATE INDEX "idx_document_candidature" ON "DocumentCandidature"("idCandidature");

-- AddForeignKey
ALTER TABLE "DocumentCandidature" ADD CONSTRAINT "DocumentCandidature_idCandidature_fkey" FOREIGN KEY ("idCandidature") REFERENCES "Candidature"("idCandidature") ON DELETE CASCADE ON UPDATE NO ACTION;
