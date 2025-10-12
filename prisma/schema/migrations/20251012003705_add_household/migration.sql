/*
  Warnings:

  - You are about to drop the column `userId` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the `_PantryToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `householdId` to the `Pantry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_userId_fkey";

-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_userId_fkey";

-- DropForeignKey
ALTER TABLE "_PantryToUser" DROP CONSTRAINT "_PantryToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_PantryToUser" DROP CONSTRAINT "_PantryToUser_B_fkey";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Pantry" ADD COLUMN     "householdId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "userId",
ADD COLUMN     "householdId" INTEGER;

-- DropTable
DROP TABLE "_PantryToUser";

-- CreateTable
CREATE TABLE "Household" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_HouseholdToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HouseholdToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_HouseholdToUser_B_index" ON "_HouseholdToUser"("B");

-- AddForeignKey
ALTER TABLE "Pantry" ADD CONSTRAINT "Pantry_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HouseholdToUser" ADD CONSTRAINT "_HouseholdToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HouseholdToUser" ADD CONSTRAINT "_HouseholdToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
