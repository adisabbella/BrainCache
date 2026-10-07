import { Router } from 'express';
import { contentController } from '../controllers/contentController';

const router = Router();

// GET /api/share/:token — public, no authentication required
router.get('/:token', contentController.getPublicByToken);

export default router;
