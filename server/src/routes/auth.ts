import { Router, type Request } from 'express';
import { registerSchema, loginSchema } from '../validators/auth.js';
import {
  registerUser,
  loginUser,
  setAuthCookies,
  getMe,
  verifyRefreshToken,
  createAccessToken,
} from '../services/auth-service.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { addToBlacklist } from '../lib/jwt-blacklist.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
      return;
    }
    const { user, accessToken, refreshToken } = await registerUser(parsed.data);
    setAuthCookies(res, accessToken, refreshToken, FRONTEND_URL);
    await logAudit(req, 'CREATE', 'user', user.id, user.id);
    res.status(201).json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    if (message === 'Email already registered') {
      res.status(409).json({ message });
      return;
    }
    res.status(400).json({ message });
  }
});

router.post('/login', async (req, res) => {
  const ip = req.ip ?? (req as Request & { socket?: { remoteAddress?: string } }).socket?.remoteAddress ?? 'unknown';
  const { recordFailedLogin, isBlocked: checkBlocked, getRemainingAttempts } = await import('../lib/login-block.js');
  try {
    if (checkBlocked(ip)) {
      res.status(429).json({ message: 'Too many failed attempts. Try again in 1 hour.' });
      return;
    }
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      recordFailedLogin(ip);
      console.warn('Failed login attempt', { ip });
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const { user, accessToken, refreshToken } = await loginUser(parsed.data);
    setAuthCookies(res, accessToken, refreshToken, FRONTEND_URL);
    await logAudit(req, 'LOGIN', 'auth', null, user.id);
    res.json({ user });
  } catch {
    recordFailedLogin(ip);
    console.warn('Failed login attempt', { ip });
    const remaining = getRemainingAttempts(ip);
    res.status(401).json({
      message: remaining <= 2 ? `Invalid email or password. ${remaining} attempts remaining.` : 'Invalid email or password',
    });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.accessToken;
  if (token) addToBlacklist(token);
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.decode(token) as { userId?: string } | null;
    if (decoded?.userId) await logAudit(req, 'LOGOUT', 'auth', null, decoded.userId);
  } catch {
    // ignore
  }
  res.clearCookie('accessToken', { path: '/', httpOnly: true });
  res.clearCookie('refreshToken', { path: '/', httpOnly: true });
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const user = await getMe(userId);
    res.json({ user });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }
    const { userId } = verifyRefreshToken(refreshToken);
    const accessToken = createAccessToken(userId);
    const isProduction = process.env.NODE_ENV === 'production';
    const accessTokenMaxAge = isProduction ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
      path: '/',
    });
    res.json({ message: 'Token refreshed' });
  } catch {
    res.clearCookie('accessToken', { path: '/', httpOnly: true });
    res.clearCookie('refreshToken', { path: '/', httpOnly: true });
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

export default router;

