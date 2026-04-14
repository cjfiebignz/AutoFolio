-- AlterTable
ALTER TABLE "UserVehicle" ADD COLUMN "publicShareCreatedAt" TIMESTAMP(3),
ADD COLUMN "publicShareEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publicShareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserVehicle_publicShareToken_key" ON "UserVehicle"("publicShareToken");
