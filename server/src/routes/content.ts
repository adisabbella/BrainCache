import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { contentController } from '../controllers/contentController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { CreateContentSchema, UpdateContentSchema } from '../validators/contentSchemas';

const router = Router();

// 30 creates per 15 minutes — prevents abuse of the metadata-fetching HTTP request.
const createContentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many requests. Please try again later.',
    },
  },
});

router.use(authenticate);

router.get('/', contentController.list);
// /random must be registered before /:id or Express treats "random" as a dynamic :id value.
router.get('/random', contentController.getRandom);
router.get('/:id', contentController.getOne);
router.post('/', createContentLimiter, validate(CreateContentSchema), contentController.create);
router.patch('/:id', validate(UpdateContentSchema), contentController.update);
router.delete('/:id', contentController.delete);
router.post('/:id/share', contentController.enableSharing);
router.delete('/:id/share', contentController.disableSharing);

export default router;
