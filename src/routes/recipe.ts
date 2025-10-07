import { Router, Request, Response } from 'express';
import {
    createRecipe,
    createRecipeFromUrl,
    getAllRecipes,
    getRecipe,
} from '../controllers/recipe';
import { scrapeRecipe, RecipeJSON } from '../services/scraper';

const router = Router();

router.post('/', createRecipe)
router.post('/from-url', createRecipeFromUrl);
router.get('/', getAllRecipes);

router.get("/scrape", async (req: Request, res: Response) => {
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

router.get('/:id', getRecipe);

export default router;