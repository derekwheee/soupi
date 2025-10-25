import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import prisma from '../../prisma';

export interface RecipeJSON {
    name: string;
    description?: string;
    prepTime?: string;
    cookTime?: string;
    servings?: string;
    ingredients: string[];
    instructions: string[];
    explanation?: string;
}

export async function getRecipeSuggestions(
    pantryId: number,
    tags?: string,
    keywords?: string,
): Promise<RecipeJSON[] | null> {
    const pantryItems = await prisma.pantryItem.findMany({
        where: { pantryId, isInStock: true, deletedAt: null },
        orderBy: { id: 'asc' },
    });

    const textToParse = pantryItems.map((item) => item.name).join(', ');

    const prompt = `
            Given the following list of pantry items, suggest 5 recipes that can be made using these ingredients.
            Provide the recipe name, preparation time, cooking time, servings, a list of ingredients needed (including quantities and units), and step-by-step instructions.
            Include a short description of the recipe in the description field.
            If possible, also include an explanation of why this recipe was suggested based on the available pantry items.

            ${tags ? `Focus on recipes that are tagged with: ${tags}.` : ''}
            ${keywords ? `Heavily prioritize the following keywords: ${keywords}.` : ''}

            Pantry items:
            ${textToParse}
        `;

    const parsed = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
            recipes: z.array(
                z.object({
                    name: z.string(),
                    description: z.string().optional(),
                    prepTime: z.string().optional(),
                    cookTime: z.string().optional(),
                    servings: z.string().optional(),
                    ingredients: z.array(z.string()),
                    instructions: z.array(z.string()),
                    explanation: z.string().optional(),
                }),
            ),
        }),
        mode: 'json',
        prompt,
    });

    return parsed?.object.recipes || null;
}
