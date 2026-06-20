import { db } from './src/db';
import { trades } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Deleting manual trades...');
  const res = await db.delete(trades).where(eq(trades.source, 'manual'));
  console.log('Deleted successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
