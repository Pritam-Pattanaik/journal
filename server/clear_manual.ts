import { prisma } from './src/db';

async function main() {
  console.log('Deleting manual trades...');
  await prisma.trade.deleteMany({
    where: { source: 'manual' },
  });
  console.log('Deleted successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
