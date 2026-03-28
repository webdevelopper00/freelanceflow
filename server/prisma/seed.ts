import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 7);
  const user = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: {
      plan: 'TRIAL',
      trialStartDate: now,
      trialEndDate: trialEnd,
      subscriptionStatus: 'ACTIVE',
      trialUsed: true,
    },
    create: {
      email: 'test@test.com',
      name: 'Test User',
      password: hashedPassword,
      businessName: 'Test Agency',
      currency: 'USD',
      plan: 'TRIAL',
      trialStartDate: now,
      trialEndDate: trialEnd,
      subscriptionStatus: 'ACTIVE',
      trialUsed: true,
    },
  });

  // Delete only this user's data in correct order (do not delete users)
  const userInvoiceIds = (await prisma.invoice.findMany({ where: { userId: user.id }, select: { id: true } })).map(
    (inv) => inv.id
  );
  if (userInvoiceIds.length > 0) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: userInvoiceIds } } });
  }
  await prisma.invoice.deleteMany({ where: { userId: user.id } });
  await prisma.payment.deleteMany({ where: { userId: user.id } });
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.client.deleteMany({ where: { userId: user.id } });

  const clientData = [
    { name: 'Sarah Chen', email: 'sarah.chen@acme.com', company: 'Acme Corp' },
    { name: 'Marcus Webb', email: 'mwebb@beta.io', company: 'Beta LLC' },
    { name: 'Elena Rodriguez', email: 'elena@gamma.com', company: 'Gamma Inc' },
    { name: 'James Park', email: 'j.park@delta.co', company: 'Delta Co' },
    { name: 'Olivia Foster', email: 'olivia@epsilon.com', company: 'Epsilon Ltd' },
  ];

  const clients = await Promise.all(
    clientData.map((c) =>
      prisma.client.create({
        data: {
          ...c,
          userId: user.id,
          phone: '+1234567890',
          address: '123 Main St',
          status: 'ACTIVE',
          currency: 'USD',
        },
      })
    )
  );

  const invoices: { id: string; invoiceNumber: string; total: number }[] = [];

  const currentYear = now.getFullYear();
  for (let i = 1; i <= 10; i++) {
    const issueDate = new Date(now);
    issueDate.setMonth(issueDate.getMonth() - i);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);
    // Guaranteed unique: DB was wiped above; format INV-YYYY-NNN with index 1..10
    const invoiceNumber = `INV-${currentYear}-${String(i).padStart(3, '0')}`;
    const client = clients[i % clients.length];
    const status = i <= 3 ? 'PAID' : i <= 6 ? 'SENT' : 'DRAFT';
    // 2–3 items per invoice: build items and derive subtotal/tax/total
    const numItems = 2 + (i % 2);
    const items: { description: string; quantity: number; unitPrice: number; total: number }[] = [];
    let subtotal = 0;
    for (let j = 0; j < numItems; j++) {
      const quantity = 1 + (j % 3);
      const unitPrice = (100 + i * 50 + j * 25) * 100;
      const total = quantity * unitPrice;
      subtotal += total;
      items.push({
        description: `Service ${String.fromCharCode(65 + j)} - Invoice ${i}`,
        quantity,
        unitPrice,
        total,
      });
    }
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;

    const inv = await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: client.id,
        invoiceNumber,
        status,
        issueDate,
        dueDate,
        subtotal,
        tax,
        total,
        currency: 'USD',
        notes: i % 2 === 0 ? 'Thank you for your business.' : null,
      },
    });
    invoices.push({ id: inv.id, invoiceNumber: inv.invoiceNumber, total: inv.total });

    await prisma.invoiceItem.createMany({
      data: items.map((item) => ({
        invoiceId: inv.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    });
  }

  const paymentMethods = ['BANK_TRANSFER', 'STRIPE', 'PAYPAL', 'CASH', 'OTHER'] as const;
  for (let i = 0; i < 10; i++) {
    const client = clients[i % clients.length];
    const inv = invoices[i % invoices.length];
    const date = new Date(now);
    date.setDate(date.getDate() - i * 3);
    await prisma.payment.create({
      data: {
        userId: user.id,
        clientId: client.id,
        invoiceId: inv.id,
        amount: Math.round((100 + i * 50) * 100),
        currency: 'USD',
        date,
        method: paymentMethods[i % paymentMethods.length],
        notes: i % 3 === 0 ? 'Payment received' : null,
      },
    });
  }

  const categories = ['SOFTWARE', 'EQUIPMENT', 'TRANSPORT', 'MARKETING', 'OFFICE', 'TAX', 'OTHER'] as const;
  const expenseTitles = [
    'Laptop renewal',
    'Office supplies',
    'Train ticket',
    'Ad campaign',
    'Desk chair',
    'Accountant fee',
    'Cloud hosting',
    'Monitor',
    'Client dinner',
    'Misc supplies',
  ];
  for (let i = 0; i < 10; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 2);
    await prisma.expense.create({
      data: {
        userId: user.id,
        title: expenseTitles[i],
        amount: Math.round((20 + i * 15) * 100),
        category: categories[i % categories.length],
        date,
        notes: i % 4 === 0 ? 'Monthly expense' : null,
      },
    });
  }

  console.log('Seed completed: 1 user, 5 clients, 10 invoices (2–3 items each), 10 payments, 10 expenses');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
