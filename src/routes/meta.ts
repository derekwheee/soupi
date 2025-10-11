import { Router } from 'express';
import { controller } from '../controllers/helpers';

const router = Router();

router.get('/', (res, req) => controller(res, req, () => {

    return {
        name: "Soupi",
        version: "1.0.0",
        status: "ok"
    };
}));

export default router;