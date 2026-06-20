import { db } from './src/db';
import { trades } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.select({
    status: trades.status,
    count: sql<number>`count(*)`,
  }).from(trades).groupBy(trades.status);
  
  console.log('Statuses in DB:', result);
  process.exit(0);
}

main();
