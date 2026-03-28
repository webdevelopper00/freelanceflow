import type { Request } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from './auth.js';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'UPGRADE';

export async function logAudit(
  req: AuthRequest | Request,
  action: AuditAction,
  resource: string,
  resourceId?: string | null,
  userIdOverride?: string
): Promise<void> {
  const authReq = req as AuthRequest;
  const userId = userIdOverride ?? authReq.userId;
  if (!userId) return;
  const ip = req.ip ?? (req as Request & { socket?: { remoteAddress?: string } }).socket?.remoteAddress ?? null;
  const userAgent = req.get?.('user-agent') ?? null;
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId: resourceId ?? null,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}
