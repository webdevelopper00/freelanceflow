import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS);

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 7);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: hashedPassword,
      businessName: null,
      currency: 'USD',
      plan: 'TRIAL',
      trialStartDate: now,
      trialEndDate: trialEnd,
      subscriptionStatus: 'ACTIVE',
      trialUsed: false,
    },
  });

  console.log('Production seed completed: 1 admin test account (admin@example.com / password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
