import { Router } from 'express';

import { handle, parseBody } from '../middleware/handle';
import requireAuth from '../middleware/require-auth';
import { withHousehold } from '../middleware/with-household';
import { JoinHouseholdSchema } from '../schemas';
import * as householdService from '../services/household';

const router = Router();

router.post(
    '/household/:householdId/join',
    requireAuth(),
    withHousehold(true),
    handle((req, res) => {
        const body = parseBody(res, JoinHouseholdSchema, req.body);
        if (!body) return;
        return householdService.joinHousehold(req.userId, req.household.id, body.joinToken);
    }),
);

export default router;
