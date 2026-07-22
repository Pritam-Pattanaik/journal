import dotenv from 'dotenv';
dotenv.config();
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import dns from 'dns';
import { logger } from './lib/logger';

// Force IPv4 resolution for Neon/Prisma stability
dns.setDefaultResultOrder('ipv4first');

import authRoutes from './routes/auth';
import tradeRoutes from './routes/trades';
import brokerRoutes from './routes/brokers';
import tradingRulesRoutes from './routes/tradingRules';
import strategyRoutes from './routes/strategies';
import journalRoutes from './routes/journal';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';
import newsRoutes from './routes/news';
import analyticsRoutes from './routes/analytics';
import reflectionsRoutes from './routes/reflections';
import goalsRoutes from './routes/goals';
import searchRoutes from './routes/search';
import notesRoutes from './routes/notes';

const app = express();

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });
  // The request handler must be the first middleware on the app
  Sentry.setupExpressErrorHandler(app);
}

// Dynamic CORS configuration loaded from environment variables
const allowedOrigins: string[] = (
  process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
        'https://journal-puce-seven.vercel.app'
      ]
).map(o => o.trim());

app.use(cors({
  origin: (incomingOrigin, callback) => {
    if (!incomingOrigin) return callback(null, true);
    if (allowedOrigins.includes(incomingOrigin) || incomingOrigin.startsWith('http://localhost:') || incomingOrigin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: origin '${incomingOrigin}' not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Logging middleware
const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Static public files & interactive API tester
app.use(express.static(path.join(process.cwd(), 'public')));
app.get('/', (_req, res) => res.redirect('/api-tester.html'));

// Stateless CSRF Protection Middleware
app.use((req, res, next) => {
  // Only apply to state-mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // If it's a cross-origin or simple request using cookies, this header proves it was initiated by our JS (CORS preflight enforced)
    if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
      res.status(403).json({ error: 'CSRF token validation failed. Missing X-Requested-With header.' });
      return;
    }
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Modular Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/brokers', brokerRoutes);
app.use('/api/trading-rules', tradingRulesRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reflections', reflectionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notes', notesRoutes);

// Start Server in development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 TradeVault API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
