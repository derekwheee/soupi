import { Router } from 'express';

import { handle } from '../middleware/handle';
import requireAuth from '../middleware/require-auth';
import { withHousehold } from '../middleware/with-household';
import * as shoppingListService from '../services/shopping-list';

const router = Router();
const prefix = '/household/:householdId/pantry/:pantryId/shopping-list';

router.get(
    prefix,
    requireAuth(),
    withHousehold(),
    handle((req) => shoppingListService.getListByCategory(Number(req.params.pantryId))),
);

export default router;
