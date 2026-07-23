import { buildTraderProfile } from './traderIdentity';
import { extractBehaviour } from './behaviorExtractor';
import { calculateConfidence } from './confidenceEngine';
import { evaluateContext } from './contextEngine';
import { TradeSummary } from './types';
import { DISCIPLINE_VERSION } from './constants';

export function assignDisciplineScores(trades: any[]): any[] {
  if (trades.length === 0) return trades;

  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const historicalTrades: TradeSummary[] = [];
  
  for (const t of sorted) {
    const tradeSummary: TradeSummary = {
      id: t.id,
      date: new Date(t.date),
      entryTime: new Date(t.date),
      exitTime: t.exitTime ? new Date(t.exitTime) : new Date(t.date),
      quantity: parseFloat(t.quantity) || 0,
      netPnl: parseFloat(t.netPnl) || (parseFloat(t.realizedPnl || '0') - parseFloat(t.charges || '0')),
      status: t.status || 'OPEN',
      instrumentType: t.instrumentType || 'EQ',
      market: t.market || 'NSE',
    };

    const todayStr = tradeSummary.entryTime.toISOString().split('T')[0];
    const tradesToday = historicalTrades.filter(h => h.entryTime.toISOString().split('T')[0] === todayStr);
    
    const behavior = extractBehaviour(tradeSummary, tradesToday);
    const profile = buildTraderProfile(historicalTrades);
    const confidence = calculateConfidence(profile.tradeCount);
    
    const result = evaluateContext(tradeSummary.status, behavior, profile, confidence);

    // Ensure we don't overwrite manual scores, but still compute the backend signals for analytics
    t.disciplineScore = t.isManualOverride && t.manualScore != null ? t.manualScore : result.score;
    t.disciplineRawScore = result.rawScore;
    t.confidence = result.confidence;
    t.tradingStyle = result.tradingStyle;
    t.behaviourProfile = result.behaviourProfile;
    t.disciplineBreakdown = result.disciplineBreakdown;
    t.disciplineReasons = result.reasons;
    t.disciplineVersion = DISCIPLINE_VERSION;
    t.computedAt = new Date();

    if (tradeSummary.status !== 'OPEN') {
      historicalTrades.push(tradeSummary);
    }
  }

  return trades;
}
