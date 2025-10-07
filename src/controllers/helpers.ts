import { Request, Response } from 'express';

export async function controller(
    req: Request,
    res: Response,
    fn: Function
): Promise<void> {
    try {
        const json = await fn();
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