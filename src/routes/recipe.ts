import { Router } from 'express';
import { listRecipes, parseIngredients } from '../controllers/recipe';

const router = Router();

// GET /recipes
router.get('/', listRecipes);
router.get('/parse', parseIngredients)

export default router;