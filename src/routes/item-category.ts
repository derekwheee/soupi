import { Router } from 'express';
import { getAllItemCategories, upsertItemCategory } from '../controllers/item-category';

const router = Router();

router.get('/', getAllItemCategories);
router.post('/', upsertItemCategory);

export default router;