-- AutoFolio Initial Schema Migration
-- Target: PostgreSQL 13+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Vehicles
CREATE TABLE "UserVehicle" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "specId" TEXT, -- Public SpecHUB specID
    "vin" TEXT,
    "licensePlate" TEXT,
    "nickname" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "idx_uservehicle_user" ON "UserVehicle"("userId");
CREATE INDEX "idx_uservehicle_spec" ON "UserVehicle"("specId");

-- 3. Vehicle Attributes
CREATE TABLE "VehicleAttribute" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL REFERENCES "UserVehicle"("id") ON DELETE CASCADE,
    "attrKey" TEXT NOT NULL,
    "attrValue" TEXT NOT NULL,
    "isModification" BOOLEAN DEFAULT FALSE,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Odometer Readings
CREATE TABLE "OdometerReading" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL REFERENCES "UserVehicle"("id") ON DELETE CASCADE,
    "value" INTEGER NOT NULL,
    "readingDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "source" TEXT DEFAULT 'manual',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "idx_odometer_lookup" ON "OdometerReading"("vehicleId", "readingDate" DESC);

-- 5. Service Events
CREATE TABLE "ServiceEvent" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL REFERENCES "UserVehicle"("id") ON DELETE CASCADE,
    "eventDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "odometerAtEvent" INTEGER,
    "eventType" TEXT DEFAULT 'maintenance',
    "summary" TEXT,
    "totalCost" DECIMAL(12, 2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "idx_service_lookup" ON "ServiceEvent"("vehicleId", "eventDate" DESC);

-- 6. Registration
CREATE TABLE "RegistrationRecord" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL REFERENCES "UserVehicle"("id") ON DELETE CASCADE,
    "expiryDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "regNumber" TEXT,
    "issuingBody" TEXT,
    "cost" DECIMAL(10, 2),
    "isCurrent" BOOLEAN DEFAULT TRUE
);

-- 7. Insurance
CREATE TABLE "InsuranceRecord" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL REFERENCES "UserVehicle"("id") ON DELETE CASCADE,
    "provider" TEXT NOT NULL,
    "policyNumber" TEXT,
    "premiumAmount" DECIMAL(10, 2),
    "expiryDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isCurrent" BOOLEAN DEFAULT TRUE
);

-- 8. Documents
CREATE TABLE "Document" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL REFERENCES "UserVehicle"("id") ON DELETE CASCADE,
    "serviceEventId" UUID REFERENCES "ServiceEvent"("id") ON DELETE SET NULL,
    "label" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Reminder Rules & Instances
CREATE TABLE "ReminderRule" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vehicleId" UUID NOT NULL REFERENCES "UserVehicle"("id") ON DELETE CASCADE,
    "label" TEXT NOT NULL,
    "intervalKm" INTEGER,
    "intervalMonths" INTEGER,
    "isActive" BOOLEAN DEFAULT TRUE
);

CREATE TABLE "ReminderInstance" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "ruleId" UUID NOT NULL REFERENCES "ReminderRule"("id") ON DELETE CASCADE,
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "dueKm" INTEGER,
    "status" TEXT DEFAULT 'pending',
    "completedAt" TIMESTAMP WITH TIME ZONE
);
CREATE INDEX "idx_reminder_instance_status" ON "ReminderInstance"("ruleId", "status");

CREATE INDEX "idx_uservehicle_active" ON "UserVehicle"("userId", "status");
