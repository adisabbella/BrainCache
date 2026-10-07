import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import contentRouter from './routes/content';
import healthRouter from './routes/health';
import shareRouter from './routes/share';

/**
 * Creates and configures the Express application.
 *
 * Keeping app creation separate from server startup makes the app
 * easier to test in later milestones.
 *
 * All API routes are mounted under /api to match the documented API base URL.
 */
export function createApp() {
  const app = express();

  // ── Core middleware ─────────────────────────────────────────────────────
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Cookie parser (required for reading HTTP-only JWT cookie) ───────────
  app.use(cookieParser());

  // ── CORS ────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );

  // ── Routes ──────────────────────────────────────────────────────────────
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/content', contentRouter);
  // Public share endpoint — no auth middleware on this router.
  app.use('/api/share', shareRouter);

  // ── 404 fallback ────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      },
    });
  });

  // ── Centralized error handler ───────────────────────────────────────────
  app.use(errorHandler);

  return app;
}