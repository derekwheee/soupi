import { describe, it, expect, vi } from 'vitest';
import { prismaMock } from '../../mocks/prisma';
import { mockCategory, mockCategory2 } from '../../fixtures/category';
import { mockPantry } from '../../fixtures/pantry';

vi.mock('../../../prisma/index', () => ({ default: prismaMock }));
vi.mock('../../../utils/sse', () => ({
    broadcast: vi.fn(async (_hid: number, _type: unknown, _from: string, cb: () => Promise<unknown>) => cb()),
    addClient: vi.fn(),
}));

const { getCategories, upsertCategory, updateSortOrder } = await import('../../../src/services/category');

describe('getCategories()', () => {
    it('returns categories sorted by sortOrder', async () => {
        prismaMock.itemCategory.findMany.mockResolvedValue([mockCategory, mockCategory2]);

        const result = await getCategories(1);

        expect(prismaMock.itemCategory.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { pantryId: 1, deletedAt: null },
                orderBy: { sortOrder: 'asc' },
            }),
        );
        expect(result).toHaveLength(2);
    });
});

describe('upsertCategory()', () => {
    it('creates a new category when none exists', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockResolvedValue(mockPantry as any);
        prismaMock.itemCategory.findFirst.mockResolvedValue(null);
        prismaMock.itemCategory.create.mockResolvedValue(mockCategory);

        const result = await upsertCategory(1, 1, { name: 'Produce', icon: '🥦' });

        expect(prismaMock.itemCategory.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ name: 'Produce', pantryId: 1 }),
            }),
        );
        expect(result.name).toBe('Produce');
    });

    it('updates existing category when found', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockResolvedValue(mockPantry as any);
        prismaMock.itemCategory.findFirst.mockResolvedValue(mockCategory);
        prismaMock.itemCategory.update.mockResolvedValue({ ...mockCategory, name: 'Vegetables' });

        const result = await upsertCategory(1, 1, { name: 'Vegetables' });

        expect(prismaMock.itemCategory.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: mockCategory.id } }),
        );
    });

    it('throws when pantry not found', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

        await expect(upsertCategory(99, 99, { name: 'X' })).rejects.toThrow('Not found');
    });
});

describe('updateSortOrder()', () => {
    it('batches all updates in a single transaction', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockResolvedValue(mockPantry as any);
        prismaMock.$transaction.mockResolvedValue([]);

        await updateSortOrder(1, 1, [3, 1, 2]);

        expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
        // The transaction receives an array of 3 prisma operations
        const txArg = (prismaMock.$transaction as any).mock.calls[0][0];
        expect(Array.isArray(txArg)).toBe(true);
        expect(txArg).toHaveLength(3);
    });

    it('passes correct sort indices to each updateMany', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockResolvedValue(mockPantry as any);
        prismaMock.itemCategory.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.$transaction.mockImplementation(async (ops: any) => {
            // Execute each operation to verify arguments
            return Promise.all(ops);
        });

        await updateSortOrder(1, 1, [10, 20, 30]);

        expect(prismaMock.itemCategory.updateMany).toHaveBeenNthCalledWith(
            1, expect.objectContaining({ where: { id: 10, pantryId: 1 }, data: { sortOrder: 0 } }),
        );
        expect(prismaMock.itemCategory.updateMany).toHaveBeenNthCalledWith(
            2, expect.objectContaining({ where: { id: 20, pantryId: 1 }, data: { sortOrder: 1 } }),
        );
        expect(prismaMock.itemCategory.updateMany).toHaveBeenNthCalledWith(
            3, expect.objectContaining({ where: { id: 30, pantryId: 1 }, data: { sortOrder: 2 } }),
        );
    });

    it('does nothing with an empty array', async () => {
        prismaMock.pantry.findUniqueOrThrow.mockResolvedValue(mockPantry as any);
        prismaMock.$transaction.mockResolvedValue([]);

        await updateSortOrder(1, 1, []);

        const txArg = (prismaMock.$transaction as any).mock.calls[0][0];
        expect(txArg).toHaveLength(0);
    });
});
