/**
 * Automatic Discipline Scorer
 *
 * Assigns a discipline score (1–5) using two layers:
 *
 * LAYER 1 — Universal Behavioral Signals (always applied):
 *   Entry time, hold duration, sizing consistency, loss sequence, P&L magnitude.
 *
 * LAYER 2 — Personal Rule Compliance (applied only if user has set "My Rules"):
 *   Trading window, max trades/day, daily loss limit, per-trade loss limit,
 *   allowed instruments, allowed markets.
 *
 * Final score = clamp(universal_score + personal_rule_adjustment, 1, 5)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TradeSummary {
  entryTime: Date;
  exitTime: Date;
  quantity: number;
  netPnl: number;
  status: string;
  instrumentType: string;
  market: string;
}

/** Personal trading rules set by the user in Settings */
export interface PersonalRules {
  windowStart?: string | null;        // "10:00" (IST, 24h)
  windowEnd?: string | null;          // "14:00" (IST, 24h)
  maxTradesPerDay?: number | null;
  maxDailyLoss?: number | null;       // INR
  maxLossPerTrade?: number | null;    // INR
  allowedInstruments?: string[] | null; // ['CE','PE','FUT','EQ']
  allowedMarkets?: string[] | null;     // ['F&O','NSE','BSE','MCX']
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Converts "HH:MM" to minutes since midnight */
function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

// ─── Layer 1: Universal Behavioral Signals ────────────────────────────────────

/**
 * Scores a single trade using universal behavioral signals.
 * Base 3.0, signals push it up or down.
 */
function universalScore(
  trade: TradeSummary,
  allTradesToday: TradeSummary[],
  historicalAvgQty: number,
  historicalAvgLoss: number,
  historicalAvgWin: number
): number {
  let score = 3.0;

  // Signal 1: Entry time (IST)
  const entryMins = trade.entryTime.getHours() * 60 + trade.entryTime.getMinutes();
  if (entryMins < 9 * 60 + 30) score -= 1.0;       // Before 9:30 AM
  else if (entryMins >= 15 * 60) score -= 0.5;      // After 3:00 PM

  // Signal 2: Hold duration
  const holdMins = (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000;
  const isDerivative = trade.instrumentType !== 'EQ';
  if (isDerivative) {
    if (holdMins < 5) score -= 1.5;
    else if (holdMins > 60) score += 0.5;
  } else {
    if (holdMins < 1) score -= 2.0;
    else if (holdMins > 30) score += 0.5;
  }

  // Signal 3: Sizing consistency (vs. rolling personal avg)
  if (historicalAvgQty > 0) {
    const ratio = trade.quantity / historicalAvgQty;
    if (ratio > 1.5) score -= 1.5;
    else if (ratio < 0.5) score -= 0.5;
    else if (ratio >= 0.9 && ratio <= 1.1) score += 0.5;
  }

  // Signal 4: Same-day loss sequence
  const sortedToday = [...allTradesToday].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime()
  );
  const tradeIndex = sortedToday.findIndex(
    t => Math.abs(t.entryTime.getTime() - trade.entryTime.getTime()) < 1000
  );
  if (tradeIndex > 0) {
    const prev = sortedToday[tradeIndex - 1];
    const gapMins = (trade.entryTime.getTime() - prev.exitTime.getTime()) / 60000;
    if (prev.status === 'LOSS' && gapMins >= 0 && gapMins < 10) score -= 1.0;
  }
  const lossesBeforeThis = sortedToday
    .slice(0, Math.max(0, tradeIndex))
    .filter(t => t.status === 'LOSS').length;
  if (lossesBeforeThis >= 2) score -= 0.5;

  // Signal 5: P&L magnitude vs. personal rolling avg
  if (trade.status === 'LOSS' && historicalAvgLoss > 0) {
    const lossRatio = Math.abs(trade.netPnl) / historicalAvgLoss;
    if (lossRatio > 2.0) score -= 1.5;
    else if (lossRatio < 0.8) score += 0.5;
  }
  if (trade.status === 'WIN' && historicalAvgWin > 0) {
    const winRatio = trade.netPnl / historicalAvgWin;
    if (winRatio > 1.2) score += 0.5;
  }

  return score;
}

// ─── Layer 2: Personal Rule Compliance ───────────────────────────────────────

/**
 * Returns the penalty (negative number or 0) for personal rule violations.
 * Each violated rule carries a specific deduction.
 *
 * @param trade          The trade being evaluated
 * @param allTradesToday All trades on the same day (for daily limits)
 * @param rules          User's personal trading rules
 */
function personalRulesPenalty(
  trade: TradeSummary,
  allTradesToday: TradeSummary[],
  rules: PersonalRules
): { penalty: number; violations: string[] } {
  let penalty = 0;
  const violations: string[] = [];

  const entryMins = trade.entryTime.getHours() * 60 + trade.entryTime.getMinutes();

  // Rule 1: Trading window
  if (rules.windowStart && rules.windowEnd) {
    const start = timeToMins(rules.windowStart);
    const end = timeToMins(rules.windowEnd);
    if (entryMins < start || entryMins > end) {
      penalty -= 1.0;
      violations.push(`Entry outside allowed window (${rules.windowStart}–${rules.windowEnd})`);
    }
  }

  // Rule 2: Max trades per day
  if (rules.maxTradesPerDay != null && rules.maxTradesPerDay > 0) {
    const sortedToday = [...allTradesToday].sort(
      (a, b) => a.entryTime.getTime() - b.entryTime.getTime()
    );
    const tradeIndex = sortedToday.findIndex(
      t => Math.abs(t.entryTime.getTime() - trade.entryTime.getTime()) < 1000
    );
    // tradeIndex is 0-based, so tradeIndex + 1 = trade number
    if (tradeIndex + 1 > rules.maxTradesPerDay) {
      penalty -= 1.0;
      violations.push(`Trade #${tradeIndex + 1} exceeds max ${rules.maxTradesPerDay} trades/day`);
    }
  }

  // Rule 3: Max daily loss — was the daily loss already breached before this trade?
  if (rules.maxDailyLoss != null && rules.maxDailyLoss > 0) {
    const sortedToday = [...allTradesToday].sort(
      (a, b) => a.entryTime.getTime() - b.entryTime.getTime()
    );
    const tradeIndex = sortedToday.findIndex(
      t => Math.abs(t.entryTime.getTime() - trade.entryTime.getTime()) < 1000
    );
    // Cumulative loss from trades before this one
    const cumulativeLossBefore = sortedToday
      .slice(0, tradeIndex)
      .filter(t => t.netPnl < 0)
      .reduce((sum, t) => sum + Math.abs(t.netPnl), 0);
    if (cumulativeLossBefore >= rules.maxDailyLoss) {
      penalty -= 1.5;
      violations.push(`Traded after hitting max daily loss limit (₹${rules.maxDailyLoss})`);
    }
  }

  // Rule 4: Max loss per trade
  if (rules.maxLossPerTrade != null && rules.maxLossPerTrade > 0) {
    if (trade.status === 'LOSS' && Math.abs(trade.netPnl) > rules.maxLossPerTrade) {
      penalty -= 1.0;
      violations.push(`Loss ₹${Math.abs(trade.netPnl).toFixed(0)} exceeded per-trade limit ₹${rules.maxLossPerTrade}`);
    }
  }

  // Rule 5: Allowed instruments
  if (rules.allowedInstruments && rules.allowedInstruments.length > 0) {
    if (!rules.allowedInstruments.includes(trade.instrumentType)) {
      penalty -= 0.5;
      violations.push(`Instrument ${trade.instrumentType} not in allowed list`);
    }
  }

  // Rule 6: Allowed markets
  if (rules.allowedMarkets && rules.allowedMarkets.length > 0) {
    if (!rules.allowedMarkets.includes(trade.market)) {
      penalty -= 0.5;
      violations.push(`Market ${trade.market} not in allowed list`);
    }
  }

  return { penalty, violations };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the final discipline score for one trade.
 * Combines universal signals + personal rule compliance.
 */
export function computeDisciplineScore(
  trade: TradeSummary,
  allTradesToday: TradeSummary[],
  historicalAvgQty: number,
  historicalAvgLoss: number,
  historicalAvgWin: number,
  rules?: PersonalRules | null
): { score: number; violations: string[] } {
  const uScore = universalScore(
    trade, allTradesToday, historicalAvgQty, historicalAvgLoss, historicalAvgWin
  );

  let totalPenalty = 0;
  let violations: string[] = [];

  if (rules) {
    const result = personalRulesPenalty(trade, allTradesToday, rules);
    totalPenalty = result.penalty;
    violations = result.violations;
  }

  const finalScore = Math.max(1, Math.min(5, Math.round(uScore + totalPenalty)));
  return { score: finalScore, violations };
}

/**
 * Scores all trades in the list using chronological rolling context.
 * Processes day-by-day, applying both universal + personal rules.
 *
 * @param trades  Flat array of all trade position objects (pre-DB-insert)
 * @param rules   User's personal rules (null = universal only)
 */
export function assignDisciplineScores(
  trades: any[],
  rules?: PersonalRules | null
): any[] {
  if (trades.length === 0) return trades;

  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group by calendar date
  const byDate = new Map<string, any[]>();
  for (const t of sorted) {
    const d = new Date(t.date).toISOString().split('T')[0];
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(t);
  }

  // Rolling baseline (grows as days are completed)
  const priorQtys: number[] = [];
  const priorLosses: number[] = [];
  const priorWins: number[] = [];
  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  for (const [_date, dayTrades] of byDate) {
    const avgQty = avg(priorQtys);
    const avgLoss = avg(priorLosses);
    const avgWin = avg(priorWins);

    const daySummaries: TradeSummary[] = dayTrades.map(t => ({
      entryTime: new Date(t.date),
      exitTime: t.exitTime ? new Date(t.exitTime) : new Date(t.date),
      quantity: parseFloat(t.quantity) || 0,
      netPnl: parseFloat(t.netPnl) ||
        (parseFloat(t.realizedPnl || '0') - parseFloat(t.charges || '0')),
      status: t.status || 'OPEN',
      instrumentType: t.instrumentType || 'EQ',
      market: t.market || 'NSE',
    }));

    for (let i = 0; i < dayTrades.length; i++) {
      const t = dayTrades[i];
      // Only score closed trades; never overwrite a manually-set score
      if (t.disciplineScore == null && t.status !== 'OPEN') {
        const { score, violations } = computeDisciplineScore(
          daySummaries[i],
          daySummaries,
          avgQty,
          avgLoss,
          avgWin,
          rules
        );
        t.disciplineScore = score;
        t._ruleViolations = violations; // for debugging/display, not persisted
      }
    }

    // Update rolling baseline after each completed day
    for (const t of dayTrades) {
      if (t.status !== 'OPEN') {
        const qty = parseFloat(t.quantity) || 0;
        const netPnl = parseFloat(t.netPnl) ||
          (parseFloat(t.realizedPnl || '0') - parseFloat(t.charges || '0'));
        if (qty > 0) priorQtys.push(qty);
        if (t.status === 'WIN') priorWins.push(netPnl);
        else if (t.status === 'LOSS') priorLosses.push(Math.abs(netPnl));
      }
    }
  }

  // Merge scores back into the original (unsorted) array
  const scoreMap = new Map<string, { score: number | null; violations: string[] }>();
  for (const t of sorted) {
    const key = `${new Date(t.date).getTime()}_${t.symbol}`;
    scoreMap.set(key, { score: t.disciplineScore ?? null, violations: t._ruleViolations ?? [] });
  }
  for (const t of trades) {
    const key = `${new Date(t.date).getTime()}_${t.symbol}`;
    if (t.disciplineScore == null && scoreMap.has(key)) {
      const entry = scoreMap.get(key)!;
      t.disciplineScore = entry.score;
      t._ruleViolations = entry.violations;
    }
  }

  return trades;
}
