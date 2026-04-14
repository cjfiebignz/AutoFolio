-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('active', 'pending', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('active', 'pending', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "ReminderSourceType" AS ENUM ('registration', 'insurance', 'maintenance', 'other');

-- AlterTable
-- Use USING clause to cast the existing text values to the new enum type.
-- This prevents data loss for existing records.

-- 1. RegistrationRecord
ALTER TABLE "RegistrationRecord" 
  ALTER COLUMN "registrationStatus" DROP DEFAULT,
  ALTER COLUMN "registrationStatus" TYPE "RegistrationStatus" USING "registrationStatus"::"RegistrationStatus",
  ALTER COLUMN "registrationStatus" SET DEFAULT 'active';

-- 2. InsuranceRecord
ALTER TABLE "InsuranceRecord" 
  ALTER COLUMN "insuranceStatus" DROP DEFAULT,
  ALTER COLUMN "insuranceStatus" TYPE "InsuranceStatus" USING "insuranceStatus"::"InsuranceStatus",
  ALTER COLUMN "insuranceStatus" SET DEFAULT 'active';

-- 3. Reminder
ALTER TABLE "Reminder"
  ALTER COLUMN "sourceType" TYPE "ReminderSourceType" USING "sourceType"::"ReminderSourceType";
