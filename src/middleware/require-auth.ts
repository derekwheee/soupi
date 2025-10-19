import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

export default function requireAuth() {
    return function (req: Request, res: Response, next: NextFunction) {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    };
}
