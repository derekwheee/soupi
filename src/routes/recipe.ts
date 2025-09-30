import { Router } from 'express';
import { createRecipe, getAllRecipes, getRecipe, parseIngredients } from '../controllers/recipe';

const router = Router();

router.post('/', createRecipe)
router.get('/', getAllRecipes);
router.get('/:id', getRecipe);
router.get('/parse/:id', parseIngredients)

export default router;