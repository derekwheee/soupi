import { requireAuth } from '@clerk/express';
import { Router } from 'express';
import {
    getPantries,
    getAllPantryItems,
    getPantryItem,
    upsertPantryItem,
    getPantryCategories
} from '../controllers/pantry';

const router = Router();

router.get('/', requireAuth(), getPantries);
router.post('/', requireAuth(), upsertPantryItem);
router.get('/:pantryId/items', requireAuth(), getAllPantryItems);
router.get('/:pantryId/items/:itemId', requireAuth(), getPantryItem);
router.get('/:pantryId/categories', requireAuth(), getPantryCategories);

export default router;