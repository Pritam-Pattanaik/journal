import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const trades = await prisma.trade.findMany({
    take: 5,
    orderBy: { date: 'desc' },
  });
  console.log(JSON.stringify(trades, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
