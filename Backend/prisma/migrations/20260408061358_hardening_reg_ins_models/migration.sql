/*
  Warnings:

  - You are about to drop the column `startDate` on the `InsuranceRecord` table. All the data in the column will be lost.
  - You are about to drop the column `issueDate` on the `RegistrationRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InsuranceRecord" DROP COLUMN "startDate",
ADD COLUMN     "insuranceStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "policyStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RegistrationRecord" DROP COLUMN "issueDate",
ADD COLUMN     "registrationStartDate" TIMESTAMP(3),
ADD COLUMN     "registrationStatus" TEXT NOT NULL DEFAULT 'active';
