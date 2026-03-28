import type { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import type { AuthRequest } from './auth.js';

export type PlanType = 'TRIAL' | 'PRO' | 'BUSINESS';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

const TRIAL_CLIENTS_LIMIT = 3;
const TRIAL_INVOICES_PER_MONTH_LIMIT = 5;

/** Ensure trial expiry is applied before other checks. Call this first in protected routes. */
export async function checkTrialExpiry(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, trialEndDate: true, subscriptionStatus: true },
  });
  if (!user) return;
  if (user.plan === 'TRIAL' && user.subscriptionStatus === 'ACTIVE' && user.trialEndDate) {
    const now = new Date();
    if (now > user.trialEndDate) {
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'EXPIRED' },
      });
    }
  }
}

/** Throws if user cannot add more clients. */
export async function checkClientsLimit(userId: string): Promise<void> {
  await checkTrialExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true },
  });
  if (!user) throw new Error('User not found');
  if (user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'CANCELLED') {
    throw new Error('Upgrade to restore access');
  }
  if (user.plan !== 'TRIAL') return;
  const count = await prisma.client.count({ where: { userId } });
  if (count >= TRIAL_CLIENTS_LIMIT) {
    throw new Error('Upgrade to Pro to add more clients');
  }
}

/** Throws if user cannot add more invoices this month. */
export async function checkInvoicesLimit(userId: string): Promise<void> {
  await checkTrialExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true },
  });
  if (!user) throw new Error('User not found');
  if (user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'CANCELLED') {
    throw new Error('Upgrade to restore access');
  }
  if (user.plan !== 'TRIAL') return;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const count = await prisma.invoice.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });
  if (count >= TRIAL_INVOICES_PER_MONTH_LIMIT) {
    throw new Error('Upgrade to Pro for unlimited invoices');
  }
}

/** Throws if user cannot access Analytics. */
export async function checkAnalyticsAccess(userId: string): Promise<void> {
  await checkTrialExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true },
  });
  if (!user) throw new Error('User not found');
  if (user.plan === 'TRIAL' || user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'CANCELLED') {
    throw new Error('Analytics is a Pro feature');
  }
}

/** Throws if user cannot download PDF. */
export async function checkPDFAccess(userId: string): Promise<void> {
  await checkTrialExpiry(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true },
  });
  if (!user) throw new Error('User not found');
  if (user.plan === 'TRIAL' || user.subscriptionStatus === 'EXPIRED' || user.subscriptionStatus === 'CANCELLED') {
    throw new Error('PDF download is a Pro feature');
  }
}

/** Middleware: run checkTrialExpiry then next. Use on all protected routes. */
export function trialExpiryMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  checkTrialExpiry(userId)
    .then(() => next())
    .catch(() => next());
}
