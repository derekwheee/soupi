-- AlterTable
ALTER TABLE "PantryItem" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInShoppingList" BOOLEAN NOT NULL DEFAULT false;
