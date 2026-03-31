import type { Pantry, PantryItem, ItemCategory } from '@prisma/client';

export const mockCategory: ItemCategory = {
    id: 1,
    name: 'Produce',
    icon: '🥦',
    sortOrder: 0,
    isNonFood: false,
    pantryId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
};

export const mockPantryItem: PantryItem = {
    id: 1,
    name: 'Flour',
    isInStock: true,
    isFavorite: false,
    isInShoppingList: false,
    purchasedAt: new Date('2024-01-01'),
    expiresAt: null,
    categoryId: 1,
    pantryId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
};

export const mockPantry: Pantry & { pantryItems: PantryItem[]; itemCategories: ItemCategory[] } = {
    id: 1,
    name: 'My Pantry',
    isDefault: true,
    householdId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    pantryItems: [mockPantryItem],
    itemCategories: [mockCategory],
};
