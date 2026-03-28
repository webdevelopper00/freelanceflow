import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { checkAnalyticsAccess } from '../middleware/plan-check.js';

const router = Router();

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function subMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() - n);
  return out;
}
function formatMonth(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [
      paidInvoicesAgg,
      sentOverdueAgg,
      totalExpensesAgg,
      expensesThisMonthAgg,
      expensesLastMonthAgg,
      totalClients,
      totalInvoices,
      paidInvoicesCount,
      overdueInvoicesCount,
      revenueThisMonthRows,
      revenueLastMonthRows,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        where: { userId, status: 'PAID' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: { in: ['SENT', 'OVERDUE'] } },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: thisMonthStart, lte: thisMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { amount: true },
      }),
      prisma.client.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId, status: 'PAID' } }),
      prisma.invoice.count({ where: { userId, status: 'OVERDUE' } }),
      prisma.invoice.findMany({
        where: { userId, status: 'PAID', createdAt: { gte: thisMonthStart, lte: thisMonthEnd } },
        select: { total: true },
      }),
      prisma.invoice.findMany({
        where: { userId, status: 'PAID', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        select: { total: true },
      }),
    ]);

    const totalRevenue = paidInvoicesAgg._sum.total ?? 0;
    const pendingAmount = sentOverdueAgg._sum.total ?? 0;
    const totalExpenses = totalExpensesAgg._sum.amount ?? 0;
    const netProfit = totalRevenue - totalExpenses;
    const revenueThisMonth = revenueThisMonthRows.reduce((s, i) => s + i.total, 0);
    const revenueLastMonth = revenueLastMonthRows.reduce((s, i) => s + i.total, 0);
    const expensesThisMonth = expensesThisMonthAgg._sum.amount ?? 0;
    const expensesLastMonth = expensesLastMonthAgg._sum.amount ?? 0;

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      pendingAmount,
      totalClients,
      totalInvoices,
      paidInvoices: paidInvoicesCount,
      overdueInvoices: overdueInvoicesCount,
      revenueThisMonth,
      expensesThisMonth,
      revenueLastMonth,
      expensesLastMonth,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/monthly', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const now = new Date();
    const count = Math.min(12, Math.max(1, parseInt(String(req.query.months), 10) || 6));
    const months: { month: string; revenue: number; expenses: number; profit: number }[] = [];

    for (let i = count - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthLabel = formatMonth(d);

      const [revenueInvoices, expenseAgg] = await Promise.all([
        prisma.invoice.findMany({
          where: { userId, status: 'PAID', createdAt: { gte: start, lte: end } },
          select: { total: true },
        }),
        prisma.expense.aggregate({
          where: { userId, date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);
      const revenue = revenueInvoices.reduce((s, inv) => s + inv.total, 0);
      const expenses = expenseAgg._sum.amount ?? 0;
      months.push({ month: monthLabel, revenue, expenses, profit: revenue - expenses });
    }

    res.json(months);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;

    const [recentInvoices, recentPayments, recentExpenses] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { name: true } } },
      }),
      prisma.payment.findMany({
        where: { userId },
        take: 5,
        orderBy: { date: 'desc' },
        include: { client: { select: { name: true } } },
      }),
      prisma.expense.findMany({
        where: { userId },
        take: 5,
        orderBy: { date: 'desc' },
      }),
    ]);

    res.json({
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client.name,
        total: inv.total,
        currency: inv.currency,
        status: inv.status,
        issueDate: inv.issueDate.toISOString(),
      })),
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        clientName: p.client.name,
        amount: p.amount,
        currency: p.currency,
        method: p.method,
        date: p.date.toISOString(),
      })),
      recentExpenses: recentExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        amount: e.amount,
        date: e.date.toISOString(),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/by-client', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;

    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        invoices: {
          where: { status: 'PAID' },
          select: { total: true, createdAt: true },
        },
      },
    });

    const withRevenue = clients
      .map((c) => ({
        clientName: c.name,
        totalRevenue: c.invoices.reduce((s, i) => s + i.total, 0),
        invoiceCount: c.invoices.length,
        lastInvoiceDate:
          c.invoices.length > 0
            ? c.invoices.reduce((latest, i) => (i.createdAt > latest ? i.createdAt : latest), c.invoices[0].createdAt)
            : null,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)
      .map((c) => ({
        clientName: c.clientName,
        totalRevenue: c.totalRevenue,
        invoiceCount: c.invoiceCount,
        lastInvoiceDate: c.lastInvoiceDate?.toISOString() ?? null,
      }));

    res.json(withRevenue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/expenses-by-category', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;

    const expenses = await prisma.expense.findMany({
      where: { userId },
      select: { category: true, amount: true },
    });

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const byCategory = expenses.reduce<Record<string, { total: number; count: number }>>((acc, e) => {
      if (!acc[e.category]) acc[e.category] = { total: 0, count: 0 };
      acc[e.category].total += e.amount;
      acc[e.category].count += 1;
      return acc;
    }, {});

    const result = Object.entries(byCategory).map(([category, { total: catTotal, count }]) => ({
      category,
      total: catTotal,
      percentage: total > 0 ? Math.round((catTotal / total) * 1000) / 10 : 0,
      count,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/invoice-status-breakdown', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    await checkAnalyticsAccess(userId);
    const groups = await prisma.invoice.groupBy({
      by: ['status'],
      where: { userId },
      _count: { id: true },
    });
    const breakdown: Record<string, number> = {};
    for (const g of groups) {
      breakdown[g.status] = g._count.id;
    }
    res.json(breakdown);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message.includes('Pro feature')) {
      res.status(403).json({ message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/monthly-expenses-by-category', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    await checkAnalyticsAccess(userId);
    const now = new Date();
    const count = Math.min(12, Math.max(1, parseInt(String(req.query.months), 10) || 6));
    const result: { month: string; total: number; byCategory: Record<string, number> }[] = [];

    for (let i = count - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthLabel = formatMonth(d);

      const expenses = await prisma.expense.findMany({
        where: { userId, date: { gte: start, lte: end } },
        select: { category: true, amount: true },
      });

      const byCategory: Record<string, number> = {};
      let total = 0;
      for (const e of expenses) {
        byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
        total += e.amount;
      }
      result.push({ month: monthLabel, total, byCategory });
    }

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message.includes('Pro feature')) {
      res.status(403).json({ message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
