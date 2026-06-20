import { getAuth } from '@clerk/express';
import { clerkClient } from '@clerk/express';
import { Router } from 'express';

import { handle, parseBody } from '../middleware/handle';
import requireAuth from '../middleware/require-auth';
import { UpdateUserSchema } from '../schemas';
import * as userService from '../services/user';

const router = Router();

router.get(
    '/',
    requireAuth(),
    handle(async (req, res) => {
        const { userId } = getAuth(req);
        const user = await userService.getById(userId!);
        // The client (and sous-swift) treat a thrown/4xx GET /user as "not synced
        // yet" and fall back to POST /user/sync. Returning null here is a 200 with
        // an empty body, so that fallback never fires and a first-time user is
        // left with no household.
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        return user;
    }),
);

router.post(
    '/',
    requireAuth(),
    handle(async (req, res) => {
        const { userId } = getAuth(req);
        const body = parseBody(res, UpdateUserSchema, req.body);
        if (!body) return;
        return userService.updateUser(userId!, body);
    }),
);

router.post(
    '/sync',
    requireAuth(),
    handle(async (req) => {
        const { userId } = getAuth(req);
        const user = await clerkClient.users.getUser(userId!);
        return userService.sync(user);
    }),
);

export default router;
