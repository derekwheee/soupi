import { Router, Request, Response } from 'express';
import {
    createRecipe,
    createRecipeFromUrl,
    getAllRecipes,
    getRecipe,
    updateRecipe,
    deleteRecipe
} from '../controllers/recipe';
import { scrapeRecipe, RecipeJSON } from '../services/scraper';
import { requireAuth } from '@clerk/express'

const router = Router();
const prefix = '/household/:householdId/recipes';

router.get(prefix, requireAuth(), getAllRecipes);
router.post(prefix, requireAuth(), createRecipe);
router.post(`${prefix}/from-url`, requireAuth(), createRecipeFromUrl);

router.get(`${prefix}/scrape`, requireAuth(), async (req: Request, res: Response) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== "string") {
            return res.status(400).json({ error: "Missing url param" });
        }

        const recipe: RecipeJSON = await scrapeRecipe(url);
        res.json(recipe);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to scrape recipe" });
    }
});

router.get(`${prefix}/:id`, requireAuth(), getRecipe);
router.post(`${prefix}/:id`, requireAuth(), updateRecipe);
router.delete(`${prefix}/:id`, requireAuth(), deleteRecipe);

export default router;