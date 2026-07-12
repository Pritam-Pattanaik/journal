import { prisma } from './src/db';

async function main() {
  const result = await prisma.trade.groupBy({
    by: ['status'],
    _count: { status: true },
  });
  
  console.log('Statuses in DB:', result.map(r => ({ status: r.status, count: r._count.status })));
  process.exit(0);
}

main();
