import { PrismaClient, Prisma } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

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
                    sentence: '2 tablespoons sugar'
                },
                {
                    sentence: '2 large eggs'
                },
            ]
        }
    }
];

async function main() {
    console.log(`Start seeding ...`)
    for (const u of recipeData) {
        const recipe = await prisma.recipe.create({
            data: u,
        })
        console.log(`Created recipe with id: ${recipe.id}`)
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
