import { Router } from 'express';
import { getAllPantryItems, getPantryItem, upsertPantryItem } from '../controllers/pantry';

const router = Router();

router.get('/', getAllPantryItems);
router.post('/', upsertPantryItem);
router.get('/:id', getPantryItem);

export default router;