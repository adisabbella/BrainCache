import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

/**
 * Returns Express middleware that validates req.body against the given Zod schema.
 * On failure it passes the ZodError to the centralized error handler.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace body with the parsed (coerced/trimmed) data
    req.body = result.data;
    next();
  };
}
