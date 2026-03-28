import { Router } from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { updateProfileSchema, updatePasswordSchema } from '../validators/settings.js';
import { uploadLogo } from '../middleware/upload.js';

const router = Router();
const SALT_ROUNDS = 12;

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, businessName: true, logoUrl: true, currency: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { name, businessName, currency } = parsed.data;
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        businessName: businessName?.trim() ?? null,
        currency,
      },
      select: { id: true, name: true, email: true, businessName: true, currency: true, createdAt: true, updatedAt: true },
    });
    res.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const parsed = updatePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logo', authMiddleware, uploadLogo.single('logo'), async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { logoUrl: true },
    });

    if (existingUser?.logoUrl) {
      const oldLogoPath = path.join(process.cwd(), existingUser.logoUrl);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    const logoUrl = `/uploads/logos/${file.filename}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { logoUrl },
      select: { id: true, name: true, email: true, businessName: true, logoUrl: true, currency: true, createdAt: true },
    });

    res.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/logo', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { logoUrl: true },
    });

    if (existingUser?.logoUrl) {
      const logoPath = path.join(process.cwd(), existingUser.logoUrl);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { logoUrl: null },
      select: { id: true, name: true, email: true, businessName: true, logoUrl: true, currency: true, createdAt: true },
    });

    res.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
