import { Prisma, Recipe } from '@prisma/client';
import prisma from '../../prisma';
import { parseIngredients } from './ingredient';
import { scrapeRecipe } from './scraper';
import { broadcast } from '../../utils/sse';
import { SSEMessageType } from '../../utils/constants';

type RecipeWithJoins = Prisma.RecipeGetPayload<{
    include: {
        ingredients: true;
        tags: true;
    };
}>;

type RecipeUpsert = {
    id?: number;
    ingredients?: string[];
    name?: string;
    prepTime?: string | null;
    cookTime?: string | null;
    servings?: string | null;
    instructions?: string[] | null;
    tags?: { id: number; name: string }[];
    source?: string | null;
};

type RecipeCompletion = {
    recipeId: number;
    rating?: number;
    finishedPantryItems?: number[];
};

export async function getAllRecipes(
    householdId: number,
): Promise<RecipeWithJoins[]> {
    // broadcast(householdId, {
    //     type: SSEMessageType.RECIPE_UPDATE,
    //     from: 'getAllRecipes',
    //     data: {},
    // });
    return prisma.recipe.findMany({
        where: { householdId, deletedAt: null },
        include: {
            ingredients: { orderBy: { id: 'asc' } },
            tags: { orderBy: { id: 'asc' } },
        },
    });
}

export async function getRecipe(
    householdId: number,
    id: number,
): Promise<RecipeWithJoins> {
    return prisma.recipe.findUniqueOrThrow({
        where: { id, householdId },
        include: {
            ingredients: { orderBy: { id: 'asc' } },
            tags: { orderBy: { id: 'asc' } },
        },
    });
}

export async function createRecipeFromUrl(
    householdId: number,
    url: string,
): Promise<RecipeWithJoins> {
    const recipeData = await scrapeRecipe(url);

    if (!recipeData) {
        throw new Error('Failed to scrape recipe from URL');
    }

    const recipe: RecipeUpsert = {
        name: recipeData.name || 'Untitled Recipe',
        prepTime: parseTimes(recipeData.prepTime),
        cookTime: parseTimes(recipeData.cookTime),
        servings: recipeData.servings,
        instructions: recipeData.instructions,
        ingredients: recipeData.ingredients,
        source: url,
    };

    return upsertRecipe(householdId, recipe);
}

export async function upsertRecipe(
    householdId: number,
    patch: RecipeUpsert,
): Promise<RecipeWithJoins> {
    return await broadcast<RecipeWithJoins>(
        householdId,
        SSEMessageType.RECIPE_UPDATE,
        'upsertRecipe',
        async () => {
            const { id, ingredients, tags = [], ...data } = patch;
            let updatedRecipe;

            if (!id) {
                updatedRecipe = await prisma.recipe.create({
                    data: {
                        ...(data as Prisma.RecipeUncheckedCreateInput),
                        householdId,
                        tags: {
                            connectOrCreate: tags.map((tag) => ({
                                where: { name: tag.name, householdId },
                                create: { name: tag.name, householdId },
                            })),
                        },
                    },
                });
            } else {
                updatedRecipe = await prisma.recipe.update({
                    where: { id, householdId },
                    data: {
                        ...(data as Prisma.RecipeUpdateInput),
                        tags: {
                            set: [],
                            connectOrCreate: tags.map((tag) => ({
                                where: { name: tag.name, householdId },
                                create: { name: tag.name, householdId },
                            })),
                        },
                    },
                });
            }

            return processIngredients(updatedRecipe, ingredients);
        },
    );
}

export async function deleteRecipe(
    householdId: number,
    id: number,
): Promise<void> {
    broadcast<void>(
        householdId,
        SSEMessageType.RECIPE_DELETE,
        'deleteRecipe',
        async () => {
            await prisma.recipe.update({
                where: { id, householdId },
                data: { deletedAt: new Date() },
            });
        },
    );
}

export async function getAllRecipeTags(householdId: number) {
    return prisma.recipeTag.findMany({
        where: { recipes: { every: { householdId } } },
        orderBy: { name: 'asc' },
    });
}

export async function completeRecipe(
    householdId: number,
    completion: RecipeCompletion,
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        
        const recipe = await tx.recipe.findFirstOrThrow({
            where: { id: completion.recipeId, householdId },
        });

        await tx.recipe.update({
            where: { id: completion.recipeId, householdId },
            data: {
                rating: completion.rating || recipe.rating,
                timesMade: { increment: 1 },
                lastMade: new Date(),
            },
        });

        const items = await tx.pantryItem.findMany({
            where: { id: { in: completion.finishedPantryItems } },
            select: { id: true, isFavorite: true },
        });

        for (const item of items) {
            await tx.pantryItem.update({
                where: { id: item.id },
                data: {
                    isInStock: false,
                    isInShoppingList: item.isFavorite ? true : false,
                },
            });
        }
    });
}

const processIngredients = async (recipe: Recipe, ingredients?: string[]) => {
    let newIngredients;

    if (ingredients && ingredients.length > 0) {
        await prisma.ingredient.deleteMany({
            where: { recipeId: recipe.id },
        });

        newIngredients = await prisma.ingredient.createManyAndReturn({
            data: ingredients.map((sentence: string) => ({
                recipeId: recipe.id,
                sentence,
            })),
        });
    }

    return parseIngredients({
        ...recipe,
        ingredients: newIngredients || ingredients || [],
    });
};

const parseTimes = (time?: string | null | undefined) => {
    if (!time) return time;

    if (time.match(/PT\d+\w+/)) {
        const [, minutes, flag] = /(\d+)(\w+)/.exec(time) || [];
        let parsed = '';

        if (flag === 'M') {
            const mins = Number(minutes);
            const hours = Math.floor(mins / 60);
            const remMinutes = mins % 60;

            if (hours > 0) {
                parsed += `${hours} hour${hours > 1 ? 's ' : ' '}`;
            }
            if (remMinutes > 0) {
                parsed += `${remMinutes} min${remMinutes > 1 ? 's' : ''}`;
            }

            return parsed.trim();
        }
    }

    return time;
};
