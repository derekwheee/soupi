import { Request, Response } from 'express';
import * as userService from '../services/user';
import { controller } from './helpers';
import { clerkClient, getAuth } from '@clerk/express'

export async function syncUser(req: Request, res: Response) {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await clerkClient.users.getUser(userId)

    return await controller(req, res, () => userService.sync(user));
}