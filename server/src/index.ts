import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import dns from 'dns';

// Fix for Node 17+ IPv6 resolution issues with Neon/Prisma
dns.setDefaultResultOrder('ipv4first');

import { prisma } from './db';
import { generateAIInsight } from './lib/ai/llm';
import { syncDhanTrades } from './lib/brokers/dhan';

dotenv.config();

// ─── Startup Schema Migration ─────────────────────────────────────────────────
// Adds new columns idempotently so deployments are zero-downtime.
// Runs on every cold start; IF NOT EXISTS makes it a no-op after the first run.
(async () => {
  try {
    await prisma.$executeRaw`
      ALTER TABLE trades
        ADD COLUMN IF NOT EXISTS exit_time       TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS is_carry_forward BOOLEAN NOT NULL DEFAULT false
    `;
    console.log('[Migration] carry_forward columns: OK');
  } catch (err) {
    // Non-fatal — columns may already exist or DB may be unreachable during local dev
    console.warn('[Migration] carry_forward columns skipped:', (err as any)?.message);
  }
})();

// Fix for UNABLE_TO_VERIFY_LEAF_SIGNATURE (common on corporate VPNs/proxies)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve the interactive API tester from /public
app.use(express.static(path.join(process.cwd(), 'public')));

// Root redirect → API Tester
app.get('/', (_req, res) => res.redirect('/api-tester.html'));

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_please_change';

// Per-user sync lock — prevents concurrent syncs for the same user which would
// cause duplicate trades. Key = userId, value = true when sync is running.
const syncInProgress = new Map<string, boolean>();

// ─── Auth Middleware ──────────────────────────────────────────────────────────
interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRoles(allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!user || !allowedRoles.includes(user.role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        return;
      }
      req.role = user.role;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── BROKER CONFIGURATIONS ──────────────────────────────────────────────────
app.get('/api/brokers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const brokers = await prisma.brokerConnection.findMany({
      where: { userId: req.userId! },
      select: {
        id: true,
        broker: true,
        clientId: true,
        isActive: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    });
    res.json(brokers);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

app.post('/api/brokers', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { broker, apiKey, apiSecret, clientId, metadata } = req.body;
    
    if (!broker || !apiKey) {
      return res.status(400).json({ error: 'Broker and API Key are required' });
    }

    const existing = await prisma.brokerConnection.findFirst({
      where: { userId: req.userId!, broker },
    });

    if (existing) {
      const updated = await prisma.brokerConnection.update({
        where: { id: existing.id },
        data: {
          apiKey,
          apiSecret,
          clientId,
          metadata,
          isActive: true,
        },
      });
      res.json(updated);
    } else {
      const inserted = await prisma.brokerConnection.create({
        data: {
          userId: req.userId!,
          broker,
          apiKey,
          apiSecret,
          clientId,
          metadata,
          isActive: true,
        },
      });
      res.status(201).json(inserted);
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save broker configuration' });
  }
});

app.delete('/api/brokers/:broker', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const broker = String(req.params.broker);
    await prisma.brokerConnection.deleteMany({
      where: { userId: req.userId!, broker },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete broker configuration' });
  }
});

// Update only the access token for a broker connection (e.g. when Dhan token expires daily)
app.patch('/api/brokers/:broker/token', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const broker = String(req.params.broker);
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'New token (apiKey) is required' });

    const conn = await prisma.brokerConnection.findFirst({
      where: { userId: req.userId!, broker },
    });
    if (!conn) return res.status(404).json({ error: 'Broker connection not found' });

    await prisma.brokerConnection.update({
      where: { id: conn.id },
      data: { apiKey, isActive: true },
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update token' });
  }
});

app.post('/api/brokers/sync/:broker', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const broker = String(req.params.broker);
    // ?full=true forces a complete 90-day backfill, ignoring lastSyncedAt.
    // Used after code fixes to correct historical data.
    const forceFullSync = req.query.full === 'true';

    // ── Sync lock: prevent concurrent syncs for the same user ────────────────
    // Two parallel syncs (e.g. from rapid button clicks or double-mount) would
    // both delete the same window and re-insert, creating duplicates.
    const lockKey = `${req.userId!}:${broker}`;
    if (syncInProgress.get(lockKey)) {
      return res.json({ success: true, count: 0, alreadySyncing: true });
    }
    syncInProgress.set(lockKey, true);

    const conn = await prisma.brokerConnection.findFirst({
      where: { userId: req.userId!, broker },
    });

    if (!conn) {
      return res.status(404).json({ error: 'Broker connection not found' });
    }

    const { apiKey, clientId } = conn;
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key missing for broker' });
    }

    let tradesToInsert: any[] = [];
    let tradesToUpdate: any[] = [];
    let newLastSyncedAt: Date | null = null;

    if (broker === 'dhan') {
      // Fetch user's personal trading rules (may be null if not configured yet)
      const userRules = await prisma.tradingRule.findUnique({
        where: { userId: req.userId! },
      });

      const personalRules = userRules ? {
        windowStart: userRules.windowStart,
        windowEnd: userRules.windowEnd,
        maxTradesPerDay: userRules.maxTradesPerDay,
        maxDailyLoss: userRules.maxDailyLoss ? parseFloat(String(userRules.maxDailyLoss)) : null,
        maxLossPerTrade: userRules.maxLossPerTrade ? parseFloat(String(userRules.maxLossPerTrade)) : null,
        allowedInstruments: userRules.allowedInstruments,
        allowedMarkets: userRules.allowedMarkets,
      } : null;

      // Resolve the last sync time so dhan.ts can choose incremental vs full backfill.
      // forceFullSync=true (via ?full=true) overrides to null to trigger the full 90-day path.
      const lastSyncedAt = (!forceFullSync && conn.lastSyncedAt) ? new Date(conn.lastSyncedAt) : null;

      // Fetch from broker FIRST — if this throws (e.g., invalid token, API error),
      // we bail out before touching the database, so existing trades stay intact.
      const result = await syncDhanTrades(clientId || '', apiKey, req.userId!, [], lastSyncedAt, personalRules);

      // ── Surgical per-date delete ──────────────────────────────────────────
      // CRITICAL FIX: The old approach deleted ALL trades from windowStart onwards
      // even when the Dhan API returned no data for some of those dates (e.g. due
      // to a T+1/T+2 processing delay for F&O settlements).  That permanently wiped
      // Jul 13 / Jul 14 style gaps that could never be re-inserted.
      //
      // New approach: delete ONLY the calendar dates for which the API actually
      // returned ≥1 raw execution.  Any date the API silently skipped (delay /
      // holiday / weekend) is left untouched in the DB.
      if (lastSyncedAt) {
        const datesToDelete: string[] = result.fetchedDates ?? [];
        for (const dateStr of datesToDelete) {
          await prisma.$executeRaw`
            DELETE FROM trades
            WHERE user_id = ${req.userId!}::uuid
              AND broker = 'dhan'
              AND source = 'broker_sync'
              AND DATE(date) = ${dateStr}::date
          `;
        }
        console.log(`[Sync] Deleted existing records for ${datesToDelete.length} date(s): ${datesToDelete.join(', ')}`);
      } else {
        // Full backfill: clear everything and rebuild from scratch
        await prisma.trade.deleteMany({
          where: {
            userId: req.userId!,
            broker: 'dhan',
            source: 'broker_sync',
          },
        });
      }

      tradesToInsert = result.tradesToInsert;
      tradesToUpdate = result.tradesToUpdate;
      newLastSyncedAt = result.latestTradeTime;

    } else if (broker === 'angelone') {
      let { accessToken } = conn;
      const metadata = conn.metadata ? JSON.parse(conn.metadata) : {};
      
      const doSync = async (token: string) => {
        const { syncAngelOneTrades } = await import('./lib/brokers/angelone');
        return await syncAngelOneTrades(clientId || '', token, apiKey, req.userId!, [], conn.lastSyncedAt);
      };

      try {
        if (!accessToken) throw new Error('TOKEN_EXPIRED');
        const result = await doSync(accessToken);
        tradesToInsert = result.tradesToInsert;
        tradesToUpdate = result.tradesToUpdate;
        newLastSyncedAt = result.latestTradeTime;
      } catch (err: any) {
        if (err.message === 'TOKEN_EXPIRED') {
          if (!metadata.password || !metadata.totpSecret) {
            return res.status(400).json({ error: 'Angel One requires Password and TOTP Secret for auto-login. Please update your broker settings.' });
          }
          // Auto-login
          const { loginAngelOne } = await import('./lib/brokers/angelone');
          const tokens = await loginAngelOne(clientId || '', metadata.password, metadata.totpSecret, apiKey);
          accessToken = tokens.jwtToken;
          
          // Save new tokens to DB
          await prisma.brokerConnection.update({
            where: { id: conn.id },
            data: { accessToken: tokens.jwtToken, refreshToken: tokens.refreshToken },
          });

          // Retry sync
          const result = await doSync(accessToken!);
          tradesToInsert = result.tradesToInsert;
          tradesToUpdate = result.tradesToUpdate;
          newLastSyncedAt = result.latestTradeTime;
        } else {
          throw err;
        }
      }
    } else {
      return res.status(400).json({ error: `Sync not yet implemented for ${broker}` });
    }

    if (tradesToInsert.length > 0) {
      await prisma.trade.createMany({
        data: tradesToInsert.map((t: any) => {
          const { dbId, _ruleViolations, ...rest } = t;
          return {
            ...rest,
            disciplineScore: rest.disciplineScore ?? null,
          };
        }),
      });
    }


    if (tradesToUpdate.length > 0) {
      // Process updates individually
      for (const t of tradesToUpdate) {
        if (!t.dbId) continue;
        const { dbId, ...rest } = t;
        await prisma.trade.update({
          where: { id: dbId },
          data: {
            exitPrice: rest.exitPrice,
            quantity: rest.quantity,
            pnl: rest.pnl,
            charges: rest.charges,
            netPnl: rest.netPnl,
            status: rest.status,
            updatedAt: new Date(),
          },
        });
      }
    }

    await prisma.brokerConnection.update({
      where: { id: conn.id },
      data: { lastSyncedAt: new Date() },
    });

    res.json({ success: true, count: tradesToInsert.length + tradesToUpdate.length });
  } catch (err: any) {
    console.error('Sync Error:', err);
    res.status(500).json({ error: err.message || 'Failed to sync trades' });
  } finally {
    // Always release the lock, even on error
    const lockKey = `${req.userId!}:${req.params.broker}`;
    syncInProgress.delete(lockKey);
  }
});

// ─── TRADING RULES ROUTES ─────────────────────────────────────────────────────

// GET /api/trading-rules — fetch current user's personal rules
app.get('/api/trading-rules', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const rules = await prisma.tradingRule.findUnique({
      where: { userId: req.userId! },
    });
    res.json(rules || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trading-rules — create or update personal rules (upsert)
app.post('/api/trading-rules', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      windowStart, windowEnd,
      maxTradesPerDay, maxDailyLoss, maxLossPerTrade,
      allowedInstruments, allowedMarkets,
    } = req.body;

    const payload = {
      windowStart: windowStart || null,
      windowEnd: windowEnd || null,
      maxTradesPerDay: maxTradesPerDay || null,
      maxDailyLoss: maxDailyLoss ? String(maxDailyLoss) : null,
      maxLossPerTrade: maxLossPerTrade ? String(maxLossPerTrade) : null,
      allowedInstruments: allowedInstruments?.length ? allowedInstruments : [],
      allowedMarkets: allowedMarkets?.length ? allowedMarkets : [],
      updatedAt: new Date(),
    };

    const result = await prisma.tradingRule.upsert({
      where: { userId: req.userId! },
      update: payload,
      create: { userId: req.userId!, ...payload },
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: fullName || null,
      },
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, avatarUrl: newUser.avatarUrl, timezone: newUser.timezone, role: newUser.role },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, timezone: user.timezone, role: user.role },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, timezone: user.timezone, role: user.role },
    });
  } catch (err: any) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/auth/profile
app.patch('/api/auth/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, avatarUrl, timezone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: { fullName, avatarUrl, timezone, updatedAt: new Date() },
    });
    res.json({ user: { id: updated.id, email: updated.email, fullName: updated.fullName, avatarUrl: updated.avatarUrl, timezone: updated.timezone, role: updated.role } });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── TRADES ROUTES ────────────────────────────────────────────────────────────

// GET /api/trades
app.get('/api/trades', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.trade.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });
    res.json(result);
  } catch (err: any) {
    console.error('Get trades error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trades
app.post('/api/trades', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const trade = await prisma.trade.create({
      data: {
        userId: req.userId!,
        broker: body.broker || 'manual',
        brokerTradeId: body.brokerTradeId || null,
        date: new Date(body.date),
        symbol: body.symbol,
        market: body.market,
        instrumentType: body.instrumentType,
        direction: body.direction || null,
        entryPrice: body.entryPrice?.toString() || null,
        exitPrice: body.exitPrice?.toString() || null,
        quantity: body.quantity?.toString() || null,
        pnl: body.pnl?.toString() || null,
        charges: body.charges?.toString() || null,
        netPnl: body.netPnl?.toString() || null,
        status: body.status || null,
        strategyId: body.strategyId || null,
        setupDescription: body.setupDescription || null,
        mindset: body.mindset || null,
        decisionNotes: body.decisionNotes || null,
        learnings: body.learnings || null,
        disciplineScore: body.disciplineScore || null,
        tags: body.tags || [],
        source: body.source || 'manual',
      },
    });
    res.status(201).json(trade);
  } catch (err: any) {
    console.error('Create trade error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/trades/:id
app.patch('/api/trades/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body;

    const updates: any = { updatedAt: new Date() };
    if (body.date !== undefined) updates.date = new Date(body.date);
    if (body.symbol !== undefined) updates.symbol = body.symbol;
    if (body.market !== undefined) updates.market = body.market;
    if (body.instrumentType !== undefined) updates.instrumentType = body.instrumentType;
    if (body.direction !== undefined) updates.direction = body.direction;
    if (body.entryPrice !== undefined) updates.entryPrice = body.entryPrice?.toString();
    if (body.exitPrice !== undefined) updates.exitPrice = body.exitPrice?.toString();
    if (body.quantity !== undefined) updates.quantity = body.quantity?.toString();
    if (body.pnl !== undefined) updates.pnl = body.pnl?.toString();
    if (body.charges !== undefined) updates.charges = body.charges?.toString();
    if (body.netPnl !== undefined) updates.netPnl = body.netPnl?.toString();
    if (body.status !== undefined) updates.status = body.status;
    if (body.strategyId !== undefined) updates.strategyId = body.strategyId;
    if (body.setupDescription !== undefined) updates.setupDescription = body.setupDescription;
    if (body.mindset !== undefined) updates.mindset = body.mindset;
    if (body.decisionNotes !== undefined) updates.decisionNotes = body.decisionNotes;
    if (body.learnings !== undefined) updates.learnings = body.learnings;
    if (body.disciplineScore !== undefined) updates.disciplineScore = body.disciplineScore;
    if (body.tags !== undefined) updates.tags = body.tags;

    // Prisma update throws if no record found, so we check first
    const existing = await prisma.trade.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    const updated = await prisma.trade.update({
      where: { id },
      data: updates,
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Update trade error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/trades/:id
app.delete('/api/trades/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.trade.deleteMany({
      where: { id, userId: req.userId! },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete trade error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── STRATEGIES ROUTES ────────────────────────────────────────────────────────

// GET /api/strategies
app.get('/api/strategies', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.strategy.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json(result);
  } catch (err: any) {
    console.error('Get strategies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/strategies
app.post('/api/strategies', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, rules, market, timeframe } = req.body;
    const strategy = await prisma.strategy.create({
      data: {
        userId: req.userId!,
        name,
        description: description || null,
        rules: rules || null,
        market: market || [],
        timeframe: timeframe || null,
      },
    });
    res.status(201).json(strategy);
  } catch (err: any) {
    console.error('Create strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/strategies/:id
app.patch('/api/strategies/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, description, rules, market, timeframe, isActive } = req.body;

    const existing = await prisma.strategy.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) { res.status(404).json({ error: 'Strategy not found' }); return; }

    const updated = await prisma.strategy.update({
      where: { id },
      data: { name, description, rules, market, timeframe, isActive },
    });
    res.json(updated);
  } catch (err: any) {
    console.error('Update strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/strategies/:id
app.delete('/api/strategies/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.strategy.deleteMany({
      where: { id, userId: req.userId! },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── JOURNAL ENTRIES ROUTES ───────────────────────────────────────────────────

// GET /api/journal
app.get('/api/journal', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.journalEntry.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });
    res.json(result);
  } catch (err: any) {
    console.error('Get journal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/journal
app.post('/api/journal', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const entry = await prisma.journalEntry.create({
      data: {
        userId: req.userId!,
        date: new Date(body.date),
        marketBias: body.marketBias || null,
        keyLevels: body.keyLevels || null,
        watchlist: body.watchlist || null,
        newsNotes: body.newsNotes || null,
        reflection: body.reflection || null,
        whatWentWell: body.whatWentWell || null,
        whatToImprove: body.whatToImprove || null,
        mood: body.mood || null,
        overallDiscipline: body.overallDiscipline || null,
      },
    });
    res.status(201).json(entry);
  } catch (err: any) {
    console.error('Create journal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/journal/:id
app.patch('/api/journal/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body;

    const existing = await prisma.journalEntry.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) { res.status(404).json({ error: 'Journal entry not found' }); return; }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        marketBias: body.marketBias,
        keyLevels: body.keyLevels,
        watchlist: body.watchlist,
        newsNotes: body.newsNotes,
        reflection: body.reflection,
        whatWentWell: body.whatWentWell,
        whatToImprove: body.whatToImprove,
        mood: body.mood,
        overallDiscipline: body.overallDiscipline,
        updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (err: any) {
    console.error('Update journal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/journal/:id
app.delete('/api/journal/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.journalEntry.deleteMany({
      where: { id, userId: req.userId! },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete journal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── AI INSIGHTS ROUTES ───────────────────────────────────────────────────────

// GET /api/insights
app.get('/api/insights', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.aiInsight.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json(result);
  } catch (err: any) {
    console.error('Get insights error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/insights
app.post('/api/insights', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const insight = await prisma.aiInsight.create({
      data: {
        userId: req.userId!,
        type: body.type || null,
        tradeId: body.tradeId || null,
        content: body.content,
        tradesAnalyzedCount: body.tradesAnalyzedCount || null,
        dateRangeStart: body.dateRangeStart ? new Date(body.dateRangeStart) : null,
        dateRangeEnd: body.dateRangeEnd ? new Date(body.dateRangeEnd) : null,
      },
    });
    res.status(201).json(insight);
  } catch (err: any) {
    console.error('Create insight error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/insights/analyze
app.post('/api/insights/analyze', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userTrades = await prisma.trade.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });

    const { content, patterns } = await generateAIInsight(userTrades);

    const insight = await prisma.aiInsight.create({
      data: {
        userId: req.userId!,
        type: 'deep_analysis',
        content,
        tradesAnalyzedCount: Math.min(userTrades.length, 50),
      },
    });

    // Upsert behavioral patterns into coach_memory
    for (const pattern of patterns) {
      // Check if this pattern type already exists for this user
      const existing = await prisma.coachMemory.findFirst({
        where: { userId: req.userId!, patternType: pattern.patternType },
      });

      if (existing) {
        // Update: move current count to previousCount, update current
        await prisma.coachMemory.update({
          where: { id: existing.id },
          data: {
            title: pattern.title,
            description: pattern.description,
            severity: pattern.severity,
            previousCount: existing.count,
            count: pattern.count,
            avgPnl: String(pattern.avgPnl),
            updatedAt: new Date(),
          },
        });
      } else {
        // Insert new memory
        await prisma.coachMemory.create({
          data: {
            userId: req.userId!,
            patternType: pattern.patternType,
            title: pattern.title,
            description: pattern.description,
            severity: pattern.severity,
            count: pattern.count,
            previousCount: 0,
            avgPnl: String(pattern.avgPnl),
          },
        });
      }
    }

    res.status(201).json(insight);
  } catch (err: any) {
    console.error('Analyze insights error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/coach-memory
app.get('/api/coach-memory', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memories = await prisma.coachMemory.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(memories);
  } catch (err: any) {
    console.error('Coach memory error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/admin/users
app.get('/api/admin/users', authenticate, requireRoles(['SUB_ADMIN', 'ADMIN', 'SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        u.id,
        u.email,
        u.full_name as "fullName",
        u.role,
        u.created_at as "createdAt",
        COUNT(t.id)::int as "totalTrades",
        COALESCE(SUM(t.net_pnl), 0)::float as "netPnl"
      FROM users u
      LEFT JOIN trades t ON t.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    res.json(result);
  } catch (err: any) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/role
app.patch('/api/admin/users/:id/role', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id as string;
    const { role } = req.body;

    if (!['USER', 'SUB_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Prevent Super Admin from demoting themselves, or add logic if needed.
    // Assuming simple RBAC for now.

    // Capture old role before updating
    const existingUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const oldRole = existingUser.role;

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role, updatedAt: new Date() },
    });

    // Audit log for role change
    await prisma.auditLog.create({
      data: {
        adminId: req.userId!,
        action: 'CHANGE_ROLE',
        targetType: 'user',
        targetId: targetUserId,
        details: JSON.stringify({ oldRole, newRole: role, email: updated.email }),
      }
    });

    res.json({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role
    });
  } catch (err: any) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ADMIN: System Stats ──────────────────────────────────────────────────────

// GET /api/admin/stats
app.get('/api/admin/stats', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [userCount, tradeStats, brokerStats, aiCount] = await Promise.all([
      prisma.user.count(),
      prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as total, COALESCE(SUM(net_pnl), 0)::float as "totalPnl", COUNT(CASE WHEN status = 'WIN' THEN 1 END)::int as wins FROM trades`,
      prisma.brokerConnection.count({ where: { isActive: true } }),
      prisma.aiInsight.count()
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentUsers = await prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
    const prevUsers = await prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } });

    const stats = tradeStats[0] || { total: 0, totalPnl: 0, wins: 0 };
    const winRate = stats.total > 0 ? ((stats.wins / stats.total) * 100) : 0;

    res.json({
      totalUsers: userCount,
      totalTrades: stats.total,
      totalPnl: stats.totalPnl,
      winRate: Math.round(winRate * 100) / 100,
      activeBrokers: brokerStats,
      aiInsights: aiCount,
      userGrowth: { recent: recentUsers, previous: prevUsers },
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats/charts?period=daily|weekly|monthly
app.get('/api/admin/stats/charts', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || 'daily';

    let userSignups: any[];
    let tradeVolume: any[];

    if (period === 'weekly') {
      userSignups = await prisma.$queryRaw<any[]>`
        SELECT date_trunc('week', created_at)::date as date, COUNT(*)::int as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY date_trunc('week', created_at)
        ORDER BY date ASC
      `;
      tradeVolume = await prisma.$queryRaw<any[]>`
        SELECT date_trunc('week', created_at)::date as date, COUNT(*)::int as count, COALESCE(SUM(net_pnl), 0)::float as pnl
        FROM trades
        WHERE created_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY date_trunc('week', created_at)
        ORDER BY date ASC
      `;
    } else if (period === 'monthly') {
      userSignups = await prisma.$queryRaw<any[]>`
        SELECT date_trunc('month', created_at)::date as date, COUNT(*)::int as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date ASC
      `;
      tradeVolume = await prisma.$queryRaw<any[]>`
        SELECT date_trunc('month', created_at)::date as date, COUNT(*)::int as count, COALESCE(SUM(net_pnl), 0)::float as pnl
        FROM trades
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date ASC
      `;
    } else {
      // daily (default)
      userSignups = await prisma.$queryRaw<any[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      tradeVolume = await prisma.$queryRaw<any[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count, COALESCE(SUM(net_pnl), 0)::float as pnl
        FROM trades
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
    }

    res.json({ userSignups, tradeVolume });
  } catch (err: any) {
    console.error('Admin charts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/stats/activity
app.get('/api/admin/stats/activity', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activity = await prisma.$queryRaw<any[]>`
      (
        SELECT 'signup' as type, full_name as description, created_at as timestamp, id as "userId"
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 'trade' as type, symbol || ' ' || status as description, created_at as timestamp, user_id as "userId"
        FROM trades
        ORDER BY created_at DESC
        LIMIT 5
      )
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    // Enrich with user names for trade entries
    const userIds = [...new Set(activity.map(a => a.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const enriched = activity.map(a => ({
      ...a,
      userName: userMap.get(a.userId)?.fullName || userMap.get(a.userId)?.email || null,
    }));

    res.json({ activity: enriched });
  } catch (err: any) {
    console.error('Admin activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ADMIN: User Management ──────────────────────────────────────────────────

// GET /api/admin/users/list (paginated, searchable, sortable)
app.get('/api/admin/users/list', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = req.query.search as string || '';
    const roleFilter = req.query.role as string || '';
    const sort = (req.query.sort as string) || 'created_at';
    const order = ((req.query.order as string) || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    // Whitelist sortable columns to prevent SQL injection
    const allowedSorts: Record<string, string> = {
      created_at: 'u.created_at',
      createdAt: 'u.created_at',
      email: 'u.email',
      fullName: 'u.full_name',
      full_name: 'u.full_name',
      role: 'u.role',
      totalTrades: '"totalTrades"',
      netPnl: '"netPnl"',
    };
    const sortColumn = allowedSorts[sort] || 'u.created_at';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (roleFilter) {
      whereClause += ` AND u.role = $${paramIndex}`;
      params.push(roleFilter);
      paramIndex++;
    }

    const countResult = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(DISTINCT u.id)::int as total FROM users u ${whereClause}`,
      ...params
    );
    const total = countResult[0]?.total || 0;

    const users = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
        u.id, u.email, u.full_name as "fullName", u.role, u.created_at as "createdAt",
        COUNT(t.id)::int as "totalTrades",
        COALESCE(SUM(t.net_pnl), 0)::float as "netPnl"
      FROM users u
      LEFT JOIN trades t ON t.user_id = u.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY ${sortColumn} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      ...params, limit, offset
    );

    res.json({ users, total, page, limit });
  } catch (err: any) {
    console.error('Admin users list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/users/:id/detail
app.get('/api/admin/users/:id/detail', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        trades: { orderBy: { date: 'desc' }, take: 50 },
        strategies: true,
        journalEntries: { orderBy: { date: 'desc' }, take: 20 },
        brokerConnections: true,
        aiInsights: { orderBy: { createdAt: 'desc' }, take: 20 },
        coachMemories: true,
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove password from response
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.userId) {
      res.status(400).json({ error: 'Cannot delete yourself' });
      return;
    }

    // Don't allow deleting other SUPER_ADMINs
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (target.role === 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Cannot delete a Super Admin' });
      return;
    }

    // Create audit log BEFORE deleting (to capture details)
    await prisma.auditLog.create({
      data: {
        adminId: req.userId!,
        action: 'DELETE_USER',
        targetType: 'user',
        targetId: req.params.id,
        details: JSON.stringify({ email: target.email, fullName: target.fullName }),
      }
    });

    // Delete user (cascades to trades, strategies, etc.)
    await prisma.user.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ADMIN: Trades ────────────────────────────────────────────────────────────

// GET /api/admin/trades
app.get('/api/admin/trades', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    // Build dynamic where clause from filters
    const where: any = {};
    if (req.query.userId) where.userId = req.query.userId as string;
    if (req.query.market) where.market = req.query.market as string;
    if (req.query.instrumentType) where.instrumentType = req.query.instrumentType as string;
    if (req.query.symbol) where.symbol = { contains: req.query.symbol as string, mode: 'insensitive' };
    if (req.query.status) where.status = req.query.status as string;

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) where.date.gte = new Date(req.query.startDate as string);
      if (req.query.endDate) where.date.lte = new Date(req.query.endDate as string);
    }

    // P&L range filter
    if (req.query.minPnl || req.query.maxPnl) {
      where.netPnl = {};
      if (req.query.minPnl) where.netPnl.gte = parseFloat(req.query.minPnl as string);
      if (req.query.maxPnl) where.netPnl.lte = parseFloat(req.query.maxPnl as string);
    }

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({
        where,
        include: { user: { select: { email: true, fullName: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trade.count({ where }),
    ]);

    // Compute aggregate stats for the filtered set
    const aggResult = await prisma.trade.aggregate({
      where,
      _count: { id: true },
      _sum: { netPnl: true },
      _avg: { netPnl: true },
    });
    const winCount = await prisma.trade.count({ where: { ...where, status: 'WIN' } });
    const totalFiltered = aggResult._count.id || 0;
    const winRate = totalFiltered > 0 ? Math.round((winCount / totalFiltered) * 10000) / 100 : 0;

    res.json({
      trades,
      total,
      page,
      limit,
      stats: {
        totalTrades: totalFiltered,
        winRate,
        avgPnl: aggResult._avg.netPnl ? Number(aggResult._avg.netPnl) : 0,
        totalPnl: aggResult._sum.netPnl ? Number(aggResult._sum.netPnl) : 0,
      },
    });
  } catch (err: any) {
    console.error('Admin trades error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ADMIN: Brokers ───────────────────────────────────────────────────────────

// GET /api/admin/brokers
app.get('/api/admin/brokers', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const connections = await prisma.brokerConnection.findMany({
      include: { user: { select: { email: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: connections.length,
      active: connections.filter(c => c.isActive).length,
      inactive: connections.filter(c => !c.isActive).length,
    };

    res.json({ connections, stats });
  } catch (err: any) {
    console.error('Admin brokers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ADMIN: AI Insights ───────────────────────────────────────────────────────

// GET /api/admin/ai-insights
app.get('/api/admin/ai-insights', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.type) where.type = req.query.type as string;
    if (req.query.userId) where.userId = req.query.userId as string;

    const [insights, total] = await Promise.all([
      prisma.aiInsight.findMany({
        where,
        include: { user: { select: { email: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiInsight.count({ where }),
    ]);

    // Stats: total count and breakdown by type
    const typeBreakdown = await prisma.aiInsight.groupBy({
      by: ['type'],
      _count: { id: true },
    });
    const byType: Record<string, number> = {};
    typeBreakdown.forEach(t => {
      byType[t.type || 'unknown'] = t._count.id;
    });

    res.json({
      insights,
      total,
      page,
      limit,
      stats: {
        totalInsights: total,
        byType,
      },
    });
  } catch (err: any) {
    console.error('Admin AI insights error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ADMIN: Audit Logs ────────────────────────────────────────────────────────

// GET /api/admin/audit-logs
app.get('/api/admin/audit-logs', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.action) where.action = req.query.action as string;

    if (req.query.startDate || req.query.endDate) {
      where.timestamp = {};
      if (req.query.startDate) where.timestamp.gte = new Date(req.query.startDate as string);
      if (req.query.endDate) where.timestamp.lte = new Date(req.query.endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { admin: { select: { email: true, fullName: true } } },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page, limit });
  } catch (err: any) {
    console.error('Admin audit logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── ADMIN: System Settings ──────────────────────────────────────────────────

// GET /api/admin/settings
app.get('/api/admin/settings', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    res.json({ settings });
  } catch (err: any) {
    console.error('Admin get settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/settings
app.patch('/api/admin/settings', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      res.status(400).json({ error: 'Key and value are required' });
      return;
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: req.userId!,
        action: 'UPDATE_SETTING',
        targetType: 'setting',
        targetId: key,
        details: JSON.stringify({ key, value }),
      }
    });

    res.json(setting);
  } catch (err: any) {
    console.error('Admin update setting error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 TradeVault API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
