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
    handle((req) => {
        const { userId } = getAuth(req);
        return userService.getById(userId!);
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
