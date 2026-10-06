import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 *
 * Public endpoint that confirms the backend is running.
 * No authentication required.
 *
 * Response: { success: true, data: { status: "ok" } }
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
    },
  });
});

export default router;