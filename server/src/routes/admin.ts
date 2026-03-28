import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/audit-logs', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);

    res.json({
      data: logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
