-- AlterTable
ALTER TABLE "etudiant" ADD COLUMN     "dateVerificationIdentite" DATE,
ADD COLUMN     "estVerifieIdentite" BOOLEAN DEFAULT false;
