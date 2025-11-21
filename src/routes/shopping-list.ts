import requireAuth from '../middleware/require-auth';
import { Router } from 'express';
import {
    getListByCategory,
} from '../controllers/shopping-list';

const router = Router();
const prefix = '/household/:householdId/pantry/:pantryId/shopping-list';

router.get(prefix, requireAuth(), getListByCategory);

export default router;