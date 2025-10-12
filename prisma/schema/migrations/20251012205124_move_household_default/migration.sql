/*
  Warnings:

  - You are about to drop the column `isDefault` on the `Household` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Household" DROP COLUMN "isDefault";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "defaultHouseholdId" INTEGER;
