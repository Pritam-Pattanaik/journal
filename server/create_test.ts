import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const t = {
    userId: '8114be0c-5cc9-411a-abcf-4dcfda50a582', // use the user id from env or random uuid
    broker: 'dhan',
    brokerTradeId: 'test_123',
    date: new Date(),
    symbol: 'AAPL',
    market: 'NSE',
    instrumentType: 'EQ',
    direction: 'LONG',
    entryPrice: 100,
    exitPrice: 110,
    quantity: 10,
    currentQty: 0,
    exitQty: 10,
    realizedPnl: 100,
    charges: 5,
    netPnl: 95,
    status: 'WIN',
    disciplineScore: 3,
    disciplineRawScore: 2.5,
    confidence: 40,
    tradingStyle: 'Unknown',
    behaviourProfile: { holdDurationMins: 0, quantity: 10, pnl: 95 },
    disciplineBreakdown: { hold: -0.5, size: 0, sequence: 0, pnl: 0, timing: 0 },
    disciplineReasons: ['Test reason'],
    disciplineVersion: 1,
    source: 'broker_sync'
  };
  
  // get a real user id
  const user = await prisma.user.findFirst();
  if (user) {
    t.userId = user.id;
  }
  
  await prisma.trade.create({
    data: t
  });
  
  const fetched = await prisma.trade.findFirst({ where: { brokerTradeId: 'test_123' }});
  console.log('Fetched trade:', JSON.stringify(fetched, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
