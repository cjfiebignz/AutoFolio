-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('SERVICE_DUE', 'REGISTRATION_EXPIRY', 'INSURANCE_EXPIRY', 'INSPECTION_EXPIRY');

-- CreateEnum
CREATE TYPE "ReminderTiming" AS ENUM ('AT_EVENT', 'ONE_WEEK_OR_100_DISTANCE_BEFORE', 'TWO_WEEKS_OR_200_DISTANCE_BEFORE', 'ONE_MONTH_OR_1000_DISTANCE_BEFORE');

-- CreateTable
CREATE TABLE "UserReminderPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "timing" "ReminderTiming" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReminderPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserReminderPreference_userId_idx" ON "UserReminderPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReminderPreference_userId_type_timing_key" ON "UserReminderPreference"("userId", "type", "timing");

-- AddForeignKey
ALTER TABLE "UserReminderPreference" ADD CONSTRAINT "UserReminderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
