import { getAuth } from '@clerk/express';
import { Household } from '@prisma/client';
import { Request, Response } from 'express';
import he from 'he';
import { z } from 'zod';

import prisma from '../../prisma';
import logger from '../../utils/logger';

export async function controller(
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    fn: Function,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    try {
        const { userId } = getAuth(req);

        const json = await fn(userId);

        if (typeof json !== 'object') {
            return res.status(200).send(json);
        }

        res.json(decodeEntitiesDeep(json));
    } catch (error) {
        logger.error({ err: error }, 'Controller error');
        res.status(500).json(
            error instanceof Error
                ? { error: error.message }
                : { error: 'An unknown error occurred' },
        );
    }
}

export async function householdController(
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    fn: Function,
    {
        skipAccessCheck = false,
    }: {
        skipAccessCheck?: boolean;
    } = {},
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

    const household = await hasAccessToHousehold(
        userId,
        householdId,
        skipAccessCheck,
    );

    if (!household) {
        res.status(403).json({ error: 'Access denied' });
        return;
    }

    return await controller(req, res, () => fn(household));
}

export function parseBody<T>(
    res: Response,
    schema: z.ZodType<T>,
    body: unknown,
): null | T {
    const result = schema.safeParse(body);
    if (!result.success) {
        res.status(400).json({
            details: result.error.flatten(),
            error: 'Invalid request body',
        });
        return null;
    }
    return result.data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeEntitiesDeep(value: any): any {
    if (typeof value === 'string') {
        return he.decode(value);
    } else if (Array.isArray(value)) {
        return value.map(decodeEntitiesDeep);
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, decodeEntitiesDeep(v)]),
        );
    }
    return value;
}

async function hasAccessToHousehold(
    userId: string,
    householdId: number,
    skipAccessCheck = false,
): Promise<Household | null> {
    return await prisma.household.findFirst({
        where: {
            id: householdId,
            ...(skipAccessCheck ? {} : { members: { some: { id: userId } } }),
        },
    });
}
