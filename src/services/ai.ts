import { PantryItem } from '@prisma/client';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import prisma from '../../prisma';
import { daysBetween } from '../../utils/dates';
import { FoodExpirationData } from '../../utils/ai';
import { EXPIRATION_WINDOW } from '../../utils/constants';

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

export async function getExpiringPantryItems(
    pantryId: number,
): Promise<PantryItem[]> {
    const items = await prisma.pantryItem.findMany({
        where: {
            pantryId,
            isInStock: true,
            purchasedAt: { not: null },
            deletedAt: null,
        },
    });

    const prompt = `
        Given the following list of pantry items with their purchased dates,
        provide updated expiration dates for each item based on typical shelf life.
        Use the item name and purchased date to determine an appropriate expiration date.
        Use a slightly conservative approach to avoid spoilage.
        Return the results in JSON format with the item id, the item name,
        the original purchased date,
        and the calculated expiration date in ISO 8601 format.

        Use the following cold storage data to estimate expiration dates for items in the user's pantry.
        If no direct match is found, choose a similar category.

        Food Safety Reference Data (in days):
        ${JSON.stringify(FoodExpirationData, null, 2)}
        
        Pantry items:
        ${JSON.stringify(
            items.map((item) => ({
                id: item.id,
                name: item.name,
                purchasedAt: item.purchasedAt,
            })),
            null,
            2,
        )}
    `;

    const parsed = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
            pantryItems: z.array(
                z.object({
                    id: z.number(),
                    name: z.string(),
                    purchasedAt: z.string(),
                    expiresAt: z.string(),
                }),
            ),
        }),
        mode: 'json',
        prompt,
    });

    if (!parsed) {
        return [];
    }

    const today = new Date();

    return parsed.object.pantryItems
        .filter((item) => Math.abs(daysBetween(new Date(item.expiresAt), today)) < EXPIRATION_WINDOW)
        .map((item) => items.find((i) => i.id === item.id))
        .filter((item): item is PantryItem => item !== undefined);
}
