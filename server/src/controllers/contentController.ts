import { NextFunction, Request, Response } from 'express';
import { contentService } from '../services/contentService';
import { ContentQuerySchema } from '../validators/contentSchemas';
import type { CreateContentInput, UpdateContentInput } from '../validators/contentSchemas';

export const contentController = {
  /** GET /api/content — list, search, filter, and paginate content for the authenticated user */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Parse and validate query parameters; use safe defaults on missing/invalid values.
      const parsed = ContentQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message ?? 'Invalid query parameters.',
          },
        });
        return;
      }

      const { items, pagination } = await contentService.listForUserWithQuery(
        req.user!.userId,
        parsed.data
      );

      res.status(200).json({
        success: true,
        data: { items, pagination },
      });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/content/random — return a random item from the authenticated user's content */
  async getRandom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await contentService.getRandom(req.user!.userId);

      if (!item) {
        // User has no saved content — return a controlled empty response.
        res.status(200).json({
          success: true,
          data: { content: null, empty: true },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { content: item, empty: false },
      });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/content/:id — get a single content item */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await contentService.getOne(req.user!.userId, req.params['id'] as string);
      res.status(200).json({
        success: true,
        data: { item },
      });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/content — create a new content item */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateContentInput;
      const item = await contentService.create(req.user!.userId, input);
      res.status(201).json({
        success: true,
        data: { item },
      });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/content/:id — update an existing content item */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as UpdateContentInput;
      const item = await contentService.update(req.user!.userId, req.params['id'] as string, input);
      res.status(200).json({
        success: true,
        data: { item },
      });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/content/:id — delete a content item */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contentService.delete(req.user!.userId, req.params['id'] as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
