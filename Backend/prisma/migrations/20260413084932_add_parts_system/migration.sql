-- CreateTable
CREATE TABLE "SavedPart" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT,
    "description" TEXT,
    "preferredBrand" TEXT,
    "supplier" TEXT,
    "purchaseUrl" TEXT,
    "lastPrice" DECIMAL(12,2),
    "lastPurchaseDate" TIMESTAMP(3),
    "defaultQuantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartPreset" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartPreset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartPresetItem" (
    "id" TEXT NOT NULL,
    "presetId" TEXT NOT NULL,
    "savedPartId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PartPresetItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedPart_vehicleId_idx" ON "SavedPart"("vehicleId");

-- CreateIndex
CREATE INDEX "SavedPart_category_idx" ON "SavedPart"("category");

-- CreateIndex
CREATE INDEX "PartPreset_vehicleId_idx" ON "PartPreset"("vehicleId");

-- CreateIndex
CREATE INDEX "PartPresetItem_presetId_idx" ON "PartPresetItem"("presetId");

-- CreateIndex
CREATE INDEX "PartPresetItem_savedPartId_idx" ON "PartPresetItem"("savedPartId");

-- AddForeignKey
ALTER TABLE "SavedPart" ADD CONSTRAINT "SavedPart_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartPreset" ADD CONSTRAINT "PartPreset_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartPresetItem" ADD CONSTRAINT "PartPresetItem_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "PartPreset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartPresetItem" ADD CONSTRAINT "PartPresetItem_savedPartId_fkey" FOREIGN KEY ("savedPartId") REFERENCES "SavedPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
