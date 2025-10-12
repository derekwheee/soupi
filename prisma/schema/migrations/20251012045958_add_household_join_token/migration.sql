/*
  Warnings:

  - A unique constraint covering the columns `[joinToken]` on the table `Household` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "joinToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Household_joinToken_key" ON "Household"("joinToken");
