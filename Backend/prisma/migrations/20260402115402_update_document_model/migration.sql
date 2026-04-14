/*
  Warnings:

  - You are about to drop the column `label` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `Document` table. All the data in the column will be lost.
  - Added the required column `title` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "label",
DROP COLUMN "uploadedAt",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'other',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "fileUrl" DROP NOT NULL;
