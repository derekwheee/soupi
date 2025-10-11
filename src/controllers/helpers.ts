import { Request, Response } from 'express';
import { getAuth } from '@clerk/express'
import he from 'he';


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