import { openai } from '@ai-sdk/openai';
import { PantryItem } from '@prisma/client';
import { generateObject } from 'ai';
import { z } from 'zod';

import prisma from '../../prisma';
import { FoodExpirationData } from '../../utils/ai';
import { EXPIRATION_WINDOW_DAYS } from '../../utils/constants';

export interface RecipeJSON {
    cookTime?: string;
    description?: string;
    explanation?: string;
    ingredients: string[];
    instructions: string[];
    name: string;
    prepTime?: string;
    servings?: string;
}

export async function getExpiringPantryItems(
    pantryId: number,
): Promise<PantryItem[]> {
    const itemsToUpdate = await prisma.pantryItem.findMany({
        where: {
            deletedAt: null,
            expiresAt: null,
            isInStock: true,
            pantryId,
            purchasedAt: { not: null },
        },
    });

    if (itemsToUpdate.length) {
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
            itemsToUpdate.map((item) => ({
                id: item.id,
                name: item.name,
                purchasedAt: item.purchasedAt,
            })),
            null,
            2,
        )}
    `;

        const parsed = await generateObject({
            mode: 'json',
            model: openai('gpt-4o-mini'),
            prompt,
            schema: z.object({
                pantryItems: z.array(
                    z.object({
                        expiresAt: z.string(),
                        id: z.number(),
                        name: z.string(),
                        purchasedAt: z.string(),
                    }),
                ),
            }),
        });

        if (!parsed) {
            return [];
        }

        const expiring = parsed.object.pantryItems;

        for (const item of expiring) {
            await prisma.pantryItem.update({
                data: { expiresAt: new Date(item.expiresAt) },
                where: { id: item.id },
            });
        }
    }

    const today = new Date();

    return prisma.pantryItem.findMany({
        where: {
            deletedAt: null,
            expiresAt: {
                lte: new Date(
                    today.getTime() + EXPIRATION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
                ),
            },
            isInStock: true,
            pantryId,
        },
    });
}

export async function getRecipeSuggestions(
    pantryId: number,
    tags?: string,
    keywords?: string,
): Promise<null | RecipeJSON[]> {
    const pantryItems = await prisma.pantryItem.findMany({
        orderBy: { id: 'asc' },
        where: { deletedAt: null, isInStock: true, pantryId },
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
        mode: 'json',
        model: openai('gpt-4o-mini'),
        prompt,
        schema: z.object({
            recipes: z.array(
                z.object({
                    cookTime: z.string().optional(),
                    description: z.string().optional(),
                    explanation: z.string().optional(),
                    ingredients: z.array(z.string()),
                    instructions: z.array(z.string()),
                    name: z.string(),
                    prepTime: z.string().optional(),
                    servings: z.string().optional(),
                }),
            ),
        }),
    });

    return parsed?.object.recipes || null;
}
