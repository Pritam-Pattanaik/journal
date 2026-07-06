import { db } from './src/db';
import { trades } from './src/db/schema';
async function run() {
  const allTrades = await db.select().from(trades);
  console.log('Total trades in DB:', allTrades.length);
  process.exit(0);
}
run();
