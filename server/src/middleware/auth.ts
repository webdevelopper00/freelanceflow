import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { isBlacklisted } from '../lib/jwt-blacklist.js';

const JWT_SECRET = process.env.JWT_SECRET!;

export const ACCESS_TOKEN_EXPIRY = process.env.NODE_ENV === 'production' ? '15m' : '7d';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (isBlacklisted(token)) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });
    if (!user) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
