import { Router } from 'express';

import {
    getAllPantryItems,
    getPantries,
    getPantryItem,
    upsertPantryItem,
} from '../controllers/pantry';
import requireAuth from '../middleware/require-auth';

const router = Router();
const prefix = '/household/:householdId/pantry';

router.get(prefix, requireAuth(), getPantries);
router.post(`${prefix}/:pantryId`, requireAuth(), upsertPantryItem);
router.get(`${prefix}/:pantryId/items`, requireAuth(), getAllPantryItems);
router.get(`${prefix}/:pantryId/items/:itemId`, requireAuth(), getPantryItem);

export default router;