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
import helmet from 'helmet';
import csurf from 'csurf';

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
import marketRoutes from './routes/market';
import notificationRoutes from './routes/notifications';
import newsEngineRoutes from './routes/news-engine';
import { startNewsEngine, stopNewsEngine } from './news-engine';
import { marketWorker } from './services/MarketWorker';

const app = express();

// Initialize Sentry (wrapped in try-catch for resilience in serverless environments)
if (process.env.SENTRY_DSN) {
  try {
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
  } catch (err) {
    console.warn('Sentry initialization failed (non-fatal):', err);
  }
}

// Dynamic CORS configuration
// In our strict same-origin architecture (Vite Proxy in Dev, Vercel Rewrites in Prod),
// cross-origin requests are not needed. We only allow them if explicitly configured.
app.use(cors({
  origin: process.env.EXTERNAL_FRONTEND_URL || false,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(helmet());

const csrfProtection = csurf({ 
  cookie: { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax' 
  } 
});

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

// CSRF Protection Middleware
app.use('/api', csrfProtection);

// CSRF Token endpoint
app.get('/api/auth/csrf', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
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
app.use('/api/market', marketRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reflections', reflectionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/news-engine', newsEngineRoutes);

// Start News Engine Pipeline (non-throwing — server boots regardless)
startNewsEngine();
marketWorker.start();

// Graceful shutdown
process.on('SIGTERM', () => { stopNewsEngine(); marketWorker.stop(); process.exit(0); });
process.on('SIGINT', () => { stopNewsEngine(); marketWorker.stop(); process.exit(0); });

// Start Server in development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 TradeVault API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
