import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { syncDhanTrades } from '../lib/brokers/dhan';
import { lockService } from '../services/lockService';
import { createNotification } from '../services/notificationService';

const router = Router();

// GET /api/brokers
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
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

// POST /api/brokers
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
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

// DELETE /api/brokers/:broker
router.delete('/:broker', authenticate, async (req: AuthRequest, res: Response) => {
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

// PATCH /api/brokers/:broker/token
router.patch('/:broker/token', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
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

// POST /api/brokers/sync/:broker
router.post('/sync/:broker', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  const broker = String(req.params.broker);
  const lockKey = `${req.userId!}:${broker}`;

  const acquired = await lockService.acquireSyncLock(lockKey);
  if (!acquired) {
    return res.json({ success: true, count: 0, alreadySyncing: true });
  }

  // Create "Sync Started" Notification
  await createNotification({
    userId: req.userId!,
    title: 'Trade Sync Started',
    description: `Synchronizing trades from ${broker.toUpperCase()}`,
    category: 'Trading',
    priority: 'Information',
  });

  try {
    const forceFullSync = req.query.full === 'true';

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

      const lastSyncedAt = (!forceFullSync && conn.lastSyncedAt) ? new Date(conn.lastSyncedAt) : null;
      const result = await syncDhanTrades(clientId || '', apiKey, req.userId!, [], lastSyncedAt, personalRules);

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
      } else {
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
        const { syncAngelOneTrades } = await import('../lib/brokers/angelone');
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
            await createNotification({
              userId: req.userId!,
              title: 'Broker Token Expired',
              description: `Angel One requires re-authentication. Update your broker settings.`,
              category: 'Trading',
              priority: 'Warning',
              actionLabel: 'Reconnect',
              actionUrl: '/app/settings'
            });
            return res.status(400).json({ error: 'Angel One requires Password and TOTP Secret for auto-login. Please update your broker settings.' });
          }
          const { loginAngelOne } = await import('../lib/brokers/angelone');
          const tokens = await loginAngelOne(clientId || '', metadata.password, metadata.totpSecret, apiKey);
          accessToken = tokens.jwtToken;

          await prisma.brokerConnection.update({
            where: { id: conn.id },
            data: { accessToken: tokens.jwtToken, refreshToken: tokens.refreshToken },
          });

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

      // Generate Risk Notifications for any violations
      for (const t of tradesToInsert) {
        if (t._ruleViolations && t._ruleViolations.length > 0) {
          for (const violation of t._ruleViolations) {
            await createNotification({
              userId: req.userId!,
              title: 'Risk Limit Exceeded',
              description: `${t.symbol}: ${violation}`,
              category: 'Risk',
              priority: 'Critical',
              actionLabel: 'Review Rules',
              actionUrl: '/app/settings'
            });
          }
        }
      }
    }

    if (tradesToUpdate.length > 0) {
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

    const totalSynced = tradesToInsert.length + tradesToUpdate.length;
    await createNotification({
      userId: req.userId!,
      title: 'Trade Sync Completed',
      description: `Successfully synced ${totalSynced} trades from ${broker.toUpperCase()}.`,
      category: 'Trading',
      priority: 'Success',
      actionLabel: 'View Trades',
      actionUrl: '/app/journal'
    });

    res.json({ success: true, count: totalSynced });
  } catch (err: any) {
    console.error('Sync Error:', err);
    await createNotification({
      userId: req.userId!,
      title: 'Trade Sync Failed',
      description: `Failed to sync trades from ${broker.toUpperCase()}: ${err.message}`,
      category: 'Trading',
      priority: 'Critical',
      actionLabel: 'Retry Sync'
    });
    res.status(500).json({ error: err.message || 'Failed to sync trades' });
  } finally {
    await lockService.releaseSyncLock(lockKey);
  }
});

export default router;
