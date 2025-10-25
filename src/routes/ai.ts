import { Router } from 'express';
import { getRecipeSuggestions } from '../services/ai';

const router = Router();

router.get('/suggestions/:pantryId', async (req, res) => {
    const pantryId = parseInt(req.params.pantryId);
    const { tags, keywords }: { tags?: string; keywords?: string } = req.query;

    const suggestions = await getRecipeSuggestions(pantryId, tags, keywords);
    return res.json(suggestions);
});

export default router;
