-- CreateTable
CREATE TABLE "WorkAttachment" (
    "id" TEXT NOT NULL,
    "workJobId" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkAttachment_workJobId_idx" ON "WorkAttachment"("workJobId");

-- AddForeignKey
ALTER TABLE "WorkAttachment" ADD CONSTRAINT "WorkAttachment_workJobId_fkey" FOREIGN KEY ("workJobId") REFERENCES "WorkJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
