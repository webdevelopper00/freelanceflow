import { Router } from 'express';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { getNextInvoiceNumber } from '../services/invoice-service.js';
import { createInvoiceSchema } from '../validators/invoice.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { checkInvoicesLimit, checkPDFAccess } from '../middleware/plan-check.js';
import { logAudit } from '../middleware/audit.js';
import { sanitizeString } from '../lib/sanitize.js';

const router = Router();

function formatCents(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { id: true, name: true, email: true } } },
      }),
      prisma.invoice.count({ where: { userId } }),
    ]);

    res.json({
      data: invoices.map((inv) => ({
        ...inv,
        issueDate: inv.issueDate.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    await checkPDFAccess(userId);
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { logoUrl: true, businessName: true, name: true },
    });

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true, client: true },
    });
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    let hasLogo = false;
    if (user?.logoUrl) {
      const logoPath = path.join(process.cwd(), user.logoUrl);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 50, { fit: [150, 60] });
          hasLogo = true;
          doc.y = 120;
        } catch {
          hasLogo = false;
        }
      }
    }

    if (!hasLogo) {
      const companyName = user?.businessName || user?.name || 'Company';
      doc.fontSize(14).text(companyName, 50, 50, { continued: false });
      doc.moveDown();
    }

    doc.fontSize(20).text('INVOICE', { align: 'right' });
    doc.fontSize(10).text(`# ${invoice.invoiceNumber}`, { align: 'right' });
    doc.moveDown();

    doc.text(`Bill To: ${invoice.client.name}`, { continued: false });
    doc.text(invoice.client.email, { continued: false });
    if (invoice.client.company) doc.text(invoice.client.company, { continued: false });
    if (invoice.client.address) doc.text(invoice.client.address, { continued: false });
    doc.moveDown();

    doc.text(`Issue Date: ${invoice.issueDate.toISOString().slice(0, 10)}`, { continued: false });
    doc.text(`Due Date: ${invoice.dueDate.toISOString().slice(0, 10)}`, { continued: false });
    doc.moveDown(2);

    doc.fontSize(11).text('Items', { continued: false });
    doc.moveDown(0.5);
    const tableTop = doc.y;
    doc.fontSize(9).text('Description', 50, tableTop, { width: 220 });
    doc.text('Qty', 280, tableTop, { width: 40 });
    doc.text('Unit Price', 330, tableTop, { width: 70 });
    doc.text('Total', 410, tableTop, { width: 80 });
    doc.moveDown(0.5);
    let y = doc.y;
    for (const item of invoice.items) {
      doc.text(item.description.slice(0, 50), 50, y, { width: 220 });
      doc.text(String(item.quantity), 280, y, { width: 40 });
      doc.text(formatCents(item.unitPrice, invoice.currency), 330, y, { width: 70 });
      doc.text(formatCents(item.total, invoice.currency), 410, y, { width: 80 });
      y += 20;
    }
    doc.y = y + 15;

    doc.text(`Subtotal: ${formatCents(invoice.subtotal, invoice.currency)}`, { continued: false });
    doc.text(`Tax: ${formatCents(invoice.tax, invoice.currency)}`, { continued: false });
    doc.fontSize(11).text(`Total: ${formatCents(invoice.total, invoice.currency)}`, { continued: false });
    if (invoice.notes) {
      doc.moveDown(2).fontSize(9).text(`Notes: ${invoice.notes}`, { continued: false });
    }
    doc.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (!res.headersSent && message.includes('Pro feature')) {
      res.status(403).json({ message });
      return;
    }
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { id } = req.params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { items: true, client: true },
    });
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }
    res.json({
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
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
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { clientId, status, issueDate, dueDate, items, currency, taxPercent, notes } = parsed.data;

    const existing = await prisma.invoice.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    const issue = new Date(issueDate);
    const due = new Date(dueDate);

    const lineItems = items.map((item) => ({
      description: sanitizeString(item.description),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
    const tax = Math.round((subtotal * (taxPercent ?? 10)) / 100);
    const total = subtotal + tax;

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        clientId,
        status,
        issueDate: issue,
        dueDate: due,
        subtotal,
        tax,
        total,
        currency,
        notes: notes ? sanitizeString(notes) : null,
        items: {
          create: lineItems,
        },
      },
      include: {
        items: true,
        client: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit(req, 'UPDATE', 'invoice', invoice.id);

    res.json({
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    await checkInvoicesLimit(userId);
    const parsed = createInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { clientId, status, issueDate, dueDate, items, currency, taxPercent, notes } = parsed.data;

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }

    const issue = new Date(issueDate);
    const due = new Date(dueDate);

    const lineItems = items.map((item) => ({
      description: sanitizeString(item.description),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));
    const subtotal = lineItems.reduce((sum, i) => sum + i.total, 0);
    const tax = Math.round((subtotal * (taxPercent ?? 10)) / 100);
    const total = subtotal + tax;

    const invoiceNumber = await getNextInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        clientId,
        invoiceNumber,
        status,
        issueDate: issue,
        dueDate: due,
        subtotal,
        tax,
        total,
        currency,
        notes: notes ? sanitizeString(notes) : null,
        items: {
          create: lineItems,
        },
      },
      include: {
        items: true,
        client: { select: { id: true, name: true, email: true } },
      },
    });

    await logAudit(req, 'CREATE', 'invoice', invoice.id);

    res.status(201).json({
      ...invoice,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
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

export default router;
