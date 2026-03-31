import { Router } from 'express';

import {
    addPlanDay,
    addRecipesToPlanDay,
    getPlan,
    removePlanDay,
    removeRecipeFromPlanDay,
} from '../controllers/plan';
import requireAuth from '../middleware/require-auth';

const router = Router();
const prefix = '/household/:householdId/plan';

router.get(prefix, requireAuth(), getPlan);
router.post(`${prefix}/day`, requireAuth(), addPlanDay);
router.delete(`${prefix}/day/:planDayId`, requireAuth(), removePlanDay);
router.post(`${prefix}/day/:planDayId/recipes`, requireAuth(), addRecipesToPlanDay);
router.delete(`${prefix}/day/:planDayId/recipes/:recipeId`, requireAuth(), removeRecipeFromPlanDay);

export default router;
