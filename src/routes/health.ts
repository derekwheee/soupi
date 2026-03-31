import { Router } from 'express';

import prisma from '../../prisma';

const router = Router();

router.get('/', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ db: 'ok', status: 'ok' });
    } catch {
        res.status(503).json({ db: 'error', status: 'error' });
    }
});

export default router;
