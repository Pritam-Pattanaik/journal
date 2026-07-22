import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.trade.updateMany({
    data: { disciplineScore: null }
  });
  console.log(`Successfully cleared legacy discipline scores for ${result.count} trades.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
