-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specId" TEXT,
    "vin" TEXT,
    "licensePlate" TEXT,
    "nickname" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAttribute" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "attrKey" TEXT NOT NULL,
    "attrValue" TEXT NOT NULL,
    "isModification" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OdometerReading" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OdometerReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceEvent" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Service',
    "eventDate" TIMESTAMP(3) NOT NULL,
    "odometerAtEvent" INTEGER,
    "serviceType" TEXT NOT NULL DEFAULT 'workshop',
    "notes" TEXT,
    "totalCost" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "regNumber" TEXT,
    "issuingBody" TEXT,
    "cost" DECIMAL(10,2),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RegistrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT,
    "premiumAmount" DECIMAL(10,2),
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InsuranceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "serviceEventId" TEXT,
    "label" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderRule" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "intervalKm" INTEGER,
    "intervalMonths" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReminderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderInstance" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "dueKm" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReminderInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkJob" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "priority" TEXT DEFAULT 'medium',
    "date" TIMESTAMP(3),
    "notes" TEXT,
    "estimate" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserVehicle_userId_idx" ON "UserVehicle"("userId");

-- CreateIndex
CREATE INDEX "UserVehicle_specId_idx" ON "UserVehicle"("specId");

-- CreateIndex
CREATE INDEX "OdometerReading_vehicleId_readingDate_idx" ON "OdometerReading"("vehicleId", "readingDate" DESC);

-- CreateIndex
CREATE INDEX "ServiceEvent_vehicleId_eventDate_idx" ON "ServiceEvent"("vehicleId", "eventDate" DESC);

-- CreateIndex
CREATE INDEX "RegistrationRecord_vehicleId_isCurrent_idx" ON "RegistrationRecord"("vehicleId", "isCurrent");

-- CreateIndex
CREATE INDEX "InsuranceRecord_vehicleId_isCurrent_idx" ON "InsuranceRecord"("vehicleId", "isCurrent");

-- CreateIndex
CREATE INDEX "Document_vehicleId_idx" ON "Document"("vehicleId");

-- CreateIndex
CREATE INDEX "Document_serviceEventId_idx" ON "Document"("serviceEventId");

-- CreateIndex
CREATE INDEX "ReminderRule_vehicleId_idx" ON "ReminderRule"("vehicleId");

-- CreateIndex
CREATE INDEX "ReminderInstance_ruleId_status_idx" ON "ReminderInstance"("ruleId", "status");

-- CreateIndex
CREATE INDEX "WorkJob_vehicleId_status_idx" ON "WorkJob"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "WorkJob_vehicleId_createdAt_idx" ON "WorkJob"("vehicleId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "UserVehicle" ADD CONSTRAINT "UserVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAttribute" ADD CONSTRAINT "VehicleAttribute_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OdometerReading" ADD CONSTRAINT "OdometerReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceEvent" ADD CONSTRAINT "ServiceEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationRecord" ADD CONSTRAINT "RegistrationRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceRecord" ADD CONSTRAINT "InsuranceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_serviceEventId_fkey" FOREIGN KEY ("serviceEventId") REFERENCES "ServiceEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderRule" ADD CONSTRAINT "ReminderRule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderInstance" ADD CONSTRAINT "ReminderInstance_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ReminderRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkJob" ADD CONSTRAINT "WorkJob_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
