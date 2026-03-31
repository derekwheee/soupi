import { Prisma } from '@prisma/client';
import { spawnSync } from 'node:child_process';

import prisma from '../../prisma';
import logger from '../../utils/logger';

type RecipeWithJoins = Prisma.RecipeGetPayload<{
    include: { ingredients: true, tags: true }
}>;

export async function parseIngredients(recipeId: number, isRetry?: boolean): Promise<RecipeWithJoins>;
export async function parseIngredients(recipe: RecipeWithJoins, isRetry?: boolean): Promise<RecipeWithJoins>;
export async function parseIngredients(arg: number | RecipeWithJoins, isRetry?: boolean): Promise<RecipeWithJoins> {
    const recipe: RecipeWithJoins =
        typeof arg === 'number'
            ? await prisma.recipe.findUniqueOrThrow({
                include: { ingredients: true, tags: true },
                where: { id: arg },
            })
            : arg;

    const ingredientSentences = recipe.ingredients.map(({ sentence }) => sentence);

    const python = process.env.NLP_PYTHON_PATH || 'python';
    const parser = process.env.NLP_PARSER_PATH;
    if (!python || !parser) throw new Error('NLP_PYTHON_PATH and NLP_PARSER_PATH are required');

    const result = spawnSync(python, [parser, '-j', JSON.stringify(ingredientSentences)], {
        encoding: 'utf-8',
        stdio: ['inherit', 'pipe', 'pipe'],
        timeout: 30_000,
    });

    if (result.error) {
        logger.error({ err: result.error }, 'Failed to execute NLP parser');
        throw new Error(`NLP parser process error: ${result.error.message || String(result.error)}`);
    }

    if (result.status !== 0) {
        const stderr = result.stderr?.trim() || '(no stderr)';
        throw new Error(`NLP parser exited with code ${result.status}: ${stderr}`);
    }

    if (!result.stdout || result.stdout.trim() === '') {
        throw new Error('NLP parser produced no output');
    }

    if (result.stdout.startsWith('Downloading')) {
        // Retry once if the model is being downloaded
        if (isRetry) {
            throw new Error('NLP model is still downloading, please try again later');
        }

        return parseIngredients(recipe, true);
    }

    let parsedIngredients: Array<{ amount?: { quantity: string; unit: string }[]; name?: { text: string }[]; preparation?: { text: string }; sentence: string; size?: { text: string }; }>;
    try {
        parsedIngredients = JSON.parse(result.stdout);
    } catch {
        throw new Error(`NLP parser returned invalid JSON: ${result.stdout.slice(0, 200)}`);
    }

    if (!Array.isArray(parsedIngredients)) {
        throw new Error('NLP parser returned unexpected output format');
    }

    const ingredients = recipe.ingredients.map((ingredient) => {
        const parsed = parsedIngredients.find((parsed: { sentence: string }) => parsed.sentence === ingredient.sentence);

        return {
            ...ingredient,
            amount: parsed?.amount?.[0]?.quantity || null,
            item: parsed?.name?.[0].text,
            json: parsed,
            preparation: parsed?.preparation?.text,
            size: parsed?.size?.text,
            unit: parsed?.amount?.[0]?.unit
        };
    });

    const updates = ingredients.map(({ id, ...ingredient }) =>
        prisma.ingredient.update({
            data: ingredient,
            where: { id }
        }));

    await prisma.$transaction(updates);

    const updatedRecipe = await prisma.recipe.findUniqueOrThrow({
        include: { ingredients: true, tags: true },
        where: { id: recipe.id },
    });

    return updatedRecipe;
}