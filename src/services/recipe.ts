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

    recipe.ingredients = recipe.ingredients.map((ingredient) => {
        const parsed = parsedIngredients.find((parsed: { sentence: string }) => parsed.sentence === ingredient.sentence);
        console.log(parsed);

        return {
            ...ingredient,
            size: parsed?.size?.text,
            amount: parsed?.amount[0]?.quantity,
            preparation: parsed?.preparation?.text,
            json: parsed
        };
    });

    return recipe;
}

export const recipeService = {
    getAllRecipes: async (): Promise<RecipeWithIngredients[]> =>
        prisma.recipe.findMany({ include: { ingredients: true } }),
    parseIngredients
};
