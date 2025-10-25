import { Router } from 'express';
import { controller } from '../controllers/helpers';
import PackageJson from '../../package.json';

const router = Router();

router.get('/', (res, req) =>
    controller(res, req, () => {
        return {
            name: 'soupi',
            version: PackageJson.version,
            status: 'ok',
        };
    }),
);

export default router;
