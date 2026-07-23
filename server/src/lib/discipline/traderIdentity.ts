import { TradeSummary, TraderProfile, TradingStyle } from './types';

const ALPHA = 0.1; // EWMA smoothing factor

export function detectTradingStyle(ewmaHoldMins: number): TradingStyle {
  if (ewmaHoldMins < 10) return 'Scalper';
  if (ewmaHoldMins < 60) return 'Momentum';
  if (ewmaHoldMins < 360) return 'Intraday';
  if (ewmaHoldMins < 1440) return 'Swing';
  return 'Positional';
}

export function buildTraderProfile(historicalTrades: TradeSummary[]): TraderProfile {
  const profile: TraderProfile = {
    tradeCount: 0,
    ewmaHoldDurationMins: 0,
    ewmaPositionSize: 0,
    ewmaLossSize: 0,
    ewmaWinSize: 0,
    ewmaTimeBetweenTradesMins: 0,
    dominantInstrument: 'EQ',
    tradingStyle: 'Unknown',
  };

  const instrumentCounts: Record<string, number> = {};
  
  if (!historicalTrades || historicalTrades.length === 0) return profile;

  // Ensure sorted by entry time
  const sorted = [...historicalTrades].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());

  let lastTradeExit: Date | null = null;

  for (const trade of sorted) {
    if (trade.status === 'OPEN') continue;

    const holdMins = Math.max(0, (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000);
    const qty = trade.quantity;
    
    instrumentCounts[trade.instrumentType] = (instrumentCounts[trade.instrumentType] || 0) + 1;

    if (profile.tradeCount === 0) {
      profile.ewmaHoldDurationMins = holdMins;
      profile.ewmaPositionSize = qty;
      if (trade.netPnl < 0) profile.ewmaLossSize = Math.abs(trade.netPnl);
      else if (trade.netPnl > 0) profile.ewmaWinSize = trade.netPnl;
    } else {
      profile.ewmaHoldDurationMins = (ALPHA * holdMins) + ((1 - ALPHA) * profile.ewmaHoldDurationMins);
      profile.ewmaPositionSize = (ALPHA * qty) + ((1 - ALPHA) * profile.ewmaPositionSize);
      
      if (trade.netPnl < 0) {
        const loss = Math.abs(trade.netPnl);
        profile.ewmaLossSize = profile.ewmaLossSize === 0 ? loss : (ALPHA * loss) + ((1 - ALPHA) * profile.ewmaLossSize);
      } else if (trade.netPnl > 0) {
        profile.ewmaWinSize = profile.ewmaWinSize === 0 ? trade.netPnl : (ALPHA * trade.netPnl) + ((1 - ALPHA) * profile.ewmaWinSize);
      }
      
      if (lastTradeExit) {
        const gapMins = Math.max(0, (trade.entryTime.getTime() - lastTradeExit.getTime()) / 60000);
        profile.ewmaTimeBetweenTradesMins = profile.ewmaTimeBetweenTradesMins === 0 ? gapMins : (ALPHA * gapMins) + ((1 - ALPHA) * profile.ewmaTimeBetweenTradesMins);
      }
    }

    lastTradeExit = trade.exitTime;
    profile.tradeCount++;
  }

  let topInst = 'EQ';
  let topCount = 0;
  for (const [inst, count] of Object.entries(instrumentCounts)) {
    if (count > topCount) {
      topCount = count;
      topInst = inst;
    }
  }
  profile.dominantInstrument = topInst;
  profile.tradingStyle = profile.tradeCount > 0 ? detectTradingStyle(profile.ewmaHoldDurationMins) : 'Unknown';

  return profile;
}
