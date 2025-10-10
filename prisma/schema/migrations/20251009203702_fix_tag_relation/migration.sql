/*
  Warnings:

  - You are about to drop the `_RecipeTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_RecipeTags" DROP CONSTRAINT "_RecipeTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_RecipeTags" DROP CONSTRAINT "_RecipeTags_B_fkey";

-- DropTable
DROP TABLE "_RecipeTags";

-- CreateTable
CREATE TABLE "_RecipeToRecipeTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RecipeToRecipeTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RecipeToRecipeTag_B_index" ON "_RecipeToRecipeTag"("B");

-- AddForeignKey
ALTER TABLE "_RecipeToRecipeTag" ADD CONSTRAINT "_RecipeToRecipeTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecipeToRecipeTag" ADD CONSTRAINT "_RecipeToRecipeTag_B_fkey" FOREIGN KEY ("B") REFERENCES "RecipeTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
