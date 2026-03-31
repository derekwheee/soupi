import { z } from 'zod';

export const RecipeTagSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
});

export const UpsertRecipeSchema = z.object({
    id: z.number().int().positive().optional(),
    name: z.string().min(1).optional(),
    prepTime: z.string().nullable().optional(),
    cookTime: z.string().nullable().optional(),
    servings: z.string().nullable().optional(),
    instructions: z.array(z.string()).nullable().optional(),
    ingredients: z.array(z.string()).optional(),
    tags: z.array(RecipeTagSchema).optional(),
    source: z.string().url().nullable().optional(),
});

export const CompleteRecipeSchema = z.object({
    recipeId: z.number().int().positive(),
    rating: z.number().int().min(0).max(5).optional(),
    finishedPantryItems: z.array(z.number().int().positive()).optional(),
});

export const UpsertPantryItemSchema = z.object({
    id: z.number().int().positive().optional(),
    name: z.string().min(1),
    isInStock: z.boolean().optional(),
    isFavorite: z.boolean().optional(),
    isInShoppingList: z.boolean().optional(),
    purchasedAt: z.coerce.date().nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    categoryId: z.number().int().positive().nullable().optional(),
});

export const UpsertCategorySchema = z.object({
    id: z.number().int().positive().optional(),
    name: z.string().min(1),
    icon: z.string().nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isNonFood: z.boolean().optional(),
});

export const UpdateSortOrderSchema = z.array(z.number().int().positive());

export const AddPlanDaySchema = z.object({
    planId: z.number().int().positive(),
    date: z.coerce.date(),
});

export const AddRecipesToPlanDaySchema = z.array(z.number().int().positive());

export const UpdateUserSchema = z.object({
    themePreference: z.enum(['system', 'light', 'dark']).optional(),
});

export const JoinHouseholdSchema = z.object({
    joinToken: z.string().uuid(),
});
