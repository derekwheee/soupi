import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import puppeteer, { Page } from 'puppeteer';
import { z } from 'zod';

export interface RecipeJSON {
    cookTime: null | string;
    ingredients: string[];
    instructions: string[];
    name: null | string;
    prepTime: null | string;
    servings: null | string;
    source: null | string;
}

export async function scrapeRecipe(
    url: string,
    { isRetry }: { isRetry?: boolean } = {},
): Promise<null | RecipeJSON> {
    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-extensions',
            '--disable-gpu',
        ],
        headless: true,
    });
    const page = await browser.newPage();

    let textToParse;

    const useMetaUrls = ['tiktok.com', 'instagram.com'];

    if (useMetaUrls.some((metaUrl) => url.toLowerCase().includes(metaUrl))) {
        textToParse = await getRecipeFromMeta(page, url);
    } else {
        textToParse = await parseWebsiteRecipe(page, url);
    }

    await browser.close();

    if (!textToParse) {
        return null;
    }

    const parsed = await generateObject({
        model: openai('gpt-4o-mini'),
        prompt: `
            Parse the following text into a recipe and format it as JSON.
            Never under any circumstances should you hallucinate recipe details.
            Only include what you can confidently parse from the text.
            If you cannot find a field, simply omit it from the output.
            If you find a link to a recipe, return it in the externalLink field.
            If you're not confident about any field, omit it.
            The text may be plain text, or a string of JSON-LD from a webpage.
            The text may contain extraneous information, so only include relevant recipe details.
            In the explanation field, briefly explain how you parsed the recipe.
            
            Text to parse:
            ${textToParse.toString()}
        `,
        schema: z.object({
            cookTime: z.string().optional(),
            explanation: z.string().optional(),
            externalLink: z.string().optional(),
            ingredients: z.array(z.string()),
            instructions: z.array(z.string()),
            name: z.string(),
            prepTime: z.string().optional(),
            servings: z.string().optional(),
        }),
    });

    const recipe = parsed?.object;

    if (
        !recipe?.ingredients?.length &&
        parsed?.object?.externalLink &&
        !isRetry
    ) {
        return scrapeRecipe(parsed.object.externalLink, { isRetry: true });
    }

    return recipe
        ? {
              cookTime: parseTimes(recipe.cookTime) || null,
              ingredients: recipe.ingredients || [],
              instructions: cleanInstructions(recipe.instructions) || [],
              name: recipe.name,
              prepTime: parseTimes(recipe.prepTime) || null,
              servings: recipe.servings || null,
              source: url,
          }
        : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanInstructions(recipeInstructions: any): string[] {
    const instructions = Array.isArray(recipeInstructions)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

async function getRecipeFromMeta(page: Page, url: string) {
    await page.goto(url, {
        timeout: 10000,
        waitUntil: 'networkidle2',
    });

    const metaTags = await page.evaluate(() => {
        const metaElements = Array.from(document.head.querySelectorAll('meta'));
        return metaElements.map((meta: HTMLMetaElement) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const attributes: any = {};
            for (const attr of Array.from(meta.attributes)) {
                attributes[attr.name] = attr.value;
            }
            return attributes;
        });
    });

    return metaTags?.find((tag) => tag.property === 'og:description')?.content;
}

function parseTimes(
    time?: null | string | undefined,
): null | string | undefined {
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

async function parseWebsiteRecipe(page: Page, url: string) {
    // Lots of websites are continuously loading content (thanks ads), so don't wait for networkidle
    // But youtube content isn't fully loaded when DOMContentLoaded fires
    const waitUntil = url.includes('youtube.com')
        ? 'networkidle2'
        : 'domcontentloaded';

    await page.goto(url, {
        timeout: 10000,
        waitUntil,
    });

    return await page.evaluate(() => {
        const matchWords = ['recipe', 'ingredients'];

        return Array.from(
            document.querySelectorAll<HTMLElement>(
                'script[type="application/ld+json"]',
            ),
        )
            .map((el) => el.innerText)
            .filter((text) =>
                matchWords.some((word) => text.toLowerCase().includes(word)),
            )
            .join(',');
    });
}
