import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validateQuery = (schema: ZodType) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = schema.safeParse(req.query);
  if (!result.success) return res.status(400).json(result.error);
  next();
};
