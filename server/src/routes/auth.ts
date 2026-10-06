import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { LoginSchema, RegisterSchema } from '../validators/authSchemas';

const router = Router();

/**
 * Rate limiter for auth endpoints.
 * 10 requests per 15 minutes per IP — strict enough to slow brute-force
 * without blocking normal development usage.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
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

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate(RegisterSchema),
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate(LoginSchema),
  authController.login
);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

export default router;
