import { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { COOKIE_NAME } from '../middleware/authenticate';
import { authService } from '../services/authService';
import type { LoginInput, RegisterInput } from '../validators/authSchemas';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  // Lax works for same-site dev setup (Vite proxy → Express on same origin)
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;
      const user = await authService.register(input);
      const token = authService.createToken(user.id);

      res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
      res.status(201).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;
      const user = await authService.login(input);
      const token = authService.createToken(user.id);

      res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },

  logout(_req: Request, res: Response): void {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.status(204).send();
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },
};
