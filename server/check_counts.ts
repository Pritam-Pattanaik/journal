import { prisma } from './src/db';
async function run() {
  const allTrades = await prisma.trade.findMany();
  console.log('Total trades in DB:', allTrades.length);
  process.exit(0);
}
run();
