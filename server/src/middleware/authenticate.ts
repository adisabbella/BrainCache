import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { authService } from '../services/authService';

const COOKIE_NAME = 'braincache_token';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

/**
 * Reads the JWT from the HTTP-only cookie, verifies it, and attaches the
 * authenticated user to req.user.
 *
 * The user ID is never accepted from the request body or headers.
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
