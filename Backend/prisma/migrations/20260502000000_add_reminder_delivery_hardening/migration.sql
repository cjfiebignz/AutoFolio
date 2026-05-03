-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('EMAIL', 'IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "UserReminderDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderKey" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "channel" "DeliveryChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedKey" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueOdometer" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReminderDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReminderDelivery_confirmedKey_key" ON "UserReminderDelivery"("confirmedKey");

-- CreateIndex
CREATE INDEX "UserReminderDelivery_userId_idx" ON "UserReminderDelivery"("userId");

-- CreateIndex
CREATE INDEX "UserReminderDelivery_vehicleId_idx" ON "UserReminderDelivery"("vehicleId");

-- CreateIndex
CREATE INDEX "UserReminderDelivery_reminderKey_channel_idx" ON "UserReminderDelivery"("reminderKey", "channel");

-- AddForeignKey
ALTER TABLE "UserReminderDelivery" ADD CONSTRAINT "UserReminderDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReminderDelivery" ADD CONSTRAINT "UserReminderDelivery_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "UserVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
