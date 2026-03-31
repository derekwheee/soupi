import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../../mocks/prisma';
import '../../mocks/broadcast';
import { mockRecipe, mockRecipe2 } from '../../fixtures/recipe';

vi.mock('../../../prisma/index', () => ({ default: prismaMock }));
vi.mock('../../../utils/sse', () => ({
    broadcast: vi.fn(async (_hid: number, _type: unknown, _from: string, cb: () => Promise<unknown>) => cb()),
    addClient: vi.fn(),
}));

// Import after mocks are set up
const { getAllRecipes, getRecipe, deleteRecipe, completeRecipe } = await import('../../../src/services/recipe');

describe('getAllRecipes()', () => {
    it('returns paginated recipes with default page/limit', async () => {
        prismaMock.recipe.findMany.mockResolvedValue([mockRecipe, mockRecipe2]);

        const results = await getAllRecipes(1);

        expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { householdId: 1, deletedAt: null },
                skip: 0,
                take: 50,
            }),
        );
        expect(results).toHaveLength(2);
    });

    it('applies custom page and limit', async () => {
        prismaMock.recipe.findMany.mockResolvedValue([mockRecipe]);

        await getAllRecipes(1, { page: 2, limit: 10 });

        expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip: 10, take: 10 }),
        );
    });

    it('filters by householdId and excludes soft-deleted', async () => {
        prismaMock.recipe.findMany.mockResolvedValue([]);

        await getAllRecipes(42);

        expect(prismaMock.recipe.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { householdId: 42, deletedAt: null },
            }),
        );
    });
});

describe('getRecipe()', () => {
    it('returns recipe matching householdId and id', async () => {
        prismaMock.recipe.findUniqueOrThrow.mockResolvedValue(mockRecipe);

        const result = await getRecipe(1, 1);

        expect(prismaMock.recipe.findUniqueOrThrow).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 1, householdId: 1 } }),
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
                where: { id: 1, householdId: 1 },
                data: expect.objectContaining({ deletedAt: expect.any(Date) }),
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

        await completeRecipe(1, { recipeId: 1, rating: 4 });

        expect(prismaMock.recipe.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    timesMade: { increment: 1 },
                    lastMade: expect.any(Date),
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

        await completeRecipe(1, { recipeId: 1, finishedPantryItems: [10] });

        expect(prismaMock.pantryItem.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 10 },
                data: expect.objectContaining({ isInStock: false }),
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

        await completeRecipe(1, { recipeId: 1, finishedPantryItems: [10] });

        expect(prismaMock.pantryItem.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ isInShoppingList: true }),
            }),
        );
    });
});
