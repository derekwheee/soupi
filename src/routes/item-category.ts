import { Router } from 'express';
import { getAllItemCategories, upsertItemCategory } from '../controllers/item-category';
import { requireAuth } from '@clerk/express';

const router = Router();

router.get('/:pantryId', requireAuth(), getAllItemCategories);
router.post('/', requireAuth(), upsertItemCategory);

export default router;