import { prisma } from '../lib/prisma.js';

const TRIAL_CLIENTS_LIMIT = 3;
const TRIAL_INVOICES_PER_MONTH_LIMIT = 5;

export async function getSubscriptionStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      trialStartDate: true,
      trialEndDate: true,
      subscriptionStartDate: true,
      subscriptionEndDate: true,
      trialUsed: true,
    },
  });
  if (!user) throw new Error('User not found');

  const now = new Date();
  let trialDaysRemaining: number | null = null;
  if (user.plan === 'TRIAL' && user.trialEndDate) {
    const diff = user.trialEndDate.getTime() - now.getTime();
    trialDaysRemaining = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  }

  const clientsUsed = await prisma.client.count({ where: { userId } });
  const clientsLimit = user.plan === 'TRIAL' ? TRIAL_CLIENTS_LIMIT : null;

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const invoicesUsed = await prisma.invoice.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
  });
  const invoicesLimit = user.plan === 'TRIAL' ? TRIAL_INVOICES_PER_MONTH_LIMIT : null;

  return {
    plan: user.plan,
    status: user.subscriptionStatus,
    trialDaysRemaining,
    trialEndDate: user.trialEndDate?.toISOString() ?? null,
    subscriptionEndDate: user.subscriptionEndDate?.toISOString() ?? null,
    trialUsed: user.trialUsed ?? false,
    limits: {
      clientsUsed,
      clientsLimit: clientsLimit ?? clientsUsed,
      invoicesUsed,
      invoicesLimit: invoicesLimit ?? invoicesUsed,
    },
  };
}

export async function upgradePlan(
  userId: string,
  plan: 'PRO' | 'BUSINESS'
): Promise<ReturnType<typeof getSubscriptionStatus>> {
  const now = new Date();
  const subscriptionStartDate = now;
  const subscriptionEndDate = new Date(now);
  if (plan === 'PRO') {
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
  } else {
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate,
      subscriptionEndDate,
    },
  });

  return getSubscriptionStatus(userId);
}
