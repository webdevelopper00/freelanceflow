import { z } from 'zod';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().int().min(0, 'Unit price must be non-negative'),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  currency: z.enum(['MAD', 'USD', 'EUR', 'GBP']).default('USD'),
  taxPercent: z.number().min(0).max(100).optional().default(10),
  notes: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
