import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/users
router.get('/users', authenticate, requireRoles(['SUB_ADMIN', 'ADMIN', 'SUPER_ADMIN']), async (_req: AuthRequest, res: Response): Promise<void> => {
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
router.patch('/users/:id/role', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id as string;
    const { role } = req.body;

    if (!['USER', 'SUB_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

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

// GET /api/admin/stats
router.get('/stats', authenticate, requireRoles(['SUPER_ADMIN']), async (_req: AuthRequest, res: Response): Promise<void> => {
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

// GET /api/admin/stats/charts
router.get('/stats/charts', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
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
router.get('/stats/activity', authenticate, requireRoles(['SUPER_ADMIN']), async (_req: AuthRequest, res: Response): Promise<void> => {
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

// GET /api/admin/users/list
router.get('/users/list', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = req.query.search as string || '';
    const roleFilter = req.query.role as string || '';
    const sort = (req.query.sort as string) || 'created_at';
    const order = ((req.query.order as string) || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

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
router.get('/users/:id/detail', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
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

    const { ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.userId) {
      res.status(400).json({ error: 'Cannot delete yourself' });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (target.role === 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Cannot delete a Super Admin' });
      return;
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.userId!,
        action: 'DELETE_USER',
        targetType: 'user',
        targetId: req.params.id as string,
        details: JSON.stringify({ email: target.email, fullName: target.fullName }),
      }
    });

    await prisma.user.delete({ where: { id: req.params.id as string } });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/trades
router.get('/trades', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.userId) where.userId = req.query.userId as string;
    if (req.query.market) where.market = req.query.market as string;
    if (req.query.instrumentType) where.instrumentType = req.query.instrumentType as string;
    if (req.query.symbol) where.symbol = { contains: req.query.symbol as string, mode: 'insensitive' };
    if (req.query.status) where.status = req.query.status as string;

    if (req.query.startDate || req.query.endDate) {
      where.date = {};
      if (req.query.startDate) where.date.gte = new Date(req.query.startDate as string);
      if (req.query.endDate) where.date.lte = new Date(req.query.endDate as string);
    }

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

// GET /api/admin/brokers
router.get('/brokers', authenticate, requireRoles(['SUPER_ADMIN']), async (_req: AuthRequest, res: Response): Promise<void> => {
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

// GET /api/admin/ai-insights
router.get('/ai-insights', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
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

// GET /api/admin/audit-logs
router.get('/audit-logs', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
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

// GET /api/admin/settings
router.get('/settings', authenticate, requireRoles(['SUPER_ADMIN']), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    res.json({ settings });
  } catch (err: any) {
    console.error('Admin get settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/settings
router.patch('/settings', authenticate, requireRoles(['SUPER_ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
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

export default router;
