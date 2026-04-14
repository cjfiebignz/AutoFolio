-- CreateEnum
CREATE TYPE "AccountPlan" AS ENUM ('free', 'pro');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "plan" "AccountPlan" NOT NULL DEFAULT 'free';
