/**
 * Automatic Discipline Scorer
 * 
 * Assigns a discipline score (1–5) to each trade purely from execution data.
 * No manual notes required. Score measures process adherence, not outcome.
 * 
 * Scoring Formula:
 *   Base = 3.0 (neutral)
 *   + Signal 1: Entry time  (-1.0 to 0)
 *   + Signal 2: Hold time   (-2.0 to +0.5)
 *   + Signal 3: Sizing      (-1.5 to +0.5)
 *   + Signal 4: Loss seq.   (-1.5 to 0)
 *   + Signal 5: P&L mag.    (-1.5 to +0.5)
 *   = clamped to [1, 5]
 */

export interface TradeSummary {
  entryTime: Date;
  exitTime: Date;
  quantity: number;
  netPnl: number;   // after charges
  status: string;
  instrumentType: string;
}

/**
 * Computes a discipline score (1–5) for a single trade.
 * 
 * @param trade          The trade being scored
 * @param allTradesToday All trades on the same calendar day (for sequence analysis)
 * @param historicalAvgQty   Rolling avg trade quantity from prior days (0 if no history)
 * @param historicalAvgLoss  Rolling avg loss magnitude from prior days (absolute value)
 * @param historicalAvgWin   Rolling avg win from prior days
 */
export function computeDisciplineScore(
  trade: TradeSummary,
  allTradesToday: TradeSummary[],
  historicalAvgQty: number,
  historicalAvgLoss: number,
  historicalAvgWin: number
): number {
  let score = 3.0;

  // ── Signal 1: Entry Time ────────────────────────────────────────────────────
  // First 15 mins (9:15–9:30 IST): high volatility, low clarity window
  // Last 15 mins (3:00–3:15 IST): close chasing / desperation
  const entryMins = trade.entryTime.getHours() * 60 + trade.entryTime.getMinutes();
  if (entryMins < 9 * 60 + 30) {
    score -= 1.0; // Amateur hour entry
  } else if (entryMins >= 15 * 60) {
    score -= 0.5; // Late close chasing
  }

  // ── Signal 2: Hold Duration ─────────────────────────────────────────────────
  // Extremely short hold = impulse, no plan. Longer hold = conviction.
  const holdMins = (trade.exitTime.getTime() - trade.entryTime.getTime()) / 60000;
  const isDerivative = trade.instrumentType !== 'EQ';

  if (isDerivative) {
    if (holdMins < 5) score -= 1.5;        // Impulse scalp on F&O
    else if (holdMins > 60) score += 0.5;  // Held through a planned move
  } else {
    if (holdMins < 1) score -= 2.0;        // Noise trade on equity
    else if (holdMins > 30) score += 0.5;  // Planned swing
  }

  // ── Signal 3: Sizing Consistency ───────────────────────────────────────────
  // Comparing against rolling personal average. Oversizing = FOMO/revenge.
  if (historicalAvgQty > 0) {
    const sizeRatio = trade.quantity / historicalAvgQty;
    if (sizeRatio > 1.5) {
      score -= 1.5; // Significantly oversized — revenge/FOMO signal
    } else if (sizeRatio < 0.5) {
      score -= 0.5; // Significantly undersized — fear response
    } else if (sizeRatio >= 0.9 && sizeRatio <= 1.1) {
      score += 0.5; // Consistent sizing — disciplined
    }
  }

  // ── Signal 4: Same-Day Loss Sequence ───────────────────────────────────────
  // Re-entering within 10 mins of a loss = strong revenge signal.
  const sortedToday = [...allTradesToday].sort(
    (a, b) => a.entryTime.getTime() - b.entryTime.getTime()
  );
  const tradeIndex = sortedToday.findIndex(
    t => Math.abs(t.entryTime.getTime() - trade.entryTime.getTime()) < 1000
  );

  if (tradeIndex > 0) {
    const prev = sortedToday[tradeIndex - 1];
    const gapMins = (trade.entryTime.getTime() - prev.exitTime.getTime()) / 60000;
    if (prev.status === 'LOSS' && gapMins >= 0 && gapMins < 10) {
      score -= 1.0; // Re-entered within 10 mins of a loss
    }
  }

  // Extra penalty: 2+ losses already today before this trade
  const lossesBeforeThis = sortedToday
    .slice(0, Math.max(0, tradeIndex))
    .filter(t => t.status === 'LOSS').length;
  if (lossesBeforeThis >= 2) {
    score -= 0.5; // Should have stopped for the day
  }

  // ── Signal 5: P&L Magnitude ────────────────────────────────────────────────
  // A loss far larger than your average = stop loss not honored.
  // A small, contained loss = disciplined stop.
  if (trade.status === 'LOSS' && historicalAvgLoss > 0) {
    const lossRatio = Math.abs(trade.netPnl) / historicalAvgLoss;
    if (lossRatio > 2.0) {
      score -= 1.5; // Runaway loss — SL clearly not honoured
    } else if (lossRatio < 0.8) {
      score += 0.5; // Small, well-managed stop
    }
  }
  if (trade.status === 'WIN' && historicalAvgWin > 0) {
    const winRatio = trade.netPnl / historicalAvgWin;
    if (winRatio > 1.2) {
      score += 0.5; // Let winner run beyond average — good patience
    }
  }

  // ── Final: clamp to [1, 5] and round ───────────────────────────────────────
  return Math.max(1, Math.min(5, Math.round(score)));
}

/**
 * Scores all trades in the list using chronological rolling context.
 * Processes day-by-day so each day's trades have access to:
 *   - Same-day peers (for revenge/sequence detection)
 *   - Prior days' avg stats (for sizing/P&L magnitude comparison)
 * 
 * @param trades Flat array of all trade position objects (pre-DB-insert)
 * @returns Same array with `disciplineScore` populated on each item
 */
export function assignDisciplineScores(trades: any[]): any[] {
  if (trades.length === 0) return trades;

  // Sort chronologically
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

  // Rolling baseline stats (updated after each completed day)
  const priorQtys: number[] = [];
  const priorLosses: number[] = []; // absolute values
  const priorWins: number[] = [];

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // Process day by day
  for (const [_date, dayTrades] of byDate) {
    const avgQty = avg(priorQtys);
    const avgLoss = avg(priorLosses);
    const avgWin = avg(priorWins);

    // Build today's TradeSummary list for sequence analysis
    const daySummaries: TradeSummary[] = dayTrades.map(t => ({
      entryTime: new Date(t.date),
      exitTime: t.exitTime ? new Date(t.exitTime) : new Date(t.date),
      quantity: parseFloat(t.quantity) || 0,
      netPnl: parseFloat(t.netPnl) || (parseFloat(t.realizedPnl || '0') - parseFloat(t.charges || '0')),
      status: t.status || 'OPEN',
      instrumentType: t.instrumentType || 'EQ',
    }));

    // Score each trade in today's batch
    for (let i = 0; i < dayTrades.length; i++) {
      const t = dayTrades[i];
      // Only auto-score if no manual score is already set
      if (t.disciplineScore == null && t.status !== 'OPEN') {
        t.disciplineScore = computeDisciplineScore(
          daySummaries[i],
          daySummaries,
          avgQty,
          avgLoss,
          avgWin
        );
      }
    }

    // Update rolling baseline with today's closed trades
    for (const t of dayTrades) {
      if (t.status !== 'OPEN') {
        const qty = parseFloat(t.quantity) || 0;
        const netPnl = parseFloat(t.netPnl) || (parseFloat(t.realizedPnl || '0') - parseFloat(t.charges || '0'));
        if (qty > 0) priorQtys.push(qty);
        if (t.status === 'WIN') priorWins.push(netPnl);
        else if (t.status === 'LOSS') priorLosses.push(Math.abs(netPnl));
      }
    }
  }

  // Merge scores back into original array
  const scoreMap = new Map<string, number | null>();
  for (const t of sorted) {
    const key = `${t.date}_${t.symbol}_${t.quantity}`;
    scoreMap.set(key, t.disciplineScore ?? null);
  }
  for (const t of trades) {
    const key = `${t.date}_${t.symbol}_${t.quantity}`;
    if (t.disciplineScore == null && scoreMap.has(key)) {
      t.disciplineScore = scoreMap.get(key) ?? null;
    }
  }

  return trades;
}
