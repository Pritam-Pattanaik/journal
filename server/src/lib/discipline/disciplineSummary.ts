import { DailyDisciplineSummary } from './types';

export function computeDailyDisciplineSummaries(trades: any[]): Record<string, DailyDisciplineSummary> {
  const summaries: Record<string, DailyDisciplineSummary> = {};
  
  if (!trades || trades.length === 0) return summaries;

  const byDate = new Map<string, any[]>();
  for (const t of trades) {
    const d = new Date(t.date).toISOString().split('T')[0];
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(t);
  }

  for (const [date, dayTrades] of byDate) {
    let totalScore = 0;
    let scoredCount = 0;
    let highest = 0;
    let lowest = 5;
    let revengeCount = 0;
    let oversizingCount = 0;
    let ruleViolations = 0;
    let openingTradeCount = 0;
    let lateTradeCount = 0;
    let totalHoldMins = 0;
    let holdMinsCount = 0;

    for (const t of dayTrades) {
      if (t.disciplineScore != null) {
        totalScore += t.disciplineScore;
        scoredCount++;
        highest = Math.max(highest, t.disciplineScore);
        lowest = Math.min(lowest, t.disciplineScore);
      }
      
      const signals = t.disciplineSignals;
      if (signals) {
        if (signals.revenge < 0) revengeCount++;
        if (signals.sizing < -0.2) oversizingCount++; // Or undersized, but specifically we check if ratio > 1.5 in signals? We assigned -0.5 for oversized
        if (signals.personalRules < 0) ruleViolations++;
        if (signals.entryTiming === -0.5 && t.disciplineReasons?.some((r: string) => r.includes('before 9:30'))) {
          openingTradeCount++;
        }
        if (signals.entryTiming === -0.5 && t.disciplineReasons?.some((r: string) => r.includes('after 3:00'))) {
          lateTradeCount++;
        }
      }

      if (t.exitTime && t.date) {
        const holdMins = (new Date(t.exitTime).getTime() - new Date(t.date).getTime()) / 60000;
        if (holdMins > 0) {
          totalHoldMins += holdMins;
          holdMinsCount++;
        }
      }
    }

    if (scoredCount > 0) {
      summaries[date] = {
        date,
        averageDiscipline: Number((totalScore / scoredCount).toFixed(1)),
        highestDiscipline: highest,
        lowestDiscipline: lowest,
        ruleViolations,
        revengeCount,
        oversizingCount,
        averageHoldTimeMinutes: holdMinsCount > 0 ? Math.round(totalHoldMins / holdMinsCount) : 0,
        openingTradeCount,
        lateTradeCount,
        totalScoredTrades: scoredCount
      };
    }
  }

  return summaries;
}
