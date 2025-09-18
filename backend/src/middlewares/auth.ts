import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const validateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) res.status(401).json({ message: "Please Sign in!" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  }
  catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

export { validateToken };