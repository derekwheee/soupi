/*
  Warnings:

  - You are about to drop the column `userId` on the `ItemCategory` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PantryItem` table. All the data in the column will be lost.
  - Added the required column `pantryId` to the `ItemCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pantryId` to the `PantryItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ItemCategory" DROP CONSTRAINT "ItemCategory_userId_fkey";

-- DropForeignKey
ALTER TABLE "PantryItem" DROP CONSTRAINT "PantryItem_userId_fkey";

-- AlterTable
ALTER TABLE "ItemCategory" DROP COLUMN "userId",
ADD COLUMN     "pantryId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PantryItem" DROP COLUMN "userId",
ADD COLUMN     "pantryId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Pantry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Pantry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PantryToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PantryToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PantryToUser_B_index" ON "_PantryToUser"("B");

-- AddForeignKey
ALTER TABLE "ItemCategory" ADD CONSTRAINT "ItemCategory_pantryId_fkey" FOREIGN KEY ("pantryId") REFERENCES "Pantry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryItem" ADD CONSTRAINT "PantryItem_pantryId_fkey" FOREIGN KEY ("pantryId") REFERENCES "Pantry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PantryToUser" ADD CONSTRAINT "_PantryToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Pantry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PantryToUser" ADD CONSTRAINT "_PantryToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
