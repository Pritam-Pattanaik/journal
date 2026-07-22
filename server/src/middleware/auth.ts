import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_please_change';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRoles(allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!user || !allowedRoles.includes(user.role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return;
      }
      req.role = user.role;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
