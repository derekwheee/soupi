/*
  Warnings:

  - You are about to drop the column `pantryItemId` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Ingredient` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_pantryItemId_fkey";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "pantryItemId",
DROP COLUMN "quantity",
ADD COLUMN     "amount" TEXT,
ADD COLUMN     "json" JSONB,
ADD COLUMN     "preparation" TEXT,
ADD COLUMN     "sentence" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "size" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PantryItem" ADD COLUMN     "isInStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "purchasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "instructions" JSONB;
