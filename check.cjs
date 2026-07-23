const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const trades = await prisma.trade.findMany({ take: 5, orderBy: { date: 'desc' } });
  console.log(JSON.stringify(trades.map(t => ({
    id: t.id,
    symbol: t.symbol,
    score: t.disciplineScore,
    raw: t.disciplineRawScore,
    conf: t.confidence
  })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
