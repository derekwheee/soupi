import { Router } from 'express';

import PackageJson from '../../package.json';
import { handle } from '../middleware/handle';

const router = Router();

router.get(
    '/',
    handle(async () => ({
        name: 'soupi',
        status: 'ok',
        version: PackageJson.version,
    })),
);

export default router;
