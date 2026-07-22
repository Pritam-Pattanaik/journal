import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const JWT_SECRET = 'fallback_secret_please_change';
const PORT = process.env.MOCK_PORT || 3001; // use 3001 to avoid conflicting with actual dev server during tests

// ─── STATE TYPES ─────────────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  fullName: string | null;
  passwordHash: string;
  role: 'USER' | 'SUB_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  isSuspended: boolean;
  avatarUrl?: string | null;
  timezone?: string | null;
}

interface Trade {
  id: string;
  userId: string;
  broker: string;
  brokerTradeId?: string | null;
  date: string;
  symbol: string;
  market: string;
  instrumentType: string;
  direction: 'LONG' | 'SHORT' | null;
  entryPrice: string | null;
  exitPrice: string | null;
  quantity: string | null;
  pnl: string | null;
  charges: string | null;
  netPnl: string | null;
  status: 'WIN' | 'LOSS' | 'BREAKEVEN' | null;
  strategyId?: string | null;
  setupDescription?: string | null;
  mindset?: string | null;
  decisionNotes?: string | null;
  learnings?: string | null;
  disciplineScore?: number | null;
  tags: string[];
  source: 'manual' | 'broker_sync';
  createdAt: string;
  updatedAt: string;
}

interface BrokerConnection {
  id: string;
  userId: string;
  userEmail: string;
  broker: string;
  clientId: string | null;
  apiKey: string | null;
  apiSecret?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  metadata?: string | null;
  isActive: boolean;
  lastSyncedAt: string | null;
  syncHealth: 'SUCCESS' | 'ERROR' | 'PENDING';
  createdAt: string;
}

interface AiInsight {
  id: string;
  userId: string;
  userEmail: string;
  type: string | null;
  tradeId?: string | null;
  content: string;
  tradesAnalyzedCount?: number | null;
  dateRangeStart?: string | null;
  dateRangeEnd?: string | null;
  createdAt: string;
}

interface CoachMemory {
  id: string;
  userId: string;
  patternType: string;
  title: string;
  description: string;
  severity: string;
  count: number;
  previousCount: number;
  avgPnl: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
}

interface SystemSetting {
  key: string;
  value: string;
}

// ─── IN-MEMORY STATE ──────────────────────────────────────────────────────────
let users: User[] = [];
let trades: Trade[] = [];
let brokerConnections: BrokerConnection[] = [];
let aiInsights: AiInsight[] = [];
let coachMemories: CoachMemory[] = [];
let auditLogs: AuditLog[] = [];
const systemSettings: SystemSetting[] = [
  { key: 'enable_ai_coach', value: 'true' },
  { key: 'enable_broker_sync', value: 'true' },
  { key: 'maintenance_mode', value: 'false' },
  { key: 'system_announcement', value: 'Welcome to TradeVault!' }
];

// Helper to push audit logs
function logAdminAction(adminEmail: string, action: string, targetType: string, targetId: string, details: string) {
  const log: AuditLog = {
    id: `audit-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    adminEmail,
    action,
    targetType,
    targetId,
    details
  };
  auditLogs.push(log);
}

// ─── SEED DATA GENERATOR ──────────────────────────────────────────────────────
async function seedData() {
  const pwdAdmin = await bcrypt.hash('admin123', 12);
  const pwdUser = await bcrypt.hash('user123', 12);

  const adminUser: User = {
    id: 'u-admin-1111-1111-111111111111',
    email: 'superadmin@tradevault.in',
    fullName: 'Super Admin',
    passwordHash: pwdAdmin,
    role: 'SUPER_ADMIN',
    createdAt: '2026-06-01T00:00:00Z',
    isSuspended: false
  };

  const normalUser: User = {
    id: 'u-user-2222-2222-222222222222',
    email: 'user@tradevault.in',
    fullName: 'Jane Doe',
    passwordHash: pwdUser,
    role: 'USER',
    createdAt: '2026-06-15T00:00:00Z',
    isSuspended: false
  };

  const suspendedUser: User = {
    id: 'u-user-3333-3333-333333333333',
    email: 'suspended@tradevault.in',
    fullName: 'Suspended User',
    passwordHash: pwdUser,
    role: 'USER',
    createdAt: '2026-07-01T00:00:00Z',
    isSuspended: true
  };

  users = [adminUser, normalUser, suspendedUser];

  // Seed Trades
  trades = [
    {
      id: 't-1',
      userId: normalUser.id,
      broker: 'dhan',
      brokerTradeId: 'dhan-t-1',
      date: '2026-07-16T10:00:00Z',
      symbol: 'SBIN',
      market: 'NSE',
      instrumentType: 'EQ',
      direction: 'LONG',
      entryPrice: '500',
      exitPrice: '510',
      quantity: '100',
      pnl: '1000',
      charges: '50',
      netPnl: '950',
      status: 'WIN',
      tags: ['breakout'],
      source: 'broker_sync',
      createdAt: '2026-07-16T10:05:00Z',
      updatedAt: '2026-07-16T10:05:00Z'
    },
    {
      id: 't-2',
      userId: normalUser.id,
      broker: 'manual',
      date: '2026-07-15T14:30:00Z',
      symbol: 'RELIANCE',
      market: 'NSE',
      instrumentType: 'EQ',
      direction: 'SHORT',
      entryPrice: '2400',
      exitPrice: '2420',
      quantity: '10',
      pnl: '-200',
      charges: '20',
      netPnl: '-220',
      status: 'LOSS',
      tags: ['pullback'],
      source: 'manual',
      createdAt: '2026-07-15T14:35:00Z',
      updatedAt: '2026-07-15T14:35:00Z'
    }
  ];

  // Seed Broker Connections
  brokerConnections = [
    {
      id: 'bc-1',
      userId: normalUser.id,
      userEmail: normalUser.email,
      broker: 'dhan',
      clientId: 'dhan-cli-1',
      apiKey: 'dhan-key-1',
      isActive: true,
      lastSyncedAt: '2026-07-16T05:30:00Z',
      syncHealth: 'SUCCESS',
      createdAt: '2026-07-10T12:00:00Z'
    },
    {
      id: 'bc-2',
      userId: suspendedUser.id,
      userEmail: suspendedUser.email,
      broker: 'angelone',
      clientId: 'ao-cli-1',
      apiKey: 'ao-key-1',
      isActive: true,
      lastSyncedAt: '2026-07-15T09:00:00Z',
      syncHealth: 'SUCCESS',
      createdAt: '2026-07-12T12:00:00Z'
    }
  ];

  // Seed AI Insights
  aiInsights = [
    {
      id: 'ai-1',
      userId: normalUser.id,
      userEmail: normalUser.email,
      type: 'deep_analysis',
      content: 'You tend to overtrade in the first 30 mins of the market open. Focus on waiting for pattern confirmation.',
      tradesAnalyzedCount: 2,
      dateRangeStart: '2026-07-10T00:00:00Z',
      dateRangeEnd: '2026-07-16T23:59:59Z',
      createdAt: '2026-07-16T08:30:00Z'
    }
  ];

  coachMemories = [
    {
      id: 'cm-1',
      userId: normalUser.id,
      patternType: 'overtrading',
      title: 'Morning Overtrading',
      description: 'Frequently entry in first 30 mins.',
      severity: 'HIGH',
      count: 3,
      previousCount: 1,
      avgPnl: '-1500.00',
      createdAt: '2026-07-15T08:30:00Z',
      updatedAt: '2026-07-16T08:30:00Z'
    }
  ];

  // Seed Audit Logs
  auditLogs = [
    {
      id: 'audit-1',
      timestamp: '2026-07-16T10:00:00Z',
      adminEmail: adminUser.email,
      action: 'ROLE_CHANGE',
      targetType: 'USER',
      targetId: suspendedUser.id,
      details: `Changed role of user ${suspendedUser.email} to USER`
    }
  ];
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
interface AuthRequest extends Request {
  userId?: string;
  role?: string;
  userEmail?: string;
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
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    if (user.isSuspended) {
      res.status(403).json({ error: 'Account is suspended' });
      return;
    }
    req.userId = user.id;
    req.role = user.role;
    req.userEmail = user.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Check if run directly
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('mock_server.ts') || process.argv[1].endsWith('mock_server.js'));

function requireRoles(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userId || !req.role || !allowedRoles.includes(req.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
}

// Global maintenance middleware check
function checkMaintenance(req: Request, res: Response, next: NextFunction) {
  const mMode = systemSettings.find(s => s.key === 'maintenance_mode');
  // Skip check for admin routes or auth login/signup so admins can still login and disable maintenance mode
  const isAdminRoute = req.path.startsWith('/api/admin');
  const isAuthRoute = req.path.startsWith('/api/auth');
  if (mMode && mMode.value === 'true' && !isAdminRoute && !isAuthRoute) {
    res.status(503).json({ error: 'Service Unavailable: System is down for maintenance.' });
    return;
  }
  next();
}

app.use(checkMaintenance);

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /api/auth/signup
app.post('/api/auth/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const existing = users.find(u => u.email === email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const newUser: User = {
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      email,
      fullName: fullName || null,
      passwordHash,
      role: 'USER',
      createdAt: new Date().toISOString(),
      isSuspended: false
    };
    users.push(newUser);
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName, role: newUser.role }
    });
  } catch (_err) {
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
    const user = users.find(u => u.email === email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    if (user.isSuspended) {
      res.status(403).json({ error: 'Account is suspended' });
      return;
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
    });
  } catch (_err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── AUTHENTICATED USER ROUTES ────────────────────────────────────────────────

// GET /api/auth/me
app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = users.find(u => u.id === req.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
});

// PATCH /api/auth/profile
app.patch('/api/auth/profile', authenticate, (req: AuthRequest, res: Response) => {
  const { fullName, avatarUrl, timezone } = req.body;
  const userIdx = users.findIndex(u => u.id === req.userId);
  if (userIdx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  users[userIdx].fullName = fullName !== undefined ? fullName : users[userIdx].fullName;
  users[userIdx].avatarUrl = avatarUrl !== undefined ? avatarUrl : users[userIdx].avatarUrl;
  users[userIdx].timezone = timezone !== undefined ? timezone : users[userIdx].timezone;
  res.json({ user: { id: users[userIdx].id, email: users[userIdx].email, fullName: users[userIdx].fullName, role: users[userIdx].role } });
});

// GET /api/trades
app.get('/api/trades', authenticate, (req: AuthRequest, res: Response) => {
  const userTrades = trades.filter(t => t.userId === req.userId);
  res.json(userTrades);
});

// POST /api/trades
app.post('/api/trades', authenticate, (req: AuthRequest, res: Response) => {
  const body = req.body;
  const trade: Trade = {
    id: `t-${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId!,
    broker: body.broker || 'manual',
    brokerTradeId: body.brokerTradeId || null,
    date: body.date || new Date().toISOString(),
    symbol: body.symbol,
    market: body.market,
    instrumentType: body.instrumentType,
    direction: body.direction || null,
    entryPrice: body.entryPrice ? String(body.entryPrice) : null,
    exitPrice: body.exitPrice ? String(body.exitPrice) : null,
    quantity: body.quantity ? String(body.quantity) : null,
    pnl: body.pnl ? String(body.pnl) : null,
    charges: body.charges ? String(body.charges) : null,
    netPnl: body.netPnl ? String(body.netPnl) : null,
    status: body.status || null,
    strategyId: body.strategyId || null,
    tags: body.tags || [],
    source: body.source || 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  trades.push(trade);
  res.status(201).json(trade);
});

// PATCH /api/trades/:id
app.patch('/api/trades/:id', authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const body = req.body;
  const tradeIdx = trades.findIndex(t => t.id === id && t.userId === req.userId);
  if (tradeIdx === -1) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }
  const t = trades[tradeIdx];
  const updated = {
    ...t,
    ...body,
    updatedAt: new Date().toISOString()
  };
  trades[tradeIdx] = updated;
  res.json(updated);
});

// DELETE /api/trades/:id
app.delete('/api/trades/:id', authenticate, (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const tradeIdx = trades.findIndex(t => t.id === id && t.userId === req.userId);
  if (tradeIdx === -1) {
    res.status(404).json({ error: 'Trade not found' });
    return;
  }
  trades.splice(tradeIdx, 1);
  res.json({ success: true });
});

// GET /api/insights
app.get('/api/insights', authenticate, (req: AuthRequest, res: Response) => {
  const userInsights = aiInsights.filter(ai => ai.userId === req.userId);
  res.json(userInsights);
});

// POST /api/insights
app.post('/api/insights', authenticate, (req: AuthRequest, res: Response) => {
  const body = req.body;
  const insight: AiInsight = {
    id: `ai-${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId!,
    userEmail: req.userEmail!,
    type: body.type || null,
    tradeId: body.tradeId || null,
    content: body.content,
    tradesAnalyzedCount: body.tradesAnalyzedCount || null,
    dateRangeStart: body.dateRangeStart || null,
    dateRangeEnd: body.dateRangeEnd || null,
    createdAt: new Date().toISOString()
  };
  aiInsights.push(insight);
  res.status(201).json(insight);
});

// POST /api/insights/analyze
app.post('/api/insights/analyze', authenticate, (req: AuthRequest, res: Response): void => {
  // Check settings first
  const enableAi = systemSettings.find(s => s.key === 'enable_ai_coach');
  if (!enableAi || enableAi.value === 'false') {
    res.status(403).json({ error: 'AI Coach is disabled by Admin' });
    return;
  }

  const userTrades = trades.filter(t => t.userId === req.userId);
  const insight: AiInsight = {
    id: `ai-${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId!,
    userEmail: req.userEmail!,
    type: 'deep_analysis',
    content: `Simulated deep analysis of ${userTrades.length} trades. Keep up the disciplined trading!`,
    tradesAnalyzedCount: userTrades.length,
    createdAt: new Date().toISOString()
  };
  aiInsights.push(insight);

  // Add coach memory pattern
  const memory: CoachMemory = {
    id: `cm-${Math.random().toString(36).substr(2, 9)}`,
    userId: req.userId!,
    patternType: 'fomofixed',
    title: 'FOMO Mitigation',
    description: 'Reduced entry on chasing spikes.',
    severity: 'MEDIUM',
    count: 2,
    previousCount: 0,
    avgPnl: '500.00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  coachMemories.push(memory);

  res.status(201).json(insight);
});

// GET /api/coach-memory
app.get('/api/coach-memory', authenticate, (req: AuthRequest, res: Response) => {
  const memories = coachMemories.filter(cm => cm.userId === req.userId);
  res.json(memories);
});

// GET /api/brokers (User connection config)
app.get('/api/brokers', authenticate, (req: AuthRequest, res: Response) => {
  const conns = brokerConnections.filter(bc => bc.userId === req.userId).map(bc => ({
    id: bc.id,
    broker: bc.broker,
    clientId: bc.clientId,
    isActive: bc.isActive,
    lastSyncedAt: bc.lastSyncedAt,
    createdAt: bc.createdAt
  }));
  res.json(conns);
});

// PATCH /api/brokers/:broker/token
app.patch('/api/brokers/:broker/token', authenticate, (req: AuthRequest, res: Response): void => {
  const broker = req.params.broker;
  const { apiKey } = req.body;
  if (!apiKey) {
    res.status(400).json({ error: 'New token (apiKey) is required' });
    return;
  }
  const conn = brokerConnections.find(bc => bc.userId === req.userId && bc.broker === broker);
  if (!conn) {
    res.status(404).json({ error: 'Broker connection not found' });
    return;
  }
  conn.apiKey = apiKey;
  conn.isActive = true;
  conn.syncHealth = 'SUCCESS';
  res.json({ success: true });
});

// ─── SUPER ADMIN ROUTES ───────────────────────────────────────────────────────
// Gated by authentication and SUPER_ADMIN role validation.

// 1. System Overview Dashboard
app.get('/api/admin/overview', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const range = req.query.range as string || '7d';
  if (!['7d', '30d', '90d'].includes(range)) {
    res.status(400).json({ error: 'Invalid range' });
    return;
  }

  const activeConns = brokerConnections.filter(bc => bc.isActive).length;
  const totalTrs = trades.length;
  const netPnL = trades.reduce((acc, t) => acc + parseFloat(t.netPnl || '0'), 0);

  // Return counts and simple series
  res.json({
    totalUsers: users.length,
    userGrowth: 15.5,
    totalTrades: totalTrs,
    netPnl: netPnL,
    activeBrokerConnections: activeConns,
    aiInsightsCount: aiInsights.length,
    userGrowthSeries: [
      { date: '2026-07-10', count: users.length - 1 },
      { date: '2026-07-16', count: users.length }
    ],
    tradeVolumeSeries: [
      { date: '2026-07-15', volume: 1 },
      { date: '2026-07-16', volume: 1 }
    ],
    pnlSeries: [
      { date: '2026-07-15', pnl: -220 },
      { date: '2026-07-16', pnl: 950 }
    ],
    recentActivity: [
      { id: 'act-1', type: 'SIGNUP', user: 'Jane Doe', timestamp: '2026-07-16T10:00:00Z' },
      { id: 'act-2', type: 'TRADE', user: 'Jane Doe', symbol: 'SBIN', pnl: 1000, timestamp: '2026-07-16T09:45:00Z' }
    ]
  });
});

// 2. User Management
app.get('/api/admin/users', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '10');
  const search = req.query.search as string || '';
  const role = req.query.role as string || '';

  if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
    res.status(400).json({ error: 'Invalid page or limit parameters' });
    return;
  }

  let filteredUsers = [...users];

  if (search) {
    const s = search.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      (u.fullName || '').toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s)
    );
  }

  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }

  const total = filteredUsers.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);

  const mapped = paginatedUsers.map(u => {
    const userTrades = trades.filter(t => t.userId === u.id);
    const netPnl = userTrades.reduce((sum, t) => sum + parseFloat(t.netPnl || '0'), 0);
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      totalTrades: userTrades.length,
      netPnl,
      isSuspended: u.isSuspended
    };
  });

  res.json({
    users: mapped,
    total,
    pages
  });
});

app.get('/api/admin/users/:id', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const id = req.params.id;
  const user = users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const userTrades = trades.filter(t => t.userId === id);
  const connections = brokerConnections.filter(bc => bc.userId === id);
  const insights = aiInsights.filter(ai => ai.userId === id);

  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    isSuspended: user.isSuspended,
    trades: userTrades,
    brokerConnections: connections,
    aiInsights: insights,
    strategies: []
  });
});

app.patch('/api/admin/users/:id/role', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const id = req.params.id;
  const { role } = req.body;

  if (!['USER', 'SUB_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  // Prevent demoting self
  if (id === req.userId) {
    res.status(400).json({ error: 'Cannot change your own role' });
    return;
  }

  const userIdx = users.findIndex(u => u.id === id);
  if (userIdx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  users[userIdx].role = role;
  logAdminAction(req.userEmail!, 'ROLE_CHANGE', 'USER', id, `Changed role of user ${users[userIdx].email} to ${role}`);

  res.json({
    success: true,
    user: { id: users[userIdx].id, role: users[userIdx].role }
  });
});

app.patch('/api/admin/users/:id/status', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const id = req.params.id;
  const { isSuspended } = req.body;

  if (typeof isSuspended !== 'boolean') {
    res.status(400).json({ error: 'isSuspended must be a boolean' });
    return;
  }

  const userIdx = users.findIndex(u => u.id === id);
  if (userIdx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  users[userIdx].isSuspended = isSuspended;
  logAdminAction(req.userEmail!, 'STATUS_CHANGE', 'USER', id, `${isSuspended ? 'Suspended' : 'Activated'} user ${users[userIdx].email}`);

  res.json({
    success: true,
    user: { id: users[userIdx].id, isSuspended: users[userIdx].isSuspended }
  });
});

app.delete('/api/admin/users/:id', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const id = req.params.id;
  const userIdx = users.findIndex(u => u.id === id);
  if (userIdx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const deletedUser = users[userIdx];
  users.splice(userIdx, 1);

  // Cascading deletes
  trades = trades.filter(t => t.userId !== id);
  brokerConnections = brokerConnections.filter(bc => bc.userId !== id);
  aiInsights = aiInsights.filter(ai => ai.userId !== id);
  coachMemories = coachMemories.filter(cm => cm.userId !== id);

  logAdminAction(req.userEmail!, 'USER_DELETE', 'USER', id, `Deleted user ${deletedUser.email}`);

  res.json({ success: true });
});

// 3. Trade Monitoring
app.get('/api/admin/trades', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '10');
  const userFilter = req.query.user as string || '';
  const startDate = req.query.startDate as string || '';
  const endDate = req.query.endDate as string || '';
  const market = req.query.market as string || '';
  const instrumentType = req.query.instrumentType as string || '';
  const symbol = req.query.symbol as string || '';
  const status = req.query.status as string || '';
  const pnlMin = parseFloat(req.query.pnlMin as string || '-Infinity');
  const pnlMax = parseFloat(req.query.pnlMax as string || 'Infinity');

  if (pnlMin > pnlMax) {
    res.status(400).json({ error: 'pnlMin cannot be greater than pnlMax' });
    return;
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    res.status(400).json({ error: 'Invalid startDate format' });
    return;
  }

  let filteredTrades = [...trades];

  if (userFilter) {
    filteredTrades = filteredTrades.filter(t => t.userId === userFilter);
  }
  if (startDate) {
    filteredTrades = filteredTrades.filter(t => new Date(t.date) >= new Date(startDate));
  }
  if (endDate) {
    filteredTrades = filteredTrades.filter(t => new Date(t.date) <= new Date(endDate));
  }
  if (market) {
    filteredTrades = filteredTrades.filter(t => t.market === market);
  }
  if (instrumentType) {
    filteredTrades = filteredTrades.filter(t => t.instrumentType === instrumentType);
  }
  if (symbol) {
    filteredTrades = filteredTrades.filter(t => t.symbol === symbol);
  }
  if (status) {
    filteredTrades = filteredTrades.filter(t => t.status === status);
  }
  if (!isNaN(pnlMin)) {
    filteredTrades = filteredTrades.filter(t => parseFloat(t.netPnl || '0') >= pnlMin);
  }
  if (!isNaN(pnlMax)) {
    filteredTrades = filteredTrades.filter(t => parseFloat(t.netPnl || '0') <= pnlMax);
  }

  const total = filteredTrades.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + limit);

  // Compute aggregate stats
  const totalTrades = filteredTrades.length;
  const wins = filteredTrades.filter(t => t.status === 'WIN').length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const netPnl = filteredTrades.reduce((sum, t) => sum + parseFloat(t.netPnl || '0'), 0);
  const avgPnl = totalTrades > 0 ? netPnl / totalTrades : 0;
  const totalVolume = filteredTrades.reduce((sum, t) => sum + parseInt(t.quantity || '0'), 0);

  // Markets
  const marketDistributionMap = filteredTrades.reduce((acc: any, t) => {
    acc[t.market] = (acc[t.market] || 0) + 1;
    return acc;
  }, {});
  const marketDistribution = Object.keys(marketDistributionMap).map(k => ({ market: k, count: marketDistributionMap[k] }));

  // Instruments
  const instMap = filteredTrades.reduce((acc: any, t) => {
    acc[t.instrumentType] = (acc[t.instrumentType] || 0) + 1;
    return acc;
  }, {});
  const instrumentDistribution = Object.keys(instMap).map(k => ({ type: k, count: instMap[k] }));

  const mappedTrades = paginatedTrades.map(t => {
    const user = users.find(u => u.id === t.userId);
    return {
      id: t.id,
      userId: t.userId,
      userEmail: user ? user.email : 'unknown@example.com',
      symbol: t.symbol,
      market: t.market,
      instrumentType: t.instrumentType,
      direction: t.direction,
      pnl: parseFloat(t.pnl || '0'),
      charges: parseFloat(t.charges || '0'),
      netPnl: parseFloat(t.netPnl || '0'),
      status: t.status,
      date: t.date
    };
  });

  res.json({
    trades: mappedTrades,
    stats: { totalTrades, winRate, netPnl, avgPnl, totalVolume },
    marketDistribution,
    instrumentDistribution,
    pnlHistogram: [{ range: '0-1000', count: wins }],
    total,
    pages
  });
});

// 4. Broker Connection Management
app.get('/api/admin/brokers', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const mapped = brokerConnections.map(bc => ({
    id: bc.id,
    userEmail: bc.userEmail,
    broker: bc.broker,
    isActive: bc.isActive,
    lastSyncedAt: bc.lastSyncedAt,
    syncHealth: bc.syncHealth
  }));

  const total = brokerConnections.length;
  const activeCount = brokerConnections.filter(bc => bc.isActive).length;
  const activePercent = total > 0 ? (activeCount / total) * 100 : 0;
  const lastSyncFailures = brokerConnections.filter(bc => bc.syncHealth === 'ERROR').length;

  res.json({
    connections: mapped,
    stats: { total, activePercent, lastSyncFailures }
  });
});

// POST /api/admin/brokers/:id/sync (trigger sync for connection)
const syncInProgress = new Map<string, boolean>();

app.post('/api/admin/brokers/:id/sync', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params.id;
  const conn = brokerConnections.find(bc => bc.id === id);
  if (!conn) {
    res.status(404).json({ error: 'Broker connection not found' });
    return;
  }

  // settings block
  const enableSyncSetting = systemSettings.find(s => s.key === 'enable_broker_sync');
  if (!enableSyncSetting || enableSyncSetting.value === 'false') {
    res.status(403).json({ error: 'Broker sync is disabled by Admin' });
    return;
  }

  // Check suspension of owner
  const owner = users.find(u => u.id === conn.userId);
  if (owner && owner.isSuspended) {
    res.status(403).json({ error: 'Cannot sync for a suspended user' });
    return;
  }

  if (!conn.isActive) {
    res.status(400).json({ error: 'Connection is inactive' });
    return;
  }

  if (!conn.apiKey) {
    res.status(400).json({ error: 'API Key missing for broker' });
    return;
  }

  // Sync Lock
  if (syncInProgress.get(id)) {
    res.json({ success: true, count: 0, alreadySyncing: true });
    return;
  }

  syncInProgress.set(id, true);

  try {
    // Introduce async delay so that concurrent requests overlap
    await new Promise(resolve => setTimeout(resolve, 50));
    // Simulate trade sync
    const simulatedTrade: Trade = {
      id: `t-sync-${Math.random().toString(36).substr(2, 9)}`,
      userId: conn.userId,
      broker: conn.broker,
      date: new Date().toISOString(),
      symbol: 'INFY',
      market: 'NSE',
      instrumentType: 'EQ',
      direction: 'LONG',
      entryPrice: '1400',
      exitPrice: '1415',
      quantity: '20',
      pnl: '300',
      charges: '15',
      netPnl: '285',
      status: 'WIN',
      tags: ['sync'],
      source: 'broker_sync',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    trades.push(simulatedTrade);

    conn.lastSyncedAt = new Date().toISOString();
    conn.syncHealth = 'SUCCESS';

    logAdminAction(req.userEmail!, 'MANUAL_SYNC', 'BROKER_CONNECTION', id, `Triggered manual sync for connection ${id} (${conn.userEmail})`);

    res.json({ success: true, syncedCount: 1 });
  } finally {
    syncInProgress.delete(id);
  }
});

app.get('/api/admin/brokers/:id/logs', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const id = req.params.id;
  const conn = brokerConnections.find(bc => bc.id === id);
  if (!conn) {
    res.status(404).json({ error: 'Broker connection not found' });
    return;
  }

  // return dummy logs
  res.json([
    { timestamp: new Date().toISOString(), event: 'SYNC_STARTED', error: null },
    { timestamp: new Date().toISOString(), event: 'SYNC_SUCCESS', error: null }
  ]);
});

// 5. AI Coach & Insights Monitoring
app.get('/api/admin/ai', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const totalInsights = aiInsights.length;

  const insightsPerUser = aiInsights.reduce((acc: any, ai) => {
    acc[ai.userEmail] = (acc[ai.userEmail] || 0) + 1;
    return acc;
  }, {});
  const insightsPerUserArr = Object.keys(insightsPerUser).map(email => ({ userEmail: email, count: insightsPerUser[email] }));

  const breakdownMap = aiInsights.reduce((acc: any, ai) => {
    const type = ai.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const insightTypeBreakdown = Object.keys(breakdownMap).map(type => ({ type, count: breakdownMap[type] }));

  res.json({
    totalInsights,
    recentAnalysisRuns: aiInsights.map(ai => ({
      id: ai.id,
      userEmail: ai.userEmail,
      type: ai.type,
      createdAt: ai.createdAt
    })),
    insightsPerUser: insightsPerUserArr,
    insightTypeBreakdown,
    usageTimeline: [
      { date: '2026-07-16', count: totalInsights }
    ]
  });
});

// 6. Audit Logs
app.get('/api/admin/audit', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '10');
  const action = req.query.action as string || '';
  const search = req.query.search as string || '';
  const startDate = req.query.startDate as string || '';
  const endDate = req.query.endDate as string || '';

  if (startDate && isNaN(Date.parse(startDate))) {
    res.status(400).json({ error: 'Invalid startDate format' });
    return;
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    res.status(400).json({ error: 'startDate cannot be greater than endDate' });
    return;
  }

  let filtered = [...auditLogs];

  if (action) {
    filtered = filtered.filter(l => l.action === action);
  }

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(l => 
      l.details.toLowerCase().includes(s) || 
      l.adminEmail.toLowerCase().includes(s)
    );
  }

  if (startDate) {
    filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(endDate));
  }

  // Sort by timestamp desc
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = filtered.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  res.json({
    logs: paginated,
    total,
    pages
  });
});

// 7. System Settings & Feature Management
app.get('/api/admin/settings', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  res.json({ settings: systemSettings });
});

app.post('/api/admin/settings', authenticate, requireRoles(['SUPER_ADMIN']), (req: AuthRequest, res: Response): void => {
  const { key, value } = req.body;

  if (!key || value === undefined) {
    res.status(400).json({ error: 'Key and Value are required' });
    return;
  }

  const validKeys = ['enable_ai_coach', 'enable_broker_sync', 'maintenance_mode', 'system_announcement'];
  if (!validKeys.includes(key)) {
    res.status(400).json({ error: 'Invalid settings key' });
    return;
  }

  if (key === 'system_announcement' && String(value).length > 2000) {
    res.status(400).json({ error: 'system_announcement must be 2000 characters or less' });
    return;
  }

  const settingIdx = systemSettings.findIndex(s => s.key === key);
  if (settingIdx !== -1) {
    systemSettings[settingIdx].value = String(value);
  } else {
    systemSettings.push({ key, value: String(value) });
  }

  logAdminAction(req.userEmail!, 'SETTING_CHANGE', 'SYSTEM_SETTING', key, `Changed system setting ${key} to ${value}`);

  res.json({ success: true });
});

// Start Server helper
async function start() {
  await seedData();
  app.listen(PORT, () => {
    console.log(`[Mock Server] Stateful Mock API Server running on http://localhost:${PORT}`);
  });
}

if (isDirectRun) {
  start();
}

export { app, seedData, users, trades, brokerConnections, aiInsights, coachMemories, auditLogs, systemSettings };
