import { vi } from 'vitest';

import { mockCategory, mockPantryItem } from '../../fixtures/pantry';
import { prismaMock } from '../../mocks/prisma';

vi.mock('../../../prisma', () => ({ default: prismaMock }));

const { getListByCategory } = await import('../../../src/services/shopping-list');

describe('getListByCategory()', () => {
    it('returns categories with in-stock pantry items', async () => {
        const categoryWithItems = {
            ...mockCategory,
            pantryItems: [mockPantryItem],
        };
        prismaMock.itemCategory.findMany.mockResolvedValue([categoryWithItems] as never);

        const result = await getListByCategory(1);

        expect(result).toEqual([categoryWithItems]);
        expect(prismaMock.itemCategory.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { sortOrder: 'asc' },
                where: expect.objectContaining({ deletedAt: null, pantryId: 1 }),
            }),
        );
    });

    it('returns empty array when no items are in shopping list', async () => {
        prismaMock.itemCategory.findMany.mockResolvedValue([]);

        const result = await getListByCategory(99);

        expect(result).toEqual([]);
    });
});
