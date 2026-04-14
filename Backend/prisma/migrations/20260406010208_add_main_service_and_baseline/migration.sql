-- AlterTable
ALTER TABLE "ServiceEvent" ADD COLUMN     "isMainService" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserVehicle" ADD COLUMN     "serviceSettingsBaseDate" TIMESTAMP(3),
ADD COLUMN     "serviceSettingsBaseKms" INTEGER;
