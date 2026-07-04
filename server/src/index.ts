import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { db } from './db';
import { users, trades, strategies, journalEntries, aiInsights, coachMemory, brokerConnections } from './db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { generateAIInsight } from './lib/ai/llm';
import { syncDhanTrades } from './lib/brokers/dhan';

dotenv.config();

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
      const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
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
    const brokers = await db.select({
      id: brokerConnections.id,
      broker: brokerConnections.broker,
      clientId: brokerConnections.clientId,
      isActive: brokerConnections.isActive,
      lastSyncedAt: brokerConnections.lastSyncedAt,
      createdAt: brokerConnections.createdAt
    }).from(brokerConnections).where(eq(brokerConnections.userId, req.userId!));
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

    const existing = await db.select().from(brokerConnections)
      .where(and(eq(brokerConnections.userId, req.userId!), eq(brokerConnections.broker, broker)))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db.update(brokerConnections).set({
        apiKey,
        apiSecret,
        clientId,
        metadata,
        isActive: true,
      }).where(eq(brokerConnections.id, existing[0].id)).returning();
      res.json(updated[0]);
    } else {
      const inserted = await db.insert(brokerConnections).values({
        userId: req.userId!,
        broker,
        apiKey,
        apiSecret,
        clientId,
        metadata,
        isActive: true,
      }).returning();
      res.status(201).json(inserted[0]);
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save broker configuration' });
  }
});

app.delete('/api/brokers/:broker', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const broker = String(req.params.broker);
    await db.delete(brokerConnections)
      .where(and(eq(brokerConnections.userId, req.userId!), eq(brokerConnections.broker, broker)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete broker configuration' });
  }
});

app.post('/api/brokers/sync/:broker', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const broker = String(req.params.broker);
    
    const conn = await db.select().from(brokerConnections)
      .where(and(eq(brokerConnections.userId, req.userId!), eq(brokerConnections.broker, broker)))
      .limit(1);

    if (conn.length === 0) {
      return res.status(404).json({ error: 'Broker connection not found' });
    }

    const { apiKey, clientId } = conn[0];
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key missing for broker' });
    }

    let tradesToInsert: any[] = [];
    let tradesToUpdate: any[] = [];
    let newLastSyncedAt: Date | null = null;

    if (broker === 'dhan') {
      // Dhan sync always fetches full 90-day history and re-aggregates from scratch.
      // Delete all existing broker_sync trades for this user+broker to avoid duplicates.
      await db.delete(trades)
        .where(
          and(
            eq(trades.userId, req.userId!),
            eq(trades.broker, 'dhan'),
            eq(trades.source, 'broker_sync')
          )
        );

      const result = await syncDhanTrades(clientId || '', apiKey, req.userId!, [], null);
      tradesToInsert = result.tradesToInsert;
      tradesToUpdate = result.tradesToUpdate;
      newLastSyncedAt = result.latestTradeTime;
    } else if (broker === 'angelone') {
      let { accessToken } = conn[0];
      const metadata = conn[0].metadata ? JSON.parse(conn[0].metadata) : {};
      
      const doSync = async (token: string) => {
        const { syncAngelOneTrades } = await import('./lib/brokers/angelone');
        return await syncAngelOneTrades(clientId || '', token, apiKey, req.userId!, [], conn[0].lastSyncedAt);
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
          await db.update(brokerConnections)
            .set({ accessToken: tokens.jwtToken, refreshToken: tokens.refreshToken })
            .where(eq(brokerConnections.id, conn[0].id));

          // Retry sync
          const result = await doSync(accessToken);
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
      await db.insert(trades).values(tradesToInsert.map((t: any) => {
        const { dbId, ...rest } = t;
        return {
          ...rest,
          disciplineScore: rest.disciplineScore ?? null,
        };
      }));
    }


    if (tradesToUpdate.length > 0) {
      // Process updates individually
      for (const t of tradesToUpdate) {
        if (!t.dbId) continue;
        const { dbId, ...rest } = t;
        await db.update(trades)
          .set({
            exitPrice: rest.exitPrice,
            quantity: rest.quantity,
            pnl: rest.pnl,
            charges: rest.charges,
            netPnl: rest.netPnl,
            status: rest.status,
            updatedAt: new Date()
          })
          .where(eq(trades.id, dbId));
      }
    }

    await db.update(brokerConnections)
      .set({ lastSyncedAt: newLastSyncedAt || conn[0].lastSyncedAt || new Date() })
      .where(eq(brokerConnections.id, conn[0].id));

    res.json({ success: true, count: tradesToInsert.length + tradesToUpdate.length });
  } catch (err: any) {
    console.error('Sync Error:', err);
    res.status(500).json({ error: err.message || 'Failed to sync trades' });
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

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      fullName: fullName || null,
    }).returning();

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

    const [user] = await db.select().from(users).where(eq(users.email, email));
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
    const [user] = await db.select().from(users).where(eq(users.id, req.userId!));
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
    const [updated] = await db.update(users)
      .set({ fullName, avatarUrl, timezone, updatedAt: new Date() })
      .where(eq(users.id, req.userId!))
      .returning();
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
    const result = await db.select().from(trades)
      .where(eq(trades.userId, req.userId!))
      .orderBy(desc(trades.date));
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
    const [trade] = await db.insert(trades).values({
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
      tags: body.tags || null,
      source: body.source || 'manual',
    }).returning();
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

    const [updated] = await db.update(trades)
      .set(updates)
      .where(and(eq(trades.id, id), eq(trades.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }
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
    await db.delete(trades).where(and(eq(trades.id, id), eq(trades.userId, req.userId!)));
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
    const result = await db.select().from(strategies)
      .where(eq(strategies.userId, req.userId!))
      .orderBy(desc(strategies.createdAt));
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
    const [strategy] = await db.insert(strategies).values({
      userId: req.userId!,
      name,
      description: description || null,
      rules: rules || null,
      market: market || null,
      timeframe: timeframe || null,
    }).returning();
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
    const [updated] = await db.update(strategies)
      .set({ name, description, rules, market, timeframe, isActive })
      .where(and(eq(strategies.id, id), eq(strategies.userId, req.userId!)))
      .returning();
    if (!updated) { res.status(404).json({ error: 'Strategy not found' }); return; }
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
    await db.delete(strategies).where(and(eq(strategies.id, id), eq(strategies.userId, req.userId!)));
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
    const result = await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, req.userId!))
      .orderBy(desc(journalEntries.date));
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
    const [entry] = await db.insert(journalEntries).values({
      userId: req.userId!,
      date: body.date,
      marketBias: body.marketBias || null,
      keyLevels: body.keyLevels || null,
      watchlist: body.watchlist || null,
      newsNotes: body.newsNotes || null,
      reflection: body.reflection || null,
      whatWentWell: body.whatWentWell || null,
      whatToImprove: body.whatToImprove || null,
      mood: body.mood || null,
      overallDiscipline: body.overallDiscipline || null,
    }).returning();
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
    const [updated] = await db.update(journalEntries)
      .set({
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
      })
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, req.userId!)))
      .returning();
    if (!updated) { res.status(404).json({ error: 'Journal entry not found' }); return; }
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
    await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.userId, req.userId!)));
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
    const result = await db.select().from(aiInsights)
      .where(eq(aiInsights.userId, req.userId!))
      .orderBy(desc(aiInsights.createdAt));
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
    const [insight] = await db.insert(aiInsights).values({
      userId: req.userId!,
      type: body.type || null,
      tradeId: body.tradeId || null,
      content: body.content,
      tradesAnalyzedCount: body.tradesAnalyzedCount || null,
      dateRangeStart: body.dateRangeStart ? new Date(body.dateRangeStart) : null,
      dateRangeEnd: body.dateRangeEnd ? new Date(body.dateRangeEnd) : null,
    }).returning();
    res.status(201).json(insight);
  } catch (err: any) {
    console.error('Create insight error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/insights/analyze
app.post('/api/insights/analyze', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userTrades = await db.select().from(trades)
      .where(eq(trades.userId, req.userId!))
      .orderBy(desc(trades.date));

    const { content, patterns } = await generateAIInsight(userTrades);

    const [insight] = await db.insert(aiInsights).values({
      userId: req.userId!,
      type: 'deep_analysis',
      content,
      tradesAnalyzedCount: Math.min(userTrades.length, 50),
    }).returning();

    // Upsert behavioral patterns into coach_memory
    for (const pattern of patterns) {
      // Check if this pattern type already exists for this user
      const existing = await db.select().from(coachMemory)
        .where(and(eq(coachMemory.userId, req.userId!), eq(coachMemory.patternType, pattern.patternType)))
        .limit(1);

      if (existing.length > 0) {
        // Update: move current count to previousCount, update current
        await db.update(coachMemory)
          .set({
            title: pattern.title,
            description: pattern.description,
            severity: pattern.severity,
            previousCount: existing[0].count,
            count: pattern.count,
            avgPnl: String(pattern.avgPnl),
            updatedAt: new Date(),
          })
          .where(eq(coachMemory.id, existing[0].id));
      } else {
        // Insert new memory
        await db.insert(coachMemory).values({
          userId: req.userId!,
          patternType: pattern.patternType,
          title: pattern.title,
          description: pattern.description,
          severity: pattern.severity,
          count: pattern.count,
          previousCount: 0,
          avgPnl: String(pattern.avgPnl),
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
    const memories = await db.select().from(coachMemory)
      .where(eq(coachMemory.userId, req.userId!))
      .orderBy(desc(coachMemory.updatedAt));
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
    const result = await db.select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      createdAt: users.createdAt,
      totalTrades: sql<number>`count(${trades.id})`.mapWith(Number),
      netPnl: sql<number>`sum(${trades.netPnl})`.mapWith(Number),
    }).from(users)
      .leftJoin(trades, eq(trades.userId, users.id))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));
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

    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, targetUserId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

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

// ─── Start Server ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 TradeVault API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
