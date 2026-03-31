import { Router } from 'express';

import PackageJson from '../../package.json';
import { controller } from '../controllers/helpers';

const router = Router();

router.get('/', (res, req) =>
    controller(res, req, async () => ({
        name: 'soupi',
        status: 'ok',
        version: PackageJson.version,
    })),
);

export default router;
