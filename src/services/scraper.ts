import puppeteer, { Page } from 'puppeteer';
import { mistral } from '@ai-sdk/mistral';
import { generateObject } from 'ai';
import { z } from 'zod';

export interface RecipeJSON {
    name: string | null;
    prepTime: string | null;
    cookTime: string | null;
    servings: number | null;
    ingredients: string[];
    instructions: string[];
}

function cleanInstructions(recipeInstructions: any): string[] {
    const instructions = Array.isArray(recipeInstructions)
        ? recipeInstructions.map((step: any) =>
              typeof step === 'string' ? step : step.text,
          )
        : [];

    return instructions
        .map((step) =>
            step
                .replace(/\s*<[^>]*>\s*/g, ' ')
                .replace(/\s+/g, ' ')
                .trim(),
        )
        .filter((step) => step.length > 0 && /\s/.test(step));
}

export async function scrapeRecipe(url: string): Promise<RecipeJSON | null> {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-gpu',
        ],
    });
    const page = await browser.newPage();

    let textToParse;

    if (url.toLowerCase().includes('tiktok.com')) {
        textToParse = await getTikTokRecipe(page, url);
    } else {
        textToParse = await parseWebsiteRecipe(page, url);
    }

    if (!textToParse) {
        console.error('No text to parse found.');
        await browser.close();
        return null;
    }

    const parsed = await generateObject({
        model: mistral('mistral-large-latest'),
        schema: z.object({
            name: z.string(),
            prepTime: z.string().optional(),
            cookTime: z.string().optional(),
            servings: z.number().min(1).optional(),
            ingredients: z.array(z.string()),
            instructions: z.array(z.string()),
        }),
        prompt: `
            Parse the following text into a recipe and format it as JSON.
            If you're not confident about any field, omit it.
            The text may be plain text, or a string of JSON-LD from a webpage.
            The text may contain extraneous information, so only include relevant recipe details.
            ${textToParse}
        `,
    });

    const recipe = parsed?.object;
    await browser.close();

    return recipe
        ? {
              name: recipe.name,
              prepTime: parseTimes(recipe.prepTime) || null,
              cookTime: parseTimes(recipe.cookTime) || null,
              servings: recipe.servings || null,
              ingredients: recipe.ingredients || [],
              instructions: cleanInstructions(recipe.instructions) || [],
          }
        : null;
}

async function parseWebsiteRecipe(page: Page, url: string) {
    await page.goto(url, {
        waitUntil: 'domcontentloaded',
    });

    const ldJsonElement = await page.$('script[type="application/ld+json"]');
    return ldJsonElement
        ? await ldJsonElement.evaluate((el: HTMLScriptElement) => el.innerText)
        : null;
}

async function getTikTokRecipe(page: Page, url: string) {
    await page.goto(url, {
        waitUntil: 'networkidle2',
    });

    const metaTags = await page.evaluate(() => {
        const metaElements = Array.from(document.head.querySelectorAll('meta'));
        return metaElements.map((meta: any) => {
            const attributes: any = {};
            for (const attr of meta.attributes) {
                attributes[attr.name] = attr.value;
            }
            return attributes;
        });
    });

    return metaTags?.find((tag) => tag.property === 'og:description')?.content;
}

function parseTimes(
    time?: string | null | undefined,
): string | null | undefined {
    if (!time) return time;

    if (time.match(/PT\d+\w+/)) {
        const [, minutes, flag] = /(\d+)(\w+)/.exec(time) || [];
        let parsed = '';

        if (flag === 'M') {
            const mins = Number(minutes);
            const hours = Math.floor(mins / 60);
            const remMinutes = mins % 60;

            if (hours > 0) {
                parsed += `${hours} hour${hours > 1 ? 's ' : ' '}`;
            }
            if (remMinutes > 0) {
                parsed += `${remMinutes} min${remMinutes > 1 ? 's' : ''}`;
            }

            return parsed.trim();
        }
    }

    return time;
}
