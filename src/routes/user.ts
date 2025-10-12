import { Router } from 'express';
import { requireAuth } from '@clerk/express'
import { getUser, syncUser } from '../controllers/user';

const router = Router();

router.get('/', requireAuth(), getUser);
router.post('/sync', requireAuth(), syncUser);

export default router;