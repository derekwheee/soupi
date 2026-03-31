import { Router } from 'express';

import { handle, parseBody } from '../middleware/handle';
import requireAuth from '../middleware/require-auth';
import { withHousehold } from '../middleware/with-household';
import { UpdateSortOrderSchema, UpsertCategorySchema } from '../schemas';
import * as categoryService from '../services/category';

const router = Router();
const prefix = '/household/:householdId/pantry/:pantryId/category';

router.get(
    prefix,
    requireAuth(),
    withHousehold(),
    handle((req) => categoryService.getCategories(Number(req.params.pantryId))),
);

router.post(
    prefix,
    requireAuth(),
    withHousehold(),
    handle((req, res) => {
        const body = parseBody(res, UpsertCategorySchema, req.body);
        if (!body) return;
        return categoryService.upsertCategory(req.household.id, Number(req.params.pantryId), body);
    }),
);

router.get(
    `${prefix}/:categoryId`,
    requireAuth(),
    withHousehold(),
    handle((req) =>
        categoryService.getCategory(Number(req.params.pantryId), Number(req.params.categoryId)),
    ),
);

router.post(
    `${prefix}/sort-order`,
    requireAuth(),
    withHousehold(),
    handle((req, res) => {
        const body = parseBody(res, UpdateSortOrderSchema, req.body);
        if (!body) return;
        return categoryService.updateSortOrder(req.household.id, Number(req.params.pantryId), body);
    }),
);

export default router;
