import { BehaviourProfile, TraderProfile, DisciplineResult } from './types';

export function evaluateContext(
  tradeStatus: string, // 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN'
  behavior: BehaviourProfile,
  profile: TraderProfile,
  confidence: number
): DisciplineResult {
  let rawScore = 3.0;
  const reasons: string[] = [];
  const breakdown: any = {
    hold: 0,
    size: 0,
    sequence: 0,
    pnl: 0,
    timing: 0
  };

  if (tradeStatus === 'OPEN') {
    return {
      score: 3, rawScore: 3.0, confidence: 0, tradingStyle: profile.tradingStyle,
      behaviourProfile: behavior, disciplineBreakdown: breakdown, reasons: ['Trade is still open']
    };
  }

  // 1. Hold Duration Context
  if (profile.ewmaHoldDurationMins > 0) {
    const holdRatio = behavior.holdDurationMins / profile.ewmaHoldDurationMins;
    if (holdRatio < 0.2) {
      const penalty = profile.tradingStyle === 'Scalper' ? -0.5 : -1.5;
      rawScore += penalty;
      breakdown.hold = penalty;
      reasons.push(`⚠ Exited much earlier than your average (${behavior.holdDurationMins.toFixed(1)}m vs ${profile.ewmaHoldDurationMins.toFixed(1)}m)`);
    } else if (holdRatio > 3.0) {
      if (tradeStatus === 'LOSS') {
        rawScore -= 1.0;
        breakdown.hold = -1.0;
        reasons.push(`⚠ Held a losing position significantly longer than your average`);
      } else {
        rawScore += 0.5;
        breakdown.hold = 0.5;
        reasons.push(`✓ Let winner run longer than usual`);
      }
    } else {
      rawScore += 0.5;
      breakdown.hold = 0.5;
      reasons.push(`✓ Normal hold duration matching your ${profile.tradingStyle} style`);
    }
  } else {
    if (behavior.holdDurationMins < 1) {
      rawScore -= 0.5;
      breakdown.hold = -0.5;
      reasons.push(`⚠ Extremely short hold time (<1 min) without a baseline`);
    }
  }

  // 2. Sizing Context
  if (profile.ewmaPositionSize > 0) {
    const sizeRatio = behavior.quantity / profile.ewmaPositionSize;
    if (sizeRatio > 1.5) {
      rawScore -= 1.5;
      breakdown.size = -1.5;
      reasons.push(`⚠ Oversized position (${behavior.quantity} vs avg ${Math.round(profile.ewmaPositionSize)})`);
    } else if (sizeRatio < 0.5) {
      if (behavior.consecutiveLossesBefore > 0) {
        rawScore -= 0.5;
        breakdown.size = -0.5;
        reasons.push(`⚠ Undersized fear trade following a loss`);
      } else {
        breakdown.size = 0;
        reasons.push(`⚠ Position size smaller than average`);
      }
    } else {
      rawScore += 0.5;
      breakdown.size = 0.5;
      reasons.push(`✓ Position size matched normal behaviour`);
    }
  }

  // 3. Sequence & Revenge Context
  if (behavior.consecutiveLossesBefore > 0 && behavior.timeSinceLastTradeMins !== null) {
    const isRevenge = behavior.timeSinceLastTradeMins < 10;
    if (isRevenge) {
      rawScore -= 1.0;
      breakdown.sequence = -1.0;
      reasons.push(`⚠ Revenge behaviour: re-entered within ${Math.round(behavior.timeSinceLastTradeMins)} mins of a loss`);
    }
    if (behavior.consecutiveLossesBefore >= 2) {
      rawScore -= 0.5;
      breakdown.sequence -= 0.5;
      reasons.push(`⚠ Trading on tilt: continued after ${behavior.consecutiveLossesBefore} consecutive losses`);
    }
    
    if (!isRevenge && behavior.timeSinceLastTradeMins >= 15) {
      rawScore += 0.5;
      breakdown.sequence = 0.5;
      reasons.push(`✓ Took a healthy break after a loss`);
    }
  } else if (behavior.timeSinceLastTradeMins !== null) {
    reasons.push(`✓ No revenge behaviour detected`);
  }

  // 4. PnL Context
  if (tradeStatus === 'LOSS' && profile.ewmaLossSize > 0) {
    const lossRatio = Math.abs(behavior.pnl) / profile.ewmaLossSize;
    if (lossRatio > 1.5) {
      rawScore -= 1.5;
      breakdown.pnl = -1.5;
      reasons.push(`⚠ Loss magnitude exceeded average by ${((lossRatio-1)*100).toFixed(0)}%`);
    } else if (lossRatio <= 1.0) {
      rawScore += 0.5;
      breakdown.pnl = 0.5;
      reasons.push(`✓ Well-managed, controlled loss`);
    }
  }
  if (tradeStatus === 'WIN' && profile.ewmaWinSize > 0) {
    const winRatio = Math.abs(behavior.pnl) / profile.ewmaWinSize;
    if (winRatio > 1.2 && breakdown.hold >= 0) {
      rawScore += 0.5;
      breakdown.pnl = 0.5;
      reasons.push(`✓ Capitalized on a strong setup`);
    }
  }

  // 5. Timing Context
  if (behavior.isOpeningTrade) {
    if (profile.tradingStyle === 'Scalper' || profile.tradingStyle === 'Momentum') {
      reasons.push(`✓ Traded opening volatility (normal for ${profile.tradingStyle})`);
    } else {
      rawScore -= 0.5;
      breakdown.timing = -0.5;
      reasons.push(`⚠ Traded opening volatility (unusual for ${profile.tradingStyle})`);
    }
  }

  const clamped = Math.max(1, Math.min(5, Math.round(rawScore)));

  return {
    score: clamped,
    rawScore: Number(rawScore.toFixed(1)),
    confidence,
    tradingStyle: profile.tradingStyle,
    behaviourProfile: behavior,
    disciplineBreakdown: breakdown,
    reasons
  };
}
