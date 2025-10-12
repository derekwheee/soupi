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
const prefix = '/household/:householdId/pantry';

router.get(prefix, getPantries);
router.post(prefix, upsertPantryItem);
router.get(`${prefix}/:pantryId/items`, requireAuth(), getAllPantryItems);
router.get(`${prefix}/:pantryId/items/:itemId`, requireAuth(), getPantryItem);
router.get(`${prefix}/:pantryId/categories`, requireAuth(), getPantryCategories);

export default router;