import requireAuth from '../middleware/require-auth';
import { Router } from 'express';
import {
    getPantries,
    getAllPantryItems,
    getPantryItem,
    upsertPantryItem,
} from '../controllers/pantry';

const router = Router();
const prefix = '/household/:householdId/pantry';

router.get(prefix, getPantries);
router.post(`${prefix}/:pantryId`, upsertPantryItem);
router.get(`${prefix}/:pantryId/items`, requireAuth(), getAllPantryItems);
router.get(`${prefix}/:pantryId/items/:itemId`, requireAuth(), getPantryItem);

export default router;