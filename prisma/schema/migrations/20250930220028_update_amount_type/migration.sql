/*
  Warnings:

  - The `amount` column on the `Ingredient` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "amount",
ADD COLUMN     "amount" DECIMAL(65,30);
