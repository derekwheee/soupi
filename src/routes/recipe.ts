import { Router, Request, Response } from 'express';
import {
    createRecipe,
    createRecipeFromUrl,
    getAllRecipes,
    getRecipe,
} from '../controllers/recipe';
import { scrapeRecipe, RecipeJSON } from '../services/scraper';
import { requireAuth } from '@clerk/express'

const router = Router();


router.get('/', requireAuth(), getAllRecipes);
router.post('/', requireAuth(), createRecipe);
router.post('/from-url', requireAuth(), createRecipeFromUrl);

router.get("/scrape", requireAuth(), async (req: Request, res: Response) => {
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

router.get('/:id', requireAuth(), getRecipe);

export default router;