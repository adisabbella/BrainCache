import { NextFunction, Request, Response } from 'express';
import { contentService } from '../services/contentService';
import type { CreateContentInput, UpdateContentInput } from '../validators/contentSchemas';

export const contentController = {
  /** GET /api/content — list all content for the authenticated user */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await contentService.listForUser(req.user!.userId);
      res.status(200).json({
        success: true,
        data: { items },
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
