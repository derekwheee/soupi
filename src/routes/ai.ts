import { Router } from 'express';

import { handle } from '../middleware/handle';
import requireAuth from '../middleware/require-auth';
import { getExpiringPantryItems, getRecipeSuggestions } from '../services/ai';

const router = Router();

router.get(
    '/suggestions/:pantryId',
    requireAuth(),
    handle((req) => {
        const pantryId = parseInt(req.params.pantryId);
        const { keywords, tags }: { keywords?: string; tags?: string } = req.query;
        return getRecipeSuggestions(pantryId, tags, keywords);
    }),
);

router.get(
    '/expiring-items/:pantryId',
    requireAuth(),
    handle((req) => {
        const pantryId = parseInt(req.params.pantryId);
        return getExpiringPantryItems(pantryId);
    }),
);

export default router;
