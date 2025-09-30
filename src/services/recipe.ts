import { Prisma } from '@prisma/client';
import prisma from '../../prisma';
import { spawnSync } from 'node:child_process';

type RecipeWithIngredients = Prisma.RecipeGetPayload<{
    include: { ingredients: true }
}>;

async function parseIngredients(recipeId: number): Promise<RecipeWithIngredients>;
async function parseIngredients(recipe: RecipeWithIngredients): Promise<RecipeWithIngredients>;
async function parseIngredients(arg: number | RecipeWithIngredients): Promise<RecipeWithIngredients> {
    const recipe: RecipeWithIngredients =
        typeof arg === 'number'
            ? await prisma.recipe.findUniqueOrThrow({
                where: { id: arg },
                include: { ingredients: true },
            })
            : arg;

    const ingredientSentences = recipe.ingredients.map(({ sentence }) => sentence);

    const python = process.env.NLP_PYTHON_PATH;
    const parser = process.env.NLP_PARSER_PATH;
    if (!python || !parser) throw new Error('NLP_PYTHON_PATH and NLP_PARSER_PATH are required');

    const result = spawnSync(python, [parser, '-j', JSON.stringify(ingredientSentences)], {
        stdio: ['inherit', 'pipe', 'inherit'],
        encoding: 'utf-8',
    });

    if (result.error) {
        console.error('Failed to execute:', result.error);
        throw new Error(result.error.message || String(result.error));
    }

    const parsedIngredients = JSON.parse(result.stdout);

    const ingredients = recipe.ingredients.map((ingredient) => {
        const parsed = parsedIngredients.find((parsed: { sentence: string }) => parsed.sentence === ingredient.sentence);
        console.log(parsed);

        return {
            ...ingredient,
            item: parsed?.name?.[0].text,
            size: parsed?.size?.text,
            amount: parsed?.amount[0]?.quantity,
            unit: parsed?.amount[0]?.unit,
            preparation: parsed?.preparation?.text,
            json: parsed
        };
    });

    const updates = ingredients.map(({ id, ...ingredient }) =>
        prisma.ingredient.update({
            where: { id },
            data: ingredient
        }));

    await Promise.all(updates);

    const updatedRecipe = await prisma.recipe.findUniqueOrThrow({
        where: { id: recipe.id },
        include: { ingredients: true },
    });

    return updatedRecipe;
}

export const recipeService = {
    getAllRecipes: async (): Promise<RecipeWithIngredients[]> =>
        prisma.recipe.findMany({
            include: {ingredients: true }
        }),
    getRecipe: async (id: number): Promise<RecipeWithIngredients> =>
        prisma.recipe.findUniqueOrThrow({
            where: { id },
            include: { ingredients: true }
        }),
    createRecipe: async (data: RecipeWithIngredients): Promise<RecipeWithIngredients> => {

        const { id, ingredients, ...recipe } = data;

        const newRecipe = await prisma.recipe.create({
            data: {
                name: recipe.name,
                prepTime: recipe.prepTime,
                cookTime: recipe.cookTime,
                servings: recipe.servings,
                instructions: JSON.stringify(recipe.instructions)
            }
        });

        const newIngredients = await prisma.ingredient.createManyAndReturn({
            data: [
                ...ingredients.map((i) => ({
                    recipeId: newRecipe.id,
                    sentence: i.sentence
                }))
            ]
        });

        return parseIngredients({
            ...newRecipe,
            ingredients: newIngredients
        });
    },
    parseIngredients
};
