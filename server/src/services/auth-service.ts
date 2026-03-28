import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { ACCESS_TOKEN_EXPIRY } from '../middleware/auth.js';
import { sanitizeString, sanitizeEmail } from '../lib/sanitize.js';
import type { RegisterInput, LoginInput } from '../validators/auth.js';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const REFRESH_TOKEN_EXPIRY = '7d';

const userSelect = {
  id: true,
  email: true,
  name: true,
  businessName: true,
  currency: true,
  plan: true,
  trialStartDate: true,
  trialEndDate: true,
  subscriptionStatus: true,
  subscriptionStartDate: true,
  subscriptionEndDate: true,
  trialUsed: true,
  createdAt: true,
  updatedAt: true,
};

const TRIAL_DAYS = 7;

export async function registerUser(input: RegisterInput) {
  const emailLower = input.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: emailLower },
  });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const trialAlreadyUsed = await prisma.trialEmail.findUnique({
    where: { email: emailLower },
  });

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
  const now = new Date();
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DAYS);

  const user = await prisma.user.create({
    data: {
      email: sanitizeEmail(input.email),
      name: sanitizeString(input.name),
      password: hashedPassword,
      businessName: input.businessName ? sanitizeString(input.businessName) : null,
      currency: input.currency,
      plan: 'TRIAL',
      trialStartDate: now,
      trialEndDate: trialAlreadyUsed ? null : trialEndDate,
      subscriptionStatus: trialAlreadyUsed ? 'EXPIRED' : 'ACTIVE',
      trialUsed: true,
    },
    select: userSelect,
  });

  if (!trialAlreadyUsed) {
    await prisma.trialEmail.upsert({
      where: { email: emailLower },
      create: { email: emailLower },
      update: {},
    });
  }

  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { user, accessToken, refreshToken };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (!user) {
    throw new Error('Invalid email or password');
  }
  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new Error('Invalid email or password');
  }
  const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: userSelect,
  });
  return { user: userData, accessToken, refreshToken };
}

export function setAuthCookies(
  res: { cookie: (name: string, value: string, options: object) => void },
  accessToken: string,
  refreshToken: string,
  _frontendUrl: string
) {
  const isProduction = process.env.NODE_ENV === 'production';
  const accessTokenMaxAge = isProduction ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: accessTokenMaxAge,
    path: '/',
  };
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

export function verifyRefreshToken(refreshToken: string): { userId: string } {
  const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
  return decoded;
}

export function createAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}
