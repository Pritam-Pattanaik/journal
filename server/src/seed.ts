import { prisma } from './db';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  console.log('🌱 Starting database seed...');
  
  // 1. Find the test user
  const user = await prisma.user.findUnique({
    where: { email: 'test@tradevault.com' },
  });

  if (!user) {
    console.error('❌ Test user not found. Please sign up with test@tradevault.com first.');
    process.exit(1);
  }
  
  const userId = user.id;
  console.log(`👤 Found user: ${user.fullName} (${userId})`);

  // Clear existing data for this user for a clean slate
  await prisma.trade.deleteMany({ where: { userId } });
  await prisma.strategy.deleteMany({ where: { userId } });
  await prisma.journalEntry.deleteMany({ where: { userId } });

  // 2. Insert Strategies
  console.log('📈 Inserting strategies...');
  const strat1 = await prisma.strategy.create({
    data: {
      userId,
      name: 'Opening Range Breakout',
      description: 'Taking breakouts of the first 15m range.',
      rules: 'Wait for 15m candle close, enter on break of high/low with SL below/above the breakout candle.',
      market: ['NSE', 'F&O'],
      timeframe: '15m',
      isActive: true,
    },
  });
  const strat2 = await prisma.strategy.create({
    data: {
      userId,
      name: 'Moving Average Pullback',
      description: 'Buying the dip in an uptrend at the 20 EMA.',
      rules: 'Price must be above 50 EMA. Wait for pullback to 20 EMA and a bullish reversal candle.',
      market: ['Crypto', 'NSE'],
      timeframe: '1H',
      isActive: true,
    },
  });

  // 3. Insert Trades
  console.log('📊 Inserting trades...');
  const now = new Date();
  
  await prisma.trade.createMany({
    data: [
      {
        userId,
        date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
        symbol: 'NIFTY',
        market: 'F&O',
        instrumentType: 'CE',
        direction: 'LONG',
        entryPrice: 22400,
        exitPrice: 22550,
        quantity: 100,
        pnl: 15000,
        charges: 400,
        netPnl: 14600,
        status: 'WIN',
        strategyId: strat1.id,
        setupDescription: 'Perfect ORB setup. Price consolidated for 10 mins near VWAP before breaking out.',
        mindset: 'Felt confident, waited for the 15m candle to close before entry.',
        decisionNotes: 'Good volume on breakout. Trailed stop loss to break-even after 50 points.',
        learnings: 'Patience pays off. Holding for the target was the right move.',
        disciplineScore: 5,
        source: 'manual',
        broker: 'manual',
      },
      {
        userId,
        date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        symbol: 'BANKNIFTY',
        market: 'F&O',
        instrumentType: 'PE',
        direction: 'SHORT',
        entryPrice: 48000,
        exitPrice: 48150,
        quantity: 50,
        pnl: -7500,
        charges: 300,
        netPnl: -7800,
        status: 'LOSS',
        strategyId: strat1.id,
        setupDescription: 'Fake breakdown below support. Entered prematurely.',
        mindset: 'A bit of FOMO. Saw a large red candle and jumped in before close.',
        decisionNotes: 'Didn\'t wait for candle close. Price reversed immediately and hit SL.',
        learnings: 'MUST wait for candle close on the 15m timeframe. Stop front-running signals.',
        disciplineScore: 2,
        source: 'manual',
        broker: 'manual',
      },
      {
        userId,
        date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
        symbol: 'RELIANCE',
        market: 'NSE',
        instrumentType: 'EQ',
        direction: 'LONG',
        entryPrice: 2950,
        exitPrice: 2985,
        quantity: 200,
        pnl: 7000,
        charges: 150,
        netPnl: 6850,
        status: 'WIN',
        strategyId: strat2.id,
        setupDescription: 'Pulled back to 1H 20EMA. Formed a hammer candle.',
        mindset: 'Calm and collected. Pre-planned this level the night before.',
        decisionNotes: 'Entered on the break of the hammer high. Set target at recent swing high.',
        learnings: 'Pre-planning trades significantly reduces anxiety during execution.',
        disciplineScore: 4,
        source: 'manual',
        broker: 'manual',
      },
      {
        userId,
        date: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
        symbol: 'BTCUSDT',
        market: 'Crypto',
        instrumentType: 'CRYPTO',
        direction: 'LONG',
        entryPrice: 65000,
        exitPrice: 65050,
        quantity: 1,
        pnl: 50,
        charges: 15,
        netPnl: 35,
        status: 'BREAKEVEN',
        strategyId: strat2.id,
        setupDescription: 'Scalp attempt at minor support level.',
        mindset: 'Bored, wanted to be in the market. Not a high conviction setup.',
        decisionNotes: 'Price wasn\'t moving, decided to cut the trade early rather than hold.',
        learnings: 'Don\'t trade out of boredom. Cash is a position.',
        disciplineScore: 3,
        source: 'manual',
        broker: 'manual',
      },
    ],
  });

  // 4. Insert Journal Entries
  console.log('📓 Inserting journal entries...');
  await prisma.journalEntry.createMany({
    data: [
      {
        userId,
        date: new Date(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0]),
        marketBias: 'bullish',
        reflection: 'Excellent day of trading. Followed my plan strictly and it showed in the results. I need to remember this feeling of calm execution.',
        whatWentWell: 'Waited for confirmation. Trailed stops properly.',
        whatToImprove: 'Could have sized up slightly given the A+ setup.',
      },
      {
        userId,
        date: new Date(new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0]),
        marketBias: 'bearish',
        reflection: 'Let FOMO get the better of me today. Took a sub-par setup because I felt I was missing out on the morning move.',
        whatWentWell: 'Respected my hard stop loss, preventing a bigger disaster.',
        whatToImprove: 'Wait for the candle to close. Walk away from the screen if feeling FOMO.',
      },
    ],
  });

  console.log('✅ Database seeded successfully with demo data!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
