/*
  Warnings:

  - You are about to drop the column `name` on the `Ingredient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "name",
ADD COLUMN     "item" TEXT,
ADD COLUMN     "unit" TEXT;
