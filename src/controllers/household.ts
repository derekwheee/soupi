import { Request, Response } from 'express';
import * as houseHoldService from '../services/household';
import { householdController } from './helpers';
import { Household } from '@prisma/client';
import { getAuth } from '@clerk/express'

export async function joinHousehold(req: Request, res: Response) {
    const { userId } = getAuth(req);

    return await householdController(
        req,
        res,
        (household: Household) =>
            houseHoldService.joinHousehold(userId!, household.id, req.body.joinToken),
        { skipAccessCheck: true }
    );
}
