import { Request, Response, Router } from 'express';

import logger from '../../utils/logger';
import {
    completeRecipe,
    createRecipeFromUrl,
    deleteRecipe,
    getAllRecipes,
    getAllRecipeTags,
    getRecipe,
    upsertRecipe,
} from '../controllers/recipe';
import requireAuth from '../middleware/require-auth';
import { RecipeJSON, scrapeRecipe } from '../services/scraper';

const router = Router();
const prefix = '/household/:householdId/recipes';

router.get(prefix, requireAuth(), getAllRecipes);
router.post(prefix, requireAuth(), upsertRecipe);
router.post(`${prefix}/from-url`, requireAuth(), createRecipeFromUrl);
router.get(`${prefix}/tags`, requireAuth(), getAllRecipeTags);

router.get(`${prefix}/scrape`, requireAuth(), async (req: Request, res: Response) => {
    try {
        const { url } = req.query;
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'Missing url param' });
        }

        const recipe: null | RecipeJSON = await scrapeRecipe(url);
        res.json(recipe);
    } catch (err) {
        logger.error({ err }, 'Failed to scrape recipe');
        res.status(500).json({ error: 'Failed to scrape recipe' });
    }
});

router.get(`${prefix}/:id`, requireAuth(), getRecipe);
router.delete(`${prefix}/:id`, requireAuth(), deleteRecipe);
router.post(`${prefix}/:id/made`, requireAuth(), completeRecipe);

export default router;
