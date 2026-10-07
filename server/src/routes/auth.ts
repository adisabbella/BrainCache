import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { LoginSchema, RegisterSchema } from '../validators/authSchemas';

const router = Router();

// 10 requests per 15 minutes per IP — slows brute-force without blocking normal use.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

router.post('/register', authLimiter, validate(RegisterSchema), authController.register);
router.post('/login', authLimiter, validate(LoginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
