import { Household, Prisma } from '@prisma/client';
import prisma from '../../prisma';
import { Request, Response } from 'express';
import { getAuth } from '@clerk/express'
import he from 'he';
import { has } from 'cheerio/dist/commonjs/api/traversing';


function decodeEntitiesDeep(value: any): any {
    if (typeof value === 'string') {
        return he.decode(value);
    } else if (Array.isArray(value)) {
        return value.map(decodeEntitiesDeep);
    } else if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, decodeEntitiesDeep(v)])
        );
    }
    return value;
}

async function hasAccessToHousehold(
    userId: string,
    householdId: number,
    skipAccessCheck = false
): Promise<Household | null> {
    return await prisma.household.findFirst({
        where: {
            id: householdId,
            ...(skipAccessCheck ? {} : { members: { some: { id: userId } } })
        }
    });
}

export async function controller(
    req: Request,
    res: Response,
    fn: Function
): Promise<void> {
    try {
        const { userId } = getAuth(req);

        const json = await fn(userId);

        if (typeof json !== 'object') {
            throw new Error('Controller function must return an object');
        }

        res.json(decodeEntitiesDeep(json));
    } catch (error) {
        console.error(error);
        res.status(500).json(
            error instanceof Error ?
                { error: error.message } :
                { error: 'An unknown error occurred' }
        );
    }
}

export async function householdController(
    req: Request,
    res: Response,
    fn: Function,
    {
        skipAccessCheck = false
    } : {
        skipAccessCheck?: boolean
    } = {}
): Promise<void> {

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

    const household = await hasAccessToHousehold(userId, householdId, skipAccessCheck);

    if (!household) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    return await controller(req, res, () => fn(household));
}