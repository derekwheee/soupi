import type { ItemCategory } from '@prisma/client';

export const mockCategory: ItemCategory = {
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    icon: '🥦',
    id: 1,
    isNonFood: false,
    name: 'Produce',
    pantryId: 1,
    sortOrder: 0,
    updatedAt: new Date('2024-01-01'),
};

export const mockCategory2: ItemCategory = {
    ...mockCategory,
    icon: '🥛',
    id: 2,
    name: 'Dairy',
    sortOrder: 1,
};
