import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { authService } from '../services/authService';

const COOKIE_NAME = 'braincache_token';

/**
 * Extends the Express Request type to carry authenticated user information.
 * Downstream route handlers that are behind this middleware can safely access
 * req.user.userId without null checks.
 */
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

/**
 * Authentication middleware.
 *
 * Reads the JWT from the HTTP-only cookie, verifies it, and attaches the
 * authenticated user to req.user.
 *
 * Returns 401 if the token is missing or invalid.
 * The user ID is NEVER accepted from the request body or headers.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.[COOKIE_NAME];

  if (!token) {
    next(new AppError(401, 'AUTHENTICATION_ERROR', 'Authentication required.'));
    return;
  }

  try {
    const payload = authService.verifyToken(token);
    req.user = { userId: payload.userId };
    next();
  } catch (err) {
    next(err);
  }
}

export { COOKIE_NAME };
