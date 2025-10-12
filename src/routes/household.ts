import { Router } from 'express';
import { joinHousehold } from '../controllers/household';

const router = Router();

router.post('/household/:householdId/join', joinHousehold);

export default router;