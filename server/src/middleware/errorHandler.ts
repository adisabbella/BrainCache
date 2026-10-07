import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { config } from '../config';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Zod v4 uses .issues (v4 dropped .errors)
  if (err instanceof ZodError) {
    const message = err.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
      })
      .join('; ');
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    });
    return;
  }

  // MongoDB duplicate key error (code 11000)
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    String((err as NodeJS.ErrnoException & { code: unknown }).code) === '11000'
  ) {
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'A resource with that value already exists.',
      },
    });
    return;
  }

  console.error('[Error]', err.message);
  if (config.isDevelopment) {
    console.error(err.stack);
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
}