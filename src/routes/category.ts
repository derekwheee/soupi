import requireAuth from '../middleware/require-auth';
import { Router } from 'express';
import {
    getCategories,
    getCategory,
    upsertCategory,
    updateSortOrder,
} from '../controllers/category';

const router = Router();
const prefix = '/household/:householdId/pantry/:pantryId/category';

router.get(prefix, getCategories);
router.post(`${prefix}`, upsertCategory);
router.get(`${prefix}/:categoryId`, requireAuth(), getCategory);
router.post(`${prefix}/sort-order`, requireAuth(), updateSortOrder);

export default router;