import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { sanitizeString } from '../lib/sanitize.js';

const router = Router();
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const expenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  category: z.enum(['SOFTWARE', 'EQUIPMENT', 'TRANSPORT', 'MARKETING', 'OFFICE', 'TAX', 'OTHER']),
  date: z.string(),
  notes: z.string().optional().nullable(),
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.expense.count({ where: { userId } }),
    ]);

    res.json({
      data: expenses.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { title, amount, category, date, notes } = parsed.data;

    const expense = await prisma.expense.create({
      data: {
        userId,
        title: sanitizeString(title),
        amount,
        category,
        date: new Date(date),
        notes: notes ? sanitizeString(notes) : null,
      },
    });

    await logAudit(req, 'CREATE', 'expense', expense.id);

    res.status(201).json({
      ...expense,
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { id } = req.params;
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { title, amount, category, date, notes } = parsed.data;

    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        title: sanitizeString(title),
        amount,
        category,
        date: new Date(date),
        notes: notes ? sanitizeString(notes) : null,
      },
    });

    await logAudit(req, 'UPDATE', 'expense', expense.id);

    res.json({
      ...expense,
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { id } = req.params;

    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    await prisma.expense.delete({ where: { id } });
    await logAudit(req, 'DELETE', 'expense', id);

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

