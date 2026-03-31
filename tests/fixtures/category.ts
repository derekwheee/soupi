import type { ItemCategory } from '@prisma/client';

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

export const mockCategory2: ItemCategory = {
    ...mockCategory,
    id: 2,
    name: 'Dairy',
    icon: '🥛',
    sortOrder: 1,
};
