import { Router } from 'express';

import requireAuth from '../middleware/require-auth';
import { getExpiringPantryItems, getRecipeSuggestions } from '../services/ai';

const router = Router();

router.get('/suggestions/:pantryId', requireAuth(), async (req, res) => {
    const pantryId = parseInt(req.params.pantryId);
    const { keywords, tags }: { keywords?: string; tags?: string } = req.query;

    const suggestions = await getRecipeSuggestions(pantryId, tags, keywords);
    return res.json(suggestions);
});

router.get('/expiring-items/:pantryId', requireAuth(), async (req, res) => {
    const pantryId = parseInt(req.params.pantryId);

    const items = await getExpiringPantryItems(pantryId);
    return res.json(items);
});

export default router;
