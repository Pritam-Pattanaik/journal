import { db } from './src/db';
import { trades } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Deleting existing broker_sync trades...');
  const res = await db.delete(trades).where(eq(trades.source, 'broker_sync'));
  console.log('Deleted successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
