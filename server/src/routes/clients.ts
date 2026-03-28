import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { createClientSchema } from '../validators/client.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { checkClientsLimit } from '../middleware/plan-check.js';
import { logAudit } from '../middleware/audit.js';
import { sanitizeString, sanitizeEmail } from '../lib/sanitize.js';

const router = Router();
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where: { userId } }),
    ]);

    res.json({
      data: clients.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
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
    await checkClientsLimit(userId);
    const parsed = createClientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { name, email, phone, company, address, currency, notes } = parsed.data;

    const client = await prisma.client.create({
      data: {
        userId,
        name: sanitizeString(name),
        email: sanitizeEmail(email),
        phone: phone ? sanitizeString(phone) : null,
        company: company ? sanitizeString(company) : null,
        address: address ? sanitizeString(address) : null,
        currency,
        notes: notes ? sanitizeString(notes) : null,
      },
    });

    await logAudit(req, 'CREATE', 'client', client.id);

    res.status(201).json({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message.includes('Upgrade')) {
      res.status(403).json({ message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { id } = req.params;
    const parsed = createClientSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { name, email, phone, company, address, currency, notes } = parsed.data;

    const existing = await prisma.client.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: sanitizeString(name),
        email: sanitizeEmail(email),
        phone: phone ? sanitizeString(phone) : null,
        company: company ? sanitizeString(company) : null,
        address: address ? sanitizeString(address) : null,
        currency,
        notes: notes ? sanitizeString(notes) : null,
      },
    });

    await logAudit(req, 'UPDATE', 'client', client.id);

    res.json({
      ...client,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
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

    const existing = await prisma.client.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    await prisma.client.delete({ where: { id } });
    await logAudit(req, 'DELETE', 'client', id);

    res.json({ message: 'Client deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

