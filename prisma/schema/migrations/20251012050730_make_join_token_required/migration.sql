/*
  Warnings:

  - Made the column `joinToken` on table `Household` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Household" ALTER COLUMN "joinToken" SET NOT NULL;
