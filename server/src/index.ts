import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { validateEnv } from './lib/env.js';
import authRouter from './routes/auth.js';
import clientRouter from './routes/clients.js';
import invoiceRouter from './routes/invoices.js';
import paymentRouter from './routes/payments.js';
import expenseRouter from './routes/expenses.js';
import dashboardRouter from './routes/dashboard.js';
import settingsRouter from './routes/settings.js';
import subscriptionRouter from './routes/subscription.js';
import adminRouter from './routes/admin.js';
import type { Request, Response, NextFunction } from 'express';

validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean) as string[];
const isDevelopment = process.env.NODE_ENV === 'development';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        fontSrc: ["'self'", 'fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' },
  })
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) res.status(408).json({ message: 'Request timeout' });
  });
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 1000 : 5,
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment,
});

app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRouter);
app.use('/api/clients', clientRouter);
app.use('/api/invoices', invoiceRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((_err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ message: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or run "npm run predev" first.`);
    process.exit(1);
  }
  throw error;
});
