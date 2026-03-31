import { describe, expect, it, vi } from 'vitest';

import { mockRecipe, mockRecipe2 } from '../../fixtures/recipe';
import '../../mocks/broadcast';
import { prismaMock } from '../../mocks/prisma';

vi.mock('../../../prisma/index', () => ({ default: prismaMock }));
vi.mock('../../../utils/sse', () => ({
    addClient: vi.fn(),
    broadcast: vi.fn(async (_hid: number, _type: unknown, _from: string, cb: () => Promise<unknown>) => cb()),
}));

// Import after mocks are set up
const { completeRecipe, deleteRecipe, getAllRecipes, getRecipe } = await import('../../../src/services/recipe');

describe('getAllRecipes()', () => {
    it('returns paginated recipes with default page/limit', async () => {
        prismaMock.recipe.findMany.mockResolvedValue([mockRecipe, mockRecipe2]);

        const results = await getAllRecipes(1);

        expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                skip: 0,
                take: 50,
                where: { deletedAt: null, householdId: 1 },
            }),
        );
        expect(results).toHaveLength(2);
    });

    it('applies custom page and limit', async () => {
        prismaMock.recipe.findMany.mockResolvedValue([mockRecipe]);

        await getAllRecipes(1, { limit: 10, page: 2 });

        expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 10, take: 10 }),
        );
    });

    it('filters by householdId and excludes soft-deleted', async () => {
        prismaMock.recipe.findMany.mockResolvedValue([]);

        await getAllRecipes(42);

        expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { deletedAt: null, householdId: 42 },
            }),
        );
    });
});

describe('getRecipe()', () => {
    it('returns recipe matching householdId and id', async () => {
        prismaMock.recipe.findUniqueOrThrow.mockResolvedValue(mockRecipe);

        const result = await getRecipe(1, 1);

        expect(prismaMock.recipe.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { householdId: 1, id: 1 } }),
        );
        expect(result.id).toBe(1);
    });

    it('throws if recipe not found (Prisma throws)', async () => {
        prismaMock.recipe.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

        await expect(getRecipe(1, 999)).rejects.toThrow('Not found');
    });
});

describe('deleteRecipe()', () => {
    it('soft-deletes by setting deletedAt', async () => {
        prismaMock.recipe.update.mockResolvedValue({ ...mockRecipe, deletedAt: new Date() });

        await deleteRecipe(1, 1);

        expect(prismaMock.recipe.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ deletedAt: expect.any(Date) }),
                where: { householdId: 1, id: 1 },
            }),
        );
    });
});

describe('completeRecipe()', () => {
    it('increments timesMade and sets lastMade', async () => {
        // $transaction: call the callback
        prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
        prismaMock.recipe.findFirstOrThrow.mockResolvedValue(mockRecipe);
        prismaMock.recipe.update.mockResolvedValue({ ...mockRecipe, timesMade: 1 });
        prismaMock.pantryItem.findMany.mockResolvedValue([]);
        prismaMock.planDay.findMany.mockResolvedValue([]);

        await completeRecipe(1, { rating: 4, recipeId: 1 });

        expect(prismaMock.recipe.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    lastMade: expect.any(Date),
                    timesMade: { increment: 1 },
                }),
            }),
        );
    });

    it('marks finished pantry items as out of stock', async () => {
        prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
        prismaMock.recipe.findFirstOrThrow.mockResolvedValue(mockRecipe);
        prismaMock.recipe.update.mockResolvedValue(mockRecipe);
        prismaMock.pantryItem.findMany.mockResolvedValue([{ id: 10, isFavorite: false } as any]);
        prismaMock.pantryItem.update.mockResolvedValue({} as any);
        prismaMock.planDay.findMany.mockResolvedValue([]);

        await completeRecipe(1, { finishedPantryItems: [10], recipeId: 1 });

        expect(prismaMock.pantryItem.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ isInStock: false }),
                where: { id: 10 },
            }),
        );
    });

    it('adds favorite finished items to shopping list', async () => {
        prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
        prismaMock.recipe.findFirstOrThrow.mockResolvedValue(mockRecipe);
        prismaMock.recipe.update.mockResolvedValue(mockRecipe);
        prismaMock.pantryItem.findMany.mockResolvedValue([{ id: 10, isFavorite: true } as any]);
        prismaMock.pantryItem.update.mockResolvedValue({} as any);
        prismaMock.planDay.findMany.mockResolvedValue([]);

        await completeRecipe(1, { finishedPantryItems: [10], recipeId: 1 });

        expect(prismaMock.pantryItem.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ isInShoppingList: true }),
            }),
        );
    });
});
