import { detectTradingStyle, buildTraderProfile } from './traderIdentity';
import { extractBehaviour } from './behaviorExtractor';
import { evaluateContext } from './contextEngine';
import { calculateConfidence } from './confidenceEngine';
import { TradeSummary } from './types';

// Mock function to generate N baseline trades
function generateBaselineTrades(count: number, avgHoldMins: number, avgSize: number, avgWin: number, avgLoss: number): TradeSummary[] {
  const trades: TradeSummary[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const isWin = i % 2 === 0;
    const entry = new Date(now.getTime() - (count - i) * 86400000); // 1 per day to avoid sequence overlaps in baseline
    const exit = new Date(entry.getTime() + avgHoldMins * 60000);
    trades.push({
      id: `baseline-${i}`,
      date: entry,
      entryTime: entry,
      exitTime: exit,
      quantity: avgSize,
      netPnl: isWin ? avgWin : -avgLoss,
      status: isWin ? 'WIN' : 'LOSS',
      instrumentType: 'EQ',
      market: 'NSE'
    });
  }
  return trades;
}

function runScenario(name: string, baselineTrades: TradeSummary[], testTrade: TradeSummary, tradesToday: TradeSummary[]) {
  console.log(`\n=== SCENARIO: ${name} ===`);
  const profile = buildTraderProfile(baselineTrades);
  const confidence = calculateConfidence(profile.tradeCount);
  const behavior = extractBehaviour(testTrade, tradesToday);
  const result = evaluateContext(testTrade.status, behavior, profile, confidence);
  
  console.log(`Style: ${profile.tradingStyle} (Baseline Hold: ${profile.ewmaHoldDurationMins.toFixed(1)}m)`);
  console.log(`Trade Hold: ${behavior.holdDurationMins.toFixed(1)}m | Qty: ${behavior.quantity} (Avg: ${profile.ewmaPositionSize.toFixed(1)})`);
  console.log(`Confidence: ${result.confidence.toFixed(1)}%`);
  console.log(`Score: ${result.rawScore} / 5  -> Final: ${result.score}`);
  console.log(`Reasons:\n  ${result.reasons.join('\n  ')}`);
  console.log(`-----------------------------------`);
}

function runAllScenarios() {
  const now = new Date();
  
  // 1. Professional Scalper with 2-min trade
  const scalperBaseline = generateBaselineTrades(150, 2, 100, 500, 300);
  const scalpEntry = new Date(now.getTime());
  runScenario('Professional Scalper (2 min hold)', scalperBaseline, {
    date: scalpEntry, entryTime: scalpEntry, exitTime: new Date(scalpEntry.getTime() + 1.5 * 60000),
    quantity: 105, netPnl: 450, status: 'WIN', instrumentType: 'EQ', market: 'NSE'
  }, []);

  // 2. Intraday trader with 2-minute panic exit
  const intradayBaseline = generateBaselineTrades(150, 45, 100, 1500, 1000);
  runScenario('Intraday Trader (2 min panic exit)', intradayBaseline, {
    date: scalpEntry, entryTime: scalpEntry, exitTime: new Date(scalpEntry.getTime() + 2 * 60000),
    quantity: 100, netPnl: -800, status: 'LOSS', instrumentType: 'EQ', market: 'NSE'
  }, []);

  // 3. Revenge trading after loss
  const lossTrade: TradeSummary = { date: new Date(now.getTime() - 5*60000), entryTime: new Date(now.getTime() - 10*60000), exitTime: new Date(now.getTime() - 5*60000), quantity: 100, netPnl: -1200, status: 'LOSS', instrumentType: 'EQ', market: 'NSE' };
  runScenario('Revenge Trading', intradayBaseline, {
    date: now, entryTime: now, exitTime: new Date(now.getTime() + 10 * 60000),
    quantity: 100, netPnl: -500, status: 'LOSS', instrumentType: 'EQ', market: 'NSE'
  }, [lossTrade, { ...lossTrade, entryTime: now }]); // Mock tradesToday so index > 0

  // 4. Oversized position
  runScenario('Oversized Position', intradayBaseline, {
    date: now, entryTime: now, exitTime: new Date(now.getTime() + 40 * 60000),
    quantity: 300, netPnl: -2000, status: 'LOSS', instrumentType: 'EQ', market: 'NSE'
  }, []);

  // 10. Beginner with only 10 trades
  const beginnerBaseline = generateBaselineTrades(10, 30, 50, 200, 150);
  runScenario('Beginner (10 trades, low confidence)', beginnerBaseline, {
    date: now, entryTime: now, exitTime: new Date(now.getTime() + 25 * 60000),
    quantity: 50, netPnl: 180, status: 'WIN', instrumentType: 'EQ', market: 'NSE'
  }, []);
}

runAllScenarios();
