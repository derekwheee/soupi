import { Prisma } from '@prisma/client';
import prisma from '../../prisma';
import { parseIngredients } from './ingredient';
import { scrapeRecipe } from './scraper';

type RecipeWithIngredients = Prisma.RecipeGetPayload<{
    include: { ingredients: true }
}>;

export async function getAllRecipes(userId: string): Promise<RecipeWithIngredients[]> {
    return prisma.recipe.findMany({
        where: { userId },
        include: { ingredients: true }
    });
}

export async function getRecipe(userId: string, id: number): Promise<RecipeWithIngredients> {
    return prisma.recipe.findUniqueOrThrow({
        where: { id, userId },
        include: { ingredients: true }
    });
}

export async function createRecipe(userId: string, data: any): Promise<RecipeWithIngredients> {

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
            ingredients: []
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
        ingredients: newIngredients
    });
}

export async function createRecipeFromUrl(userId: string, url: string): Promise<RecipeWithIngredients> {
    const recipeData = await scrapeRecipe(url);

    const recipe = {
        userId,
        name: recipeData.name || 'Untitled Recipe',
        prepTime: recipeData.prepTime,
        cookTime: recipeData.cookTime,
        servings: recipeData.recipeYield ? Number(recipeData.recipeYield) : null,
        instructions: recipeData.instructions,
        ingredients: recipeData.ingredients
    };

    return createRecipe(userId, recipe);
}
