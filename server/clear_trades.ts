import { prisma } from './src/db';

async function main() {
  console.log('Deleting existing broker_sync trades...');
  await prisma.trade.deleteMany({
    where: { source: 'broker_sync' },
  });
  console.log('Deleted successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
