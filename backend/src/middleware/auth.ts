import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'lifetrack-super-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Express middleware to verify JWT auth tokens on secure routes
 */
export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Access Denied: No Token Provided' });
  }

  const token = authHeader.split(' ')[1]; // Expect format "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: Invalid Authorization Format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Access Denied: Invalid or Expired Token' });
  }
};
