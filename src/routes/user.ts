import { Router } from 'express';
import { getUser, syncUser } from '../controllers/user';
import requireAuth from '../middleware/require-auth';

const router = Router();

router.get('/', requireAuth(), getUser);
router.post('/sync', requireAuth(), syncUser);

export default router;