/*
  Warnings:

  - Made the column `householdId` on table `RecipeTag` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "RecipeTag" DROP CONSTRAINT "RecipeTag_householdId_fkey";

-- AlterTable
ALTER TABLE "RecipeTag" ALTER COLUMN "householdId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "RecipeTag" ADD CONSTRAINT "RecipeTag_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
