import { Router } from 'express';
import { getAllPantryItems } from '../controllers/pantry';

const router = Router();

router.get('/', getAllPantryItems)

export default router;