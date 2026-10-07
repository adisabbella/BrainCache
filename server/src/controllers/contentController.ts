import { NextFunction, Request, Response } from 'express';
import { contentService } from '../services/contentService';
import { ContentQuerySchema } from '../validators/contentSchemas';
import type { CreateContentInput, UpdateContentInput } from '../validators/contentSchemas';

export const contentController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = ContentQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Invalid query parameters.',
          },
        });
        return;
      }

      const { items, pagination } = await contentService.listForUser(
        req.user!.userId,
        parsed.data
      );

      res.status(200).json({ success: true, data: { items, pagination } });
    } catch (err) {
      next(err);
    }
  },

  async getRandom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await contentService.getRandom(req.user!.userId);

      if (!item) {
        res.status(200).json({ success: true, data: { content: null, empty: true } });
        return;
      }

      res.status(200).json({ success: true, data: { content: item, empty: false } });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await contentService.getOne(req.user!.userId, req.params['id'] as string);
      res.status(200).json({ success: true, data: { item } });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateContentInput;
      const item = await contentService.create(req.user!.userId, input);
      res.status(201).json({ success: true, data: { item } });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateContentInput;
      const item = await contentService.update(req.user!.userId, req.params['id'] as string, input);
      res.status(200).json({ success: true, data: { item } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contentService.delete(req.user!.userId, req.params['id'] as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async enableSharing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shareToken } = await contentService.enableSharing(
        req.user!.userId,
        req.params['id'] as string
      );
      // Return the frontend-facing share URL path (not the raw API path).
      res.status(200).json({ success: true, data: { shareUrl: `/share/${shareToken}` } });
    } catch (err) {
      next(err);
    }
  },

  async disableSharing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contentService.disableSharing(req.user!.userId, req.params['id'] as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async getPublicByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const content = await contentService.getPublicByToken(req.params['token'] as string);
      res.status(200).json({ success: true, data: { content } });
    } catch (err) {
      next(err);
    }
  },
};
