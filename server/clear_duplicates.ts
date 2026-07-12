import { prisma } from './src/db';

async function main() {
  console.log('Resetting broker connections lastSyncedAt to null...');
  await prisma.brokerConnection.updateMany({
    data: { lastSyncedAt: null },
  });
  
  console.log('Deleting duplicate broker_sync trades...');
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
