import { Router } from 'express';
import { getExpiringPantryItems, getRecipeSuggestions } from '../services/ai';

const router = Router();

router.get('/suggestions/:pantryId', async (req, res) => {
    const pantryId = parseInt(req.params.pantryId);
    const { tags, keywords }: { tags?: string; keywords?: string } = req.query;

    const suggestions = await getRecipeSuggestions(pantryId, tags, keywords);
    return res.json(suggestions);
});

router.get('/expiring-items/:pantryId', async (req, res) => {
    const pantryId = parseInt(req.params.pantryId);

    const items = await getExpiringPantryItems(pantryId);
    return res.json(items);
});

export default router;
