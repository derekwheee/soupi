import { Prisma } from '@prisma/client';
import prisma from '../../prisma';
import { parseIngredients } from './ingredient';
import { scrapeRecipe } from './scraper';

type RecipeWithJoins = Prisma.RecipeGetPayload<{
    include: {
        ingredients: true;
        tags: true;
    };
}>;

export async function getAllRecipes(userId: string): Promise<RecipeWithJoins[]> {
    return prisma.recipe.findMany({
        where: { userId },
        include: {
            ingredients: true,
            tags: true
        }
    });
}

export async function getRecipe(userId: string, id: number): Promise<RecipeWithJoins> {
    return prisma.recipe.findUniqueOrThrow({
        where: { id, userId },
        include: {
            ingredients: true,
            tags: true
        }
    });
}

export async function createRecipe(userId: string, data: any): Promise<RecipeWithJoins> {

    const { id, ingredients, ...recipe } = data;

    const newRecipe = await prisma.recipe.create({
        data: {
            userId,
            name: recipe.name,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            servings: recipe.servings,
            instructions: recipe.instructions
        }
    });

    if (!ingredients || ingredients.length === 0) {
        return {
            ...newRecipe,
            ingredients: [],
            tags: []
        };
    }

    const newIngredients = await prisma.ingredient.createManyAndReturn({
        data: [
            ...ingredients.map((sentence: string) => ({
                userId,
                recipeId: newRecipe.id,
                sentence
            }))
        ]
    });

    return parseIngredients({
        ...newRecipe,
        ingredients: newIngredients,
        tags: []
    });
}

export async function createRecipeFromUrl(userId: string, url: string): Promise<RecipeWithJoins> {
    const recipeData = await scrapeRecipe(url);

    const recipe = {
        userId,
        name: recipeData.name || 'Untitled Recipe',
        prepTime: parseTimes(recipeData.prepTime),
        cookTime: parseTimes(recipeData.cookTime),
        servings: recipeData.recipeYield ? Number(recipeData.recipeYield) : null,
        instructions: recipeData.instructions,
        ingredients: recipeData.ingredients
    };

    return createRecipe(userId, recipe);
}

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