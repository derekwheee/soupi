import { Request, Response } from 'express';
import { getAuth } from '@clerk/express'

export async function controller(
    req: Request,
    res: Response,
    fn: Function
): Promise<void> {
    try {
        const { userId } = getAuth(req);

        const json = await fn(userId);
        res.json(json);
    } catch (error) {
        console.error(error);
        res.status(500).json(
            error instanceof Error ?
                { error: error.message } :
                { error: 'An unknown error occurred' }
        );
    }
}