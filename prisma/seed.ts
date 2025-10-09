import { PrismaClient, Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { parseIngredients } from '../src/services/ingredient';
import { createRecipeFromUrl } from '../src/services/recipe';

const userId: string | undefined = process.env.SEED_USER_ID;

if (!userId) {
    throw new Error("Please set the SEED_USER_ID environment variable to your Clerk user ID.");
}

const prisma = new PrismaClient().$extends(withAccelerate());

const categories: Prisma.ItemCategoryUncheckedCreateInput[] = [
    { userId, name: 'Produce', sortOrder: 0, icon: '🍎' },
    { userId, name: 'Bakery', sortOrder: 1, icon: '🍞' },
    { userId, name: 'Deli', sortOrder: 2, icon: '🧀' },
    { userId, name: 'Meat & Seafood', sortOrder: 3, icon: '🍖' },
    { userId, name: 'Grocery', sortOrder: 4, icon: '🥫' },
    { userId, name: 'Beverages', sortOrder: 5, icon: '🧃' },
    { userId, name: 'Dairy', sortOrder: 6, icon: '🥛' },
    { userId, name: 'Frozen', sortOrder: 7, icon: '🍦' },
    { userId, name: 'Household', sortOrder: 8, icon: '🧴', isNonFood: true },
    { userId, name: 'Personal Care', sortOrder: 9, icon: '🪥', isNonFood: true },
    { userId, name: 'Other', sortOrder: 10, icon: '🛒' }
];

const recipeUrls: string[] = [
    'https://www.allrecipes.com/recipe/16248/easy-homemade-chili/',
    'https://www.allrecipes.com/recipe/214561/beans-beans-and-beans/',
];

const recipeData: Prisma.RecipeUncheckedCreateInput[] = [
    {
        userId,
        name: 'Pancakes',
        cookTime: '15 mins',
        prepTime: '20 mins',
        servings: 4,
        ingredients: {
            create: [
                {
                    userId,
                    sentence: '2 cups all-purpose flour'
                },
                {
                    userId,
                    sentence: '1 1/2 cups milk'
                },
                {
                    userId,
                    sentence: '2 teaspoons baking powder'
                },
                {
                    userId,
                    sentence: '1/2 teaspoon salt'
                },
                {
                    userId,
                    sentence: '1 tablespoon baking soda'
                },
                {
                    userId,
                    sentence: '1/4 cup melted butter'
                },
                {
                    userId,
                    sentence: '2 tablespoons sugar'
                },
                {
                    userId,
                    sentence: '2 large eggs'
                },
            ]
        },
        instructions: [
            "In a large bowl, whisk together the flour, sugar, baking powder, baking soda, and salt.",
            "In another bowl, beat the eggs and then whisk in the milk and melted butter.",
            "Pour the wet ingredients into the dry ingredients and stir until just combined. Be careful not to overmix; a few lumps are okay.",
            "Heat a non-stick skillet or griddle over medium heat. Lightly grease with butter or oil.",
            "Pour 1/4 cup of batter for each pancake onto the skillet. Cook until bubbles form on the surface and the edges look set, about 2-3 minutes.",
            "Flip the pancakes and cook for another 1-2 minutes, until golden brown and cooked through.",
            "Serve warm with your favorite toppings such as maple syrup, fresh fruit, or whipped cream."
        ]
    },
    {
        userId,
        name: 'Avocado Toast',
        cookTime: '5 mins',
        prepTime: '10 mins',
        servings: 2,
        ingredients: {
            create: [
                {
                    userId,
                    sentence: '2 slices whole grain bread'
                },
                {
                    userId,
                    sentence: '1 ripe avocado'
                },
                {
                    userId,
                    sentence: '1 tablespoon olive oil'
                },
                {
                    userId,
                    sentence: '1 teaspoon lemon juice'
                },
                {
                    userId,
                    sentence: 'Salt and pepper to taste'
                },
            ]
        },
        instructions: [
            "Toast the bread slices until golden brown.",
            "Cut the avocado in half, remove the pit, and scoop the flesh into a bowl.",
            "Mash the avocado with a fork until smooth. Add olive oil, lemon juice, salt, and pepper. Mix well.",
            "Spread the mashed avocado evenly over the toasted bread slices.",
            "Serve immediately and enjoy!"
        ]
    }
];

const pantryItemData: Prisma.PantryItemCreateInput[] = [
    { name: 'all-purpose flour', category: { connect: { name: 'Grocery' } }, user: { connect: { id: userId }} },
    { name: 'sugar', category: { connect: { name: 'Grocery' } }, user: { connect: { id: userId }} },
    { name: 'eggs', category: { connect: { name: 'Dairy' } }, user: { connect: { id: userId }} },
    { name: 'milk', category: { connect: { name: 'Dairy' } }, user: { connect: { id: userId }} },
    { name: 'whole grain bread', category: { connect: { name: 'Bakery' } }, user: { connect: { id: userId }} },
    { name: 'avocado', category: { connect: { name: 'Produce' } }, user: { connect: { id: userId }} },
    { name: 'olive oil', category: { connect: { name: 'Grocery' } }, user: { connect: { id: userId }} },
    { name: 'lemon juice', category: { connect: { name: 'Grocery' } }, user: { connect: { id: userId }} },
    { name: 'salt', category: { connect: { name: 'Grocery' } }, user: { connect: { id: userId }} },
    { name: 'pepper', category: { connect: { name: 'Grocery' } }, user: { connect: { id: userId }} },
    { name: 'baking powder', isInStock: false, isInShoppingList: true, category: { connect: { name: 'Grocery' } }, user: { connect: { id: userId }} },
    { name: 'baking soda', isInStock: false, isInShoppingList: true, category: { connect: { name: 'Grocery' } }, user: { connect: { id: userId }} },
    { name: 'butter', isInStock: false, isInShoppingList: true, category: { connect: { name: 'Dairy' } }, user: { connect: { id: userId }} }
];

async function main() {
    console.log(`Start seeding ...`);

    // Seed categories
    for (const c of categories) {
        const existingCategory = await prisma.itemCategory.findFirst({
            where: { name: c.name, userId },
        });

        if (existingCategory) {
            console.log(`Category with name ${c.name} already exists`)
            continue
        }

        const category = await prisma.itemCategory.create({
            data: c,
        });
        console.log(`Created category with id: ${category.id}`)
    }

    // Seed recipes
    for (const u of recipeData) {
        const existingRecipe = await prisma.recipe.findFirst({
            where: { name: u.name, userId },
        });

        if (existingRecipe) {
            console.log(`Recipe with name ${u.name} already exists`)
            continue
        }

        const recipe = await prisma.recipe.create({
            data: u,
        });

        // Parse and update ingredients with NLP
        await parseIngredients(recipe.id);

        console.log(`Created recipe with id: ${recipe.id}`)
    }

    // Seed recipes from URLs
    for (const url of recipeUrls) {
        try {
            await createRecipeFromUrl(userId!, url);
            console.log(`Created recipe from URL: ${url}`);
        } catch (error) {
            console.error(`Failed to create recipe from URL ${url}:`, error);
        }
    }

    // Seed pantry items
    for (const u of pantryItemData) {
        const existingPantryItem = await prisma.pantryItem.findFirst({
            where: { name: u.name, userId },
        });

        if (existingPantryItem) {
            console.log(`Pantry item with name ${u.name} already exists`)
            continue
        }

        const pantryItem = await prisma.pantryItem.create({
            data: u,
        })
        console.log(`Created pantry item with id: ${pantryItem.id}`)
    }

    console.log(`Seeding finished.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
