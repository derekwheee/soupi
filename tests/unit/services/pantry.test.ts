import { describe, expect, it, vi } from 'vitest';

import { mockPantry, mockPantryItem } from '../../fixtures/pantry';
import { prismaMock } from '../../mocks/prisma';

vi.mock('../../../prisma/index', () => ({ default: prismaMock }));
vi.mock('../../../utils/sse', () => ({
    addClient: vi.fn(),
    broadcast: vi.fn(
        async (_hid: number, _type: unknown, _from: string, cb: () => Promise<unknown>) => cb(),
    ),
}));

const { getAllPantryItems, getPantries, getPantryItem, upsertPantryItem } = await import(
    '../../../src/services/pantry'
);

describe('getPantries()', () => {
    it('returns the first pantry for the household', async () => {
        prismaMock.pantry.findFirstOrThrow.mockResolvedValue(mockPantry as any);

        const result = await getPantries(1);

        expect(prismaMock.pantry.findFirstOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { householdId: 1 } }),
        );
        expect(result.id).toBe(1);
    });

    it('throws if no pantry exists', async () => {
        prismaMock.pantry.findFirstOrThrow.mockRejectedValue(new Error('No pantry'));

        await expect(getPantries(99)).rejects.toThrow('No pantry');
    });
});

describe('getAllPantryItems()', () => {
    it('returns items for the pantry filtered by household', async () => {
        prismaMock.pantryItem.findMany.mockResolvedValue([mockPantryItem]);

        const items = await getAllPantryItems(1, 1);

        expect(prismaMock.pantryItem.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { deletedAt: null, pantry: { householdId: 1 }, pantryId: 1 },
            }),
        );
        expect(items).toHaveLength(1);
    });
});

describe('upsertPantryItem()', () => {
    const baseItem = { name: 'Eggs', pantryId: 1 };

    it('creates a new item when none exists', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockResolvedValue(mockPantry as any);
        prismaMock.pantryItem.findFirst.mockResolvedValue(null);
        prismaMock.pantryItem.create.mockResolvedValue({ ...mockPantryItem, name: 'Eggs' });

        const result = await upsertPantryItem(1, baseItem);

        expect(prismaMock.pantryItem.create).toHaveBeenCalled();
        expect(result.name).toBe('Eggs');
    });

    it('updates existing item when found by name', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockResolvedValue(mockPantry as any);
        prismaMock.pantryItem.findFirst.mockResolvedValue(mockPantryItem);
        prismaMock.pantryItem.update.mockResolvedValue({ ...mockPantryItem, isInStock: false });

        await upsertPantryItem(1, { ...baseItem, isInStock: false });

        expect(prismaMock.pantryItem.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: mockPantryItem.id } }),
        );
    });

    it('updates existing item when found by id', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockResolvedValue(mockPantry as any);
        prismaMock.pantryItem.findFirst.mockResolvedValue(mockPantryItem);
        prismaMock.pantryItem.update.mockResolvedValue({ ...mockPantryItem, isFavorite: true });

        await upsertPantryItem(1, { id: 1, isFavorite: true, name: 'Flour', pantryId: 1 });

        expect(prismaMock.pantryItem.update).toHaveBeenCalled();
    });

    it('throws if pantry does not belong to household', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockRejectedValue(new Error('Pantry not found'));

        await expect(upsertPantryItem(99, baseItem)).rejects.toThrow('Pantry not found');
    });
});

describe('getPantryItem()', () => {
    it('returns a pantry item by householdId, pantryId, and itemId', async () => {
        prismaMock.pantryItem.findUniqueOrThrow.mockResolvedValue(mockPantryItem as any);

        const result = await getPantryItem(1, 1, 1);

        expect(prismaMock.pantryItem.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 1, pantry: { householdId: 1 }, pantryId: 1 } }),
        );
        expect(result).toEqual(mockPantryItem);
    });

    it('throws when item is not found', async () => {
        prismaMock.pantryItem.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

        await expect(getPantryItem(1, 1, 999)).rejects.toThrow('Not found');
    });
});
