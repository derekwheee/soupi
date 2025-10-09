import { Router } from 'express';
import { getAllPantryItems, getPantryItem, upsertPantryItem } from '../controllers/pantry';
import { requireAuth } from '@clerk/express';

const router = Router();

router.get('/', requireAuth(), getAllPantryItems);
router.post('/', requireAuth(), upsertPantryItem);
router.get('/:id', requireAuth(), getPantryItem);

export default router;