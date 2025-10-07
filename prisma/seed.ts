import { PrismaClient, Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import { parseIngredients } from '../src/services/ingredient';
import { createRecipeFromUrl } from '../src/services/recipe';

const prisma = new PrismaClient().$extends(withAccelerate());

const categories: Prisma.ItemCategoryCreateInput[] = [
    { name: 'Produce', sortOrder: 0, icon: '🍎' },
    { name: 'Bakery', sortOrder: 1, icon: '🍞' },
    { name: 'Deli', sortOrder: 2, icon: '🧀' },
    { name: 'Meat & Seafood', sortOrder: 3, icon: '🍖' },
    { name: 'Grocery', sortOrder: 4, icon: '🥫' },
    { name: 'Beverages', sortOrder: 5, icon: '🧃' },
    { name: 'Dairy', sortOrder: 6, icon: '🥛' },
    { name: 'Frozen', sortOrder: 7, icon: '🍦' },
    { name: 'Household', sortOrder: 8, icon: '🧴', isNonFood: true },
    { name: 'Personal Care', sortOrder: 9, icon: '🪥', isNonFood: true },
    { name: 'Other', sortOrder: 10, icon: '🛒' }
];

const recipeUrls: string[] = [
    'https://www.allrecipes.com/recipe/16248/easy-homemade-chili/',
    'https://www.allrecipes.com/recipe/214561/beans-beans-and-beans/',
];

const recipeData: Prisma.RecipeCreateInput[] = [
    {
        name: 'Pancakes',
        cookTime: '15 mins',
        prepTime: '20 mins',
        servings: 4,
        ingredients: {
            create: [
                {
                    sentence: '2 cups all-purpose flour'
                },
                {
                    sentence: '1 1/2 cups milk'
                },
                {
                    sentence: '2 teaspoons baking powder'
                },
                {
                    sentence: '1/2 teaspoon salt'
                },
                {
                    sentence: '1 tablespoon baking soda'
                },
                {
                    sentence: '1/4 cup melted butter'
                },
                {
                    sentence: '2 tablespoons sugar'
                },
                {
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
        name: 'Avocado Toast',
        cookTime: '5 mins',
        prepTime: '10 mins',
        servings: 2,
        ingredients: {
            create: [
                {
                    sentence: '2 slices whole grain bread'
                },
                {
                    sentence: '1 ripe avocado'
                },
                {
                    sentence: '1 tablespoon olive oil'
                },
                {
                    sentence: '1 teaspoon lemon juice'
                },
                {
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
    { name: 'all-purpose flour', category: { connect: { name: 'Grocery' } } },
    { name: 'sugar', category: { connect: { name: 'Grocery' } } },
    { name: 'eggs', category: { connect: { name: 'Dairy' } } },
    { name: 'milk', category: { connect: { name: 'Dairy' } } },
    { name: 'whole grain bread', category: { connect: { name: 'Bakery' } } },
    { name: 'avocado', category: { connect: { name: 'Produce' } } },
    { name: 'olive oil', category: { connect: { name: 'Grocery' } } },
    { name: 'lemon juice', category: { connect: { name: 'Grocery' } } },
    { name: 'salt', category: { connect: { name: 'Grocery' } } },
    { name: 'pepper', category: { connect: { name: 'Grocery' } } },
    { name: 'baking powder', isInStock: false, isInShoppingList: true, category: { connect: { name: 'Grocery' } } },
    { name: 'baking soda', isInStock: false, isInShoppingList: true, category: { connect: { name: 'Grocery' } } },
    { name: 'butter', isInStock: false, isInShoppingList: true, category: { connect: { name: 'Dairy' } } }
];

async function main() {
    console.log(`Start seeding ...`);

    // Seed categories
    for (const c of categories) {
        const existingCategory = await prisma.itemCategory.findFirst({
            where: { name: c.name },
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
            where: { name: u.name },
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
            await createRecipeFromUrl(url);
            console.log(`Created recipe from URL: ${url}`);
        } catch (error) {
            console.error(`Failed to create recipe from URL ${url}:`, error);
        }
    }

    // Seed pantry items
    for (const u of pantryItemData) {
        const existingPantryItem = await prisma.pantryItem.findFirst({
            where: { name: u.name },
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
