import { getAuth } from '@clerk/express';
import { NextFunction, Request, Response } from 'express';

import prisma from '../../prisma';

export function withHousehold(skipAccessCheck = false) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const householdId = Number(req.params.householdId);

        if (isNaN(householdId)) {
            res.status(400).json({ error: 'Invalid householdId parameter' });
            return;
        }

        const { userId } = getAuth(req);

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const household = await prisma.household.findFirst({
            where: {
                id: householdId,
                ...(skipAccessCheck ? {} : { members: { some: { id: userId } } }),
            },
        });

        if (!household) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        req.household = household;
        req.userId = userId;
        next();
    };
}
