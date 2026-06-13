// d:/journal/server/src/lib/ai/analytics.ts
// Deep behavioral analytics — produces hyper-personalized, data-backed pattern objects

export interface BehavioralPattern {
  patternType: string;
  title: string;
  description: string; // Data-backed sentence with real numbers
  severity: 'critical' | 'warning' | 'improving' | 'positive';
  count: number;
  avgPnl: number;
}

// Helper: get date string YYYY-MM-DD from any date format
function toDateStr(d: any): string {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().split('T')[0];
}

// Helper: safe float parse
function pnl(t: any): number {
  return parseFloat(t.netPnl || t.pnl || '0');
}

// ─── Pattern 1: Revenge Trades ──────────────────────────────────────────────
export function analyzeRevengeTrades(trades: any[]): BehavioralPattern | null {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const incidents: any[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const sameDay = toDateStr(curr.date) === toDateStr(prev.date);

    // After a loss, next trade same day with low discipline = revenge
    if (prev.status === 'LOSS' && sameDay && curr.disciplineScore != null && curr.disciplineScore <= 2) {
      incidents.push(curr);
    }
  }

  if (incidents.length === 0) return null;

  const avgPnlVal = incidents.reduce((s, t) => s + pnl(t), 0) / incidents.length;
  const avgDisc = incidents.reduce((s, t) => s + (t.disciplineScore || 0), 0) / incidents.length;
  const total = Math.round(incidents.reduce((s, t) => s + pnl(t), 0));

  return {
    patternType: 'revenge_trading',
    title: 'Revenge Trading',
    description: `${incidents.length} revenge trade${incidents.length > 1 ? 's' : ''} detected — avg P&L ₹${Math.round(avgPnlVal).toLocaleString('en-IN')}, avg discipline ${avgDisc.toFixed(1)}/5, total lost ₹${Math.abs(total < 0 ? total : 0).toLocaleString('en-IN')}.`,
    severity: incidents.length >= 3 ? 'critical' : 'warning',
    count: incidents.length,
    avgPnl: Math.round(avgPnlVal),
  };
}

// ─── Pattern 2: After Loss Day Trading ─────────────────────────────────────
export function analyzeAfterLossDay(trades: any[]): BehavioralPattern | null {
  // Group trades by day
  const byDay = new Map<string, any[]>();
  trades.forEach(t => {
    const d = toDateStr(t.date);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(t);
  });

  const days = Array.from(byDay.keys()).sort();
  const afterLossTrades: any[] = [];

  for (let i = 1; i < days.length; i++) {
    const prevDayTrades = byDay.get(days[i - 1])!;
    const prevDayPnl = prevDayTrades.reduce((s, t) => s + pnl(t), 0);

    if (prevDayPnl < 0) {
      // Previous day was red — record all trades on today
      afterLossTrades.push(...(byDay.get(days[i]) || []));
    }
  }

  if (afterLossTrades.length === 0) return null;

  const avgPnlVal = afterLossTrades.reduce((s, t) => s + pnl(t), 0) / afterLossTrades.length;
  const avgDisc = afterLossTrades.filter(t => t.disciplineScore != null).reduce((s, t) => s + t.disciplineScore, 0) / (afterLossTrades.filter(t => t.disciplineScore != null).length || 1);

  const severity = avgPnlVal < -1000 ? 'critical' : 'warning';
  const occurrences = new Set(afterLossTrades.map(t => toDateStr(t.date))).size;

  return {
    patternType: 'after_loss_day',
    title: 'Trading After Red Day',
    description: `On ${occurrences} occasion${occurrences > 1 ? 's' : ''} you traded the day after a losing day — avg P&L ₹${Math.round(avgPnlVal).toLocaleString('en-IN')}, avg discipline ${avgDisc.toFixed(1)}/5.`,
    severity,
    count: occurrences,
    avgPnl: Math.round(avgPnlVal),
  };
}

// ─── Pattern 3: Boredom Trades ──────────────────────────────────────────────
export function analyzeBoredomTrades(trades: any[]): BehavioralPattern | null {
  const keywords = ['bored', 'forced', 'no setup', 'no good setup', 'nothing else', 'not a high conviction', 'fomo', 'low conviction'];
  const incidents = trades.filter(t => {
    const text = `${t.mindset ?? ''} ${t.decisionNotes ?? ''}`.toLowerCase();
    return keywords.some(kw => text.includes(kw));
  });

  if (incidents.length === 0) return null;

  const avgPnlVal = incidents.reduce((s, t) => s + pnl(t), 0) / incidents.length;
  const totalLost = incidents.reduce((s, t) => s + pnl(t), 0);

  return {
    patternType: 'boredom_trading',
    title: 'Boredom / Low-Conviction Trades',
    description: `${incidents.length} forced/boredom trade${incidents.length > 1 ? 's' : ''} detected — avg P&L ₹${Math.round(avgPnlVal).toLocaleString('en-IN')}, cumulative impact ₹${Math.round(totalLost).toLocaleString('en-IN')}.`,
    severity: incidents.length >= 2 ? 'critical' : 'warning',
    count: incidents.length,
    avgPnl: Math.round(avgPnlVal),
  };
}

// ─── Pattern 4: Discipline vs P&L Correlation ───────────────────────────────
export function analyzeDisciplineCorrelation(trades: any[]): { low: number; mid: number; high: number; insight: string } {
  const withScore = trades.filter(t => t.disciplineScore != null);
  const low = withScore.filter(t => t.disciplineScore <= 2);
  const mid = withScore.filter(t => t.disciplineScore === 3);
  const high = withScore.filter(t => t.disciplineScore >= 4);

  const avg = (arr: any[]) => arr.length === 0 ? 0 : Math.round(arr.reduce((s, t) => s + pnl(t), 0) / arr.length);

  const lowAvg = avg(low);
  const midAvg = avg(mid);
  const highAvg = avg(high);

  const insight = `Discipline 1-2: avg ₹${lowAvg.toLocaleString('en-IN')} (${low.length} trades) | Discipline 3: avg ₹${midAvg.toLocaleString('en-IN')} (${mid.length} trades) | Discipline 4-5: avg ₹${highAvg.toLocaleString('en-IN')} (${high.length} trades)`;

  return { low: lowAvg, mid: midAvg, high: highAvg, insight };
}

// ─── Pattern 5: Symbol Performance ─────────────────────────────────────────
export function analyzeSymbolPerformance(trades: any[]): { best: string; worst: string; details: string } {
  const bySymbol = new Map<string, { total: number; wins: number; pnl: number }>();
  trades.forEach(t => {
    const sym = t.symbol;
    const e = bySymbol.get(sym) || { total: 0, wins: 0, pnl: 0 };
    e.total++;
    if (t.status === 'WIN') e.wins++;
    e.pnl += pnl(t);
    bySymbol.set(sym, e);
  });

  let best = { sym: 'N/A', pnl: -Infinity };
  let worst = { sym: 'N/A', pnl: Infinity };

  bySymbol.forEach((v, sym) => {
    if (v.pnl > best.pnl) best = { sym, pnl: v.pnl };
    if (v.pnl < worst.pnl) worst = { sym, pnl: v.pnl };
  });

  const details = Array.from(bySymbol.entries())
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .slice(0, 4)
    .map(([sym, v]) => `${sym}: ₹${Math.round(v.pnl).toLocaleString('en-IN')} (${Math.round((v.wins / v.total) * 100)}% WR, ${v.total} trades)`)
    .join(' | ');

  return { best: best.sym, worst: worst.sym, details };
}

// ─── Main: computeFullStats ──────────────────────────────────────────────────
export function computeFullStats(trades: any[]) {
  if (trades.length === 0) {
    return {
      winRate: 0, totalPnl: 0, avgWin: 0, avgLoss: 0,
      rrRatio: 0, profitFactor: 0, bestStrategy: 'N/A',
      totalTrades: 0
    };
  }

  const totalPnl = trades.reduce((sum, t) => sum + pnl(t), 0);
  const wins = trades.filter(t => t.status === 'WIN');
  const losses = trades.filter(t => t.status === 'LOSS');
  const winRate = (wins.length / trades.length) * 100;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + pnl(t), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + pnl(t), 0) / losses.length) : 1;
  const rrRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  const grossProfit = wins.reduce((s, t) => s + pnl(t), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + pnl(t), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

  return {
    winRate: Math.round(winRate * 10) / 10,
    totalPnl: Math.round(totalPnl),
    avgWin: Math.round(avgWin),
    avgLoss: Math.round(avgLoss),
    rrRatio: Math.round(rrRatio * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    bestStrategy: 'See symbol breakdown below',
    totalTrades: trades.length,
  };
}

// ─── Legacy compat exports ──────────────────────────────────────────────────
export function detectRevengeTrades(trades: any[]): number {
  return analyzeRevengeTrades(trades)?.count ?? 0;
}
export function detectBoredomTrades(trades: any[]): number {
  return analyzeBoredomTrades(trades)?.count ?? 0;
}
export function findBestStrategy(trades: any[]): { name: string; winRate: number; pnl: number } | null {
  const sym = analyzeSymbolPerformance(trades);
  return sym.best !== 'N/A' ? { name: sym.best, winRate: 0, pnl: 0 } : null;
}

// ─── Master function: run all behavioral patterns ────────────────────────────
export function runAllPatterns(trades: any[]): BehavioralPattern[] {
  const patterns: BehavioralPattern[] = [];
  const revenge = analyzeRevengeTrades(trades);
  if (revenge) patterns.push(revenge);
  const afterLoss = analyzeAfterLossDay(trades);
  if (afterLoss) patterns.push(afterLoss);
  const boredom = analyzeBoredomTrades(trades);
  if (boredom) patterns.push(boredom);
  return patterns;
}
