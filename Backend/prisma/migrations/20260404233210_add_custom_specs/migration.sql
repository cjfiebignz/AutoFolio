-- CreateTable
CREATE TABLE "UserVehicleCustomSpec" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVehicleCustomSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserVehicleCustomSpec_vehicleId_idx" ON "UserVehicleCustomSpec"("vehicleId");

-- AddForeignKey
ALTER TABLE "UserVehicleCustomSpec" ADD CONSTRAINT "UserVehicleCustomSpec_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
