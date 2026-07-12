import { prisma } from './src/db';

async function main() {
  const result = await prisma.trade.groupBy({
    by: ['market'],
    _count: { market: true },
  });
  
  console.log('Markets in DB:', result.map(r => ({ market: r.market, count: r._count.market })));
  process.exit(0);
}

main();
