import { Router } from 'express';

import {
    getCategories,
    getCategory,
    updateSortOrder,
    upsertCategory,
} from '../controllers/category';
import requireAuth from '../middleware/require-auth';

const router = Router();
const prefix = '/household/:householdId/pantry/:pantryId/category';

router.get(prefix, requireAuth(), getCategories);
router.post(`${prefix}`, requireAuth(), upsertCategory);
router.get(`${prefix}/:categoryId`, requireAuth(), getCategory);
router.post(`${prefix}/sort-order`, requireAuth(), updateSortOrder);

export default router;