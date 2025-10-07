import axios from "axios";
import * as cheerio from "cheerio";

export interface RecipeJSON {
    name: string | null;
    description: string | null;
    image: string | null;
    prepTime: string | null;
    cookTime: string | null;
    totalTime: string | null;
    recipeYield: string | null;
    ingredients: string[];
    instructions: string[];
}

function cleanInstructions(recipeInstructions: any): string[] {

    const instructions = Array.isArray(recipeInstructions)
        ? recipeInstructions.map((step: any) =>
            typeof step === "string" ? step : step.text
        )
        : []

    return instructions
        .map((step) =>
            step
                .replace(/\s*<[^>]*>\s*/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
        )
        .filter((step) => step.length > 0 && /\s/.test(step));
}

/**
 * Scrape a recipe webpage and return normalized JSON
 */
export async function scrapeRecipe(url: string): Promise<RecipeJSON> {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    let recipeData: any = null;

    // Look for JSON-LD schema.org recipe data
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const json = JSON.parse($(el).contents().text());
            const recipe = Array.isArray(json)
                ? json.find((j) => (Array.isArray(j["@type"]) ? j["@type"].includes("Recipe") : j["@type"] === "Recipe"))
                : json;

            if (recipe && (Array.isArray(recipe["@type"]) ? recipe["@type"].includes("Recipe") : recipe["@type"] === "Recipe")) {
                recipeData = recipe;
            }
        } catch (err) {
            console.log(`Error parsing JSON-LD from ${url}:`, err);
        }
    });

    if (!recipeData) {
        throw new Error("No recipe data found");
    }

    return {
        name: recipeData.name || null,
        description: recipeData.description || null,
        image: recipeData.image || null,
        prepTime: recipeData.prepTime || null,
        cookTime: recipeData.cookTime || null,
        totalTime: recipeData.totalTime || null,
        recipeYield: recipeData.recipeYield || null,
        ingredients: recipeData.recipeIngredient || [],
        instructions: cleanInstructions(recipeData.recipeInstructions),
    };
}
