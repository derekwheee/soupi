import requireAuth from '../middleware/require-auth';
import { Router } from 'express';
import {
    getPlan,
    addPlanDay,
    removePlanDay,
    addRecipeToPlanDay,
    removeRecipeFromPlanDay,
} from '../controllers/plan';

const router = Router();
const prefix = '/household/:householdId/plan';

router.get(prefix, getPlan);
router.post(`${prefix}/day`, addPlanDay);
router.delete(`${prefix}/day/:planDayId`, requireAuth(), removePlanDay);
router.post(`${prefix}/day/:planDayId/recipe`, addRecipeToPlanDay);
router.delete(`${prefix}/day/:planDayId/recipe/:recipeId`, requireAuth(), removeRecipeFromPlanDay);

export default router;