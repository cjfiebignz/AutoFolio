/*
  Warnings:

  - A unique constraint covering the columns `[dailyVehicleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyVehicleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_dailyVehicleId_key" ON "User"("dailyVehicleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dailyVehicleId_fkey" FOREIGN KEY ("dailyVehicleId") REFERENCES "UserVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
