-- CreateTable
CREATE TABLE "WorkJobPart" (
    "id" TEXT NOT NULL,
    "workJobId" TEXT NOT NULL,
    "savedPartId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceSnapshot" DECIMAL(12,2),
    "lineTotalSnapshot" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "WorkJobPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkJobSpec" (
    "id" TEXT NOT NULL,
    "workJobId" TEXT NOT NULL,
    "customSpecId" TEXT NOT NULL,

    CONSTRAINT "WorkJobSpec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkJobPart_workJobId_idx" ON "WorkJobPart"("workJobId");

-- CreateIndex
CREATE INDEX "WorkJobPart_savedPartId_idx" ON "WorkJobPart"("savedPartId");

-- CreateIndex
CREATE INDEX "WorkJobSpec_workJobId_idx" ON "WorkJobSpec"("workJobId");

-- CreateIndex
CREATE INDEX "WorkJobSpec_customSpecId_idx" ON "WorkJobSpec"("customSpecId");

-- AddForeignKey
ALTER TABLE "WorkJobPart" ADD CONSTRAINT "WorkJobPart_workJobId_fkey" FOREIGN KEY ("workJobId") REFERENCES "WorkJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkJobPart" ADD CONSTRAINT "WorkJobPart_savedPartId_fkey" FOREIGN KEY ("savedPartId") REFERENCES "SavedPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkJobSpec" ADD CONSTRAINT "WorkJobSpec_workJobId_fkey" FOREIGN KEY ("workJobId") REFERENCES "WorkJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkJobSpec" ADD CONSTRAINT "WorkJobSpec_customSpecId_fkey" FOREIGN KEY ("customSpecId") REFERENCES "UserVehicleCustomSpec"("id") ON DELETE CASCADE ON UPDATE CASCADE;
