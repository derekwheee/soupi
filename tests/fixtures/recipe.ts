import type { Recipe, Ingredient, RecipeTag } from '@prisma/client';

export const mockIngredient: Ingredient = {
    id: 1,
    sentence: '2 cups flour',
    item: 'flour',
    size: null,
    amount: null,
    unit: 'cups',
    preparation: null,
    json: null,
    recipeId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

export const mockTag: RecipeTag = {
    id: 1,
    name: 'vegetarian',
    householdId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
};

export const mockRecipe: Recipe & { ingredients: Ingredient[]; tags: RecipeTag[] } = {
    id: 1,
    name: 'Test Recipe',
    prepTime: '10 mins',
    cookTime: '30 mins',
    servings: '4',
    instructions: ['Step 1', 'Step 2'],
    source: null,
    rating: 0,
    timesMade: 0,
    lastMade: null,
    householdId: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ingredients: [mockIngredient],
    tags: [mockTag],
};

export const mockRecipe2: typeof mockRecipe = {
    ...mockRecipe,
    id: 2,
    name: 'Second Recipe',
};
