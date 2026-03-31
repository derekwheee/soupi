import { vi } from 'vitest';

import { prismaMock } from '../../mocks/prisma';

vi.mock('../../../prisma', () => ({ default: prismaMock }));
vi.mock('ai', () => ({ generateObject: vi.fn() }));
vi.mock('@ai-sdk/openai', () => ({ openai: vi.fn().mockReturnValue('gpt-4o-mini') }));

import { generateObject } from 'ai';
const { getExpiringPantryItems, getRecipeSuggestions } = await import('../../../src/services/ai');

beforeEach(() => {
    vi.clearAllMocks();
});

const mockItem = {
    categoryId: 1,
    createdAt: new Date(),
    deletedAt: null,
    expiresAt: null,
    id: 1,
    isFavorite: false,
    isInShoppingList: false,
    isInStock: true,
    name: 'Milk',
    pantryId: 1,
    purchasedAt: new Date('2024-01-01'),
    updatedAt: new Date(),
} as never;

describe('getExpiringPantryItems()', () => {
    it('returns items expiring soon without calling AI when no items need dates', async () => {
        prismaMock.pantryItem.findMany
            .mockResolvedValueOnce([]) // items needing expiration dates
            .mockResolvedValueOnce([mockItem]); // expiring items

        const result = await getExpiringPantryItems(1);

        expect(generateObject).not.toHaveBeenCalled();
        expect(result).toEqual([mockItem]);
    });

    it('calls AI and updates expiration dates for items missing them', async () => {
        const expiresAt = new Date('2024-03-01').toISOString();
        vi.mocked(generateObject).mockResolvedValue({
            object: {
                pantryItems: [{ expiresAt, id: 1, name: 'Milk', purchasedAt: '2024-01-01' }],
            },
        } as never);

        prismaMock.pantryItem.findMany.mockResolvedValueOnce([mockItem]).mockResolvedValueOnce([]);
        prismaMock.pantryItem.update.mockResolvedValue(mockItem);

        await getExpiringPantryItems(1);

        expect(generateObject).toHaveBeenCalledOnce();
        expect(prismaMock.pantryItem.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { expiresAt: new Date(expiresAt) },
                where: { id: 1 },
            }),
        );
    });

    it('returns empty array when AI returns no data', async () => {
        vi.mocked(generateObject).mockResolvedValue(null as never);

        prismaMock.pantryItem.findMany.mockResolvedValueOnce([mockItem]).mockResolvedValueOnce([]);

        const result = await getExpiringPantryItems(1);

        expect(result).toEqual([]);
    });
});

describe('getRecipeSuggestions()', () => {
    it('returns recipe suggestions from AI', async () => {
        prismaMock.pantryItem.findMany.mockResolvedValue([mockItem]);
        vi.mocked(generateObject).mockResolvedValue({
            object: {
                recipes: [
                    {
                        ingredients: ['1 cup milk'],
                        instructions: ['Boil milk'],
                        name: 'Hot Milk',
                    },
                ],
            },
        } as never);

        const result = await getRecipeSuggestions(1);

        expect(generateObject).toHaveBeenCalledOnce();
        expect(result).toHaveLength(1);
        expect(result![0].name).toBe('Hot Milk');
    });

    it('returns null when AI returns no data', async () => {
        prismaMock.pantryItem.findMany.mockResolvedValue([mockItem]);
        vi.mocked(generateObject).mockResolvedValue(null as never);

        const result = await getRecipeSuggestions(1);

        expect(result).toBeNull();
    });

    it('applies tags and keywords to the prompt', async () => {
        prismaMock.pantryItem.findMany.mockResolvedValue([mockItem]);
        vi.mocked(generateObject).mockResolvedValue({
            object: { recipes: [] },
        } as never);

        await getRecipeSuggestions(1, 'vegan', 'soup');

        const call = vi.mocked(generateObject).mock.calls[0][0] as { prompt: string };
        expect(call.prompt).toContain('vegan');
        expect(call.prompt).toContain('soup');
    });
});
