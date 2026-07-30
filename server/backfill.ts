import { PrismaClient, Prisma } from '@prisma/client';
import { assignDisciplineScores } from './src/lib/discipline/disciplineEngine.js';

const prisma = new PrismaClient();

async function backfill() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    const trades = await prisma.trade.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' }
    });
    
    if (trades.length === 0) continue;
    
    // Assign scores
    assignDisciplineScores(trades);
    
    // Update DB
    for (const t of trades) {
      await prisma.trade.update({
        where: { id: t.id },
        data: {
          disciplineScore: t.disciplineScore ?? null,
          disciplineRawScore: t.disciplineRawScore ?? null,
          confidence: t.confidence ?? null,
          tradingStyle: t.tradingStyle ?? null,
          behaviourProfile: t.behaviourProfile ? t.behaviourProfile as Prisma.InputJsonValue : Prisma.DbNull,
          disciplineBreakdown: t.disciplineBreakdown ? t.disciplineBreakdown as Prisma.InputJsonValue : Prisma.DbNull,
          disciplineReasons: t.disciplineReasons ? t.disciplineReasons as Prisma.InputJsonValue : Prisma.DbNull,
          disciplineVersion: t.disciplineVersion ?? 1,
        }
      });
    }
    console.log(`Backfilled ${trades.length} trades for user ${user.id}`);
  }
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
