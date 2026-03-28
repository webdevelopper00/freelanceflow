import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { getSubscriptionStatus, upgradePlan } from '../services/subscription-service.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();

router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const status = await getSubscriptionStatus(userId);
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/upgrade', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const plan = req.body?.plan;
    if (plan !== 'PRO' && plan !== 'BUSINESS') {
      res.status(400).json({ message: 'Invalid plan. Use PRO or BUSINESS.' });
      return;
    }
    const status = await upgradePlan(userId, plan);
    await logAudit(req, 'UPGRADE', 'subscription', plan);
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
