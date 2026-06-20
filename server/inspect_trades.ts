import { db } from './src/db';
import { trades } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Fetching existing trades...');
  const allTrades = await db.select().from(trades);
  console.log('Trades in DB:', allTrades.length);
  for (const t of allTrades) {
    console.log(`- [${t.source}] ${t.symbol} (status: ${t.status}, qty: ${t.quantity}, netPnl: ${t.netPnl})`);
  }
  process.exit(0);
}

main().catch(console.error);
