import { db } from './src/db';
import { trades } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.select({
    market: trades.market,
    count: sql<number>`count(*)`,
  }).from(trades).groupBy(trades.market);
  
  console.log('Markets in DB:', result);
  process.exit(0);
}

main();
