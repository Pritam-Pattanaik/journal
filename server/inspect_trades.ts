import { prisma } from './src/db';

async function main() {
  console.log('Fetching existing trades...');
  const allTrades = await prisma.trade.findMany();
  console.log('Trades in DB:', allTrades.length);
  for (const t of allTrades) {
    console.log(`- [${t.source}] ${t.symbol} (status: ${t.status}, qty: ${t.quantity}, netPnl: ${t.netPnl})`);
  }
  process.exit(0);
}

main().catch(console.error);
