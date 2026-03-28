import { prisma } from '../lib/prisma.js';

const INVOICE_NUMBER_PREFIX = 'INV-';
const INVOICE_NUMBER_REGEX = /^INV-(\d{4})-(\d{3})$/;

/**
 * Generates the next unique invoice number in format INV-YYYY-NNN.
 * Finds the highest NNN for the current year and returns INV-YYYY-(NNN+1).
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${INVOICE_NUMBER_PREFIX}${year}-`;

  const existing = await prisma.invoice.findMany({
    where: { invoiceNumber: { startsWith: prefix } },
    select: { invoiceNumber: true },
  });

  let maxSeq = 0;
  for (const row of existing) {
    const match = row.invoiceNumber.match(INVOICE_NUMBER_REGEX);
    if (match && parseInt(match[1], 10) === year) {
      const seq = parseInt(match[2], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = maxSeq + 1;
  return `${INVOICE_NUMBER_PREFIX}${year}-${String(nextSeq).padStart(3, '0')}`;
}
