import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { sanitizeString } from '../lib/sanitize.js';

const router = Router();
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const paymentSchema = z.object({
  clientId: z.string().min(1),
  invoiceId: z.string().optional().nullable(),
  amount: z.number().int().positive(),
  currency: z.enum(['MAD', 'USD', 'EUR', 'GBP']),
  date: z.string(),
  method: z.enum(['BANK_TRANSFER', 'CASH', 'PAYPAL', 'STRIPE', 'OTHER']),
  notes: z.string().optional().nullable(),
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { client: { select: { id: true, name: true } } },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    res.json({
      data: payments.map((p) => ({
        ...p,
        clientName: p.client.name,
        date: p.date.toISOString(),
        createdAt: p.createdAt.toISOString(),
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
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { clientId, invoiceId, amount, currency, date, method, notes } = parsed.data;

    const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        clientId,
        invoiceId: invoiceId || null,
        amount,
        currency,
        date: new Date(date),
        method,
        notes: notes ? sanitizeString(notes) : null,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    await logAudit(req, 'CREATE', 'payment', payment.id);

    res.status(201).json({
      ...payment,
      clientName: payment.client.name,
      date: payment.date.toISOString(),
      createdAt: payment.createdAt.toISOString(),
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
    const parsed = paymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { clientId, invoiceId, amount, currency, date, method, notes } = parsed.data;

    const existing = await prisma.payment.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        clientId,
        invoiceId: invoiceId || null,
        amount,
        currency,
        date: new Date(date),
        method,
        notes: notes ? sanitizeString(notes) : null,
      },
      include: { client: { select: { id: true, name: true } } },
    });

    await logAudit(req, 'UPDATE', 'payment', payment.id);

    res.json({
      ...payment,
      clientName: payment.client.name,
      date: payment.date.toISOString(),
      createdAt: payment.createdAt.toISOString(),
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

    const existing = await prisma.payment.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    await prisma.payment.delete({ where: { id } });
    await logAudit(req, 'DELETE', 'payment', id);

    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

