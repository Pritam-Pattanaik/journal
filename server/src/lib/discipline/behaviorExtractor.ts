import { TradeSummary, BehaviourProfile } from './types';

export function extractBehaviour(
  trade: TradeSummary,
  allTradesToday: TradeSummary[]
): BehaviourProfile {
  const holdMins = Math.max(0, (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000);
  const entryMins = trade.entryTime.getHours() * 60 + trade.entryTime.getMinutes();

  // Determine time since last trade and consecutive losses
  const sortedToday = [...allTradesToday].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
  
  const tradeIndex = sortedToday.findIndex(
    t => Math.abs(t.entryTime.getTime() - trade.entryTime.getTime()) < 1000
  );

  let timeSinceLastTradeMins: number | null = null;
  let consecutiveLossesBefore = 0;

  if (tradeIndex > 0) {
    const prev = sortedToday[tradeIndex - 1];
    if (prev.exitTime) {
      timeSinceLastTradeMins = Math.max(0, (trade.entryTime.getTime() - prev.exitTime.getTime()) / 60000);
    }
    
    for (let i = tradeIndex - 1; i >= 0; i--) {
      if (sortedToday[i].status === 'LOSS') {
        consecutiveLossesBefore++;
      } else if (sortedToday[i].status === 'WIN') {
        break;
      }
    }
  }

  const isOpeningTrade = entryMins < (9 * 60 + 30);
  const isClosingTrade = entryMins >= (15 * 60);

  return {
    holdDurationMins: holdMins,
    timeSinceLastTradeMins,
    consecutiveLossesBefore,
    quantity: trade.quantity,
    pnl: trade.netPnl,
    isOpeningTrade,
    isClosingTrade
  };
}
