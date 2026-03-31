import { getAuth } from '@clerk/express';
import { Household } from '@prisma/client';
import { Request, Response } from 'express';

import { JoinHouseholdSchema } from '../schemas';
import * as houseHoldService from '../services/household';
import { householdController, parseBody } from './helpers';

export async function joinHousehold(req: Request, res: Response) {
    const { userId } = getAuth(req);

    const body = parseBody(res, JoinHouseholdSchema, req.body);
    if (!body) return;

    return await householdController(
        req,
        res,
        (household: Household) =>
            houseHoldService.joinHousehold(userId!, household.id, body.joinToken),
        { skipAccessCheck: true },
    );
}
