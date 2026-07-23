import { TradeSummary, PersonalRules } from './types';
import { SIGNAL_WEIGHTS } from './constants';

export function calculateEntryTiming(trade: TradeSummary): { score: number; reason?: string } {
  const entryMins = trade.entryTime.getHours() * 60 + trade.entryTime.getMinutes();
  if (entryMins < 9 * 60 + 30) {
    return { score: SIGNAL_WEIGHTS.ENTRY_TIMING.BEFORE_930, reason: "Entered during high-volatility opening (before 9:30 AM)" };
  }
  if (entryMins >= 15 * 60) {
    return { score: SIGNAL_WEIGHTS.ENTRY_TIMING.AFTER_1500, reason: "Entered in late-session chop (after 3:00 PM)" };
  }
  return { score: 0 };
}

export function calculateHoldTime(trade: TradeSummary): { score: number; reason?: string } {
  const holdMins = (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000;
  const isDerivative = trade.instrumentType !== 'EQ';

  if (isDerivative) {
    if (holdMins < SIGNAL_WEIGHTS.HOLD_TIME.DERIVATIVE_TOO_SHORT_MINS) {
      return { score: SIGNAL_WEIGHTS.HOLD_TIME.DERIVATIVE_TOO_SHORT_PENALTY, reason: `Impulsive exit (held derivative for < ${SIGNAL_WEIGHTS.HOLD_TIME.DERIVATIVE_TOO_SHORT_MINS} mins)` };
    }
    if (holdMins > SIGNAL_WEIGHTS.HOLD_TIME.DERIVATIVE_GOOD_HOLD_MINS) {
      return { score: SIGNAL_WEIGHTS.HOLD_TIME.DERIVATIVE_GOOD_HOLD_BONUS, reason: "Held trade long enough to avoid impulsive exit" };
    }
  } else {
    if (holdMins < SIGNAL_WEIGHTS.HOLD_TIME.EQ_TOO_SHORT_MINS) {
      return { score: SIGNAL_WEIGHTS.HOLD_TIME.EQ_TOO_SHORT_PENALTY, reason: `Impulsive exit (held equity for < ${SIGNAL_WEIGHTS.HOLD_TIME.EQ_TOO_SHORT_MINS} mins)` };
    }
    if (holdMins > SIGNAL_WEIGHTS.HOLD_TIME.EQ_GOOD_HOLD_MINS) {
      return { score: SIGNAL_WEIGHTS.HOLD_TIME.EQ_GOOD_HOLD_BONUS, reason: "Held equity position for sufficient duration" };
    }
  }
  return { score: 0 };
}

export function calculateSizing(trade: TradeSummary, historicalAvgQty: number): { score: number; reason?: string } {
  if (historicalAvgQty <= 0) return { score: 0 };
  
  const ratio = trade.quantity / historicalAvgQty;
  if (ratio > SIGNAL_WEIGHTS.SIZING.OVERSIZED_RATIO) {
    return { score: SIGNAL_WEIGHTS.SIZING.OVERSIZED_PENALTY, reason: "Oversized position relative to historical average" };
  }
  if (ratio < SIGNAL_WEIGHTS.SIZING.UNDERSIZED_RATIO) {
    return { score: SIGNAL_WEIGHTS.SIZING.UNDERSIZED_PENALTY, reason: "Undersized position, lacking conviction or deviating from plan" };
  }
  if (ratio >= SIGNAL_WEIGHTS.SIZING.CONSISTENT_MIN_RATIO && ratio <= SIGNAL_WEIGHTS.SIZING.CONSISTENT_MAX_RATIO) {
    return { score: SIGNAL_WEIGHTS.SIZING.CONSISTENT_BONUS, reason: "Maintained consistent position sizing" };
  }
  return { score: 0 };
}

export function calculateRevenge(trade: TradeSummary, sortedToday: TradeSummary[]): { score: number; reason?: string } {
  const tradeIndex = sortedToday.findIndex(t => Math.abs(t.entryTime.getTime() - trade.entryTime.getTime()) < 1000);
  if (tradeIndex > 0) {
    const prev = sortedToday[tradeIndex - 1];
    const gapMins = (trade.entryTime.getTime() - prev.exitTime.getTime()) / 60000;
    if (prev.status === 'LOSS' && gapMins >= 0 && gapMins < SIGNAL_WEIGHTS.REVENGE.MAX_GAP_MINS) {
      return { score: SIGNAL_WEIGHTS.REVENGE.PENALTY_PER_INSTANCE, reason: `Revenge trading detected (entered < ${SIGNAL_WEIGHTS.REVENGE.MAX_GAP_MINS} mins after a loss)` };
    }
  }
  return { score: 0 };
}

export function calculateConsistency(trade: TradeSummary, historicalAvgLoss: number, historicalAvgWin: number): { score: number; reason?: string } {
  if (trade.status === 'LOSS' && historicalAvgLoss > 0) {
    const lossRatio = Math.abs(trade.netPnl) / historicalAvgLoss;
    if (lossRatio > 2.0) {
      return { score: -1.0, reason: "Loss significantly larger than average" };
    }
    if (lossRatio < 0.8) {
      return { score: 0.5, reason: "Cut losses effectively, keeping them below average" };
    }
  }
  if (trade.status === 'WIN' && historicalAvgWin > 0) {
    const winRatio = trade.netPnl / historicalAvgWin;
    if (winRatio > 1.2) {
      return { score: 0.5, reason: "Maximized winning trade above average" };
    }
  }
  return { score: 0 };
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function calculatePersonalRules(trade: TradeSummary, sortedToday: TradeSummary[], rules: PersonalRules): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const entryMins = trade.entryTime.getHours() * 60 + trade.entryTime.getMinutes();
  const tradeIndex = sortedToday.findIndex(t => Math.abs(t.entryTime.getTime() - trade.entryTime.getTime()) < 1000);

  if (rules.windowStart && rules.windowEnd) {
    const start = timeToMins(rules.windowStart);
    const end = timeToMins(rules.windowEnd);
    if (entryMins < start || entryMins > end) {
      score += SIGNAL_WEIGHTS.PERSONAL_RULES.WINDOW_VIOLATION;
      reasons.push(`Entry outside allowed window (${rules.windowStart}–${rules.windowEnd})`);
    }
  }

  if (rules.maxTradesPerDay != null && rules.maxTradesPerDay > 0) {
    if (tradeIndex + 1 > rules.maxTradesPerDay) {
      score += SIGNAL_WEIGHTS.PERSONAL_RULES.MAX_TRADES_VIOLATION;
      reasons.push(`Exceeded max ${rules.maxTradesPerDay} trades/day`);
    }
  }

  if (rules.maxDailyLoss != null && rules.maxDailyLoss > 0) {
    const cumulativeLossBefore = sortedToday
      .slice(0, Math.max(0, tradeIndex))
      .filter(t => t.netPnl < 0)
      .reduce((sum, t) => sum + Math.abs(t.netPnl), 0);
    if (cumulativeLossBefore >= rules.maxDailyLoss) {
      score += SIGNAL_WEIGHTS.PERSONAL_RULES.MAX_DAILY_LOSS_VIOLATION;
      reasons.push(`Traded after breaching daily loss limit (₹${rules.maxDailyLoss})`);
    }
  }

  if (rules.maxLossPerTrade != null && rules.maxLossPerTrade > 0) {
    if (trade.status === 'LOSS' && Math.abs(trade.netPnl) > rules.maxLossPerTrade) {
      score += SIGNAL_WEIGHTS.PERSONAL_RULES.MAX_PER_TRADE_LOSS_VIOLATION;
      reasons.push(`Loss exceeded per-trade limit ₹${rules.maxLossPerTrade}`);
    }
  }

  if (rules.allowedInstruments && rules.allowedInstruments.length > 0) {
    if (!rules.allowedInstruments.includes(trade.instrumentType)) {
      score += SIGNAL_WEIGHTS.PERSONAL_RULES.INSTRUMENT_VIOLATION;
      reasons.push(`Instrument ${trade.instrumentType} not in allowed list`);
    }
  }

  if (rules.allowedMarkets && rules.allowedMarkets.length > 0) {
    if (!rules.allowedMarkets.includes(trade.market)) {
      score += SIGNAL_WEIGHTS.PERSONAL_RULES.MARKET_VIOLATION;
      reasons.push(`Market ${trade.market} not in allowed list`);
    }
  }

  return { score, reasons };
}
