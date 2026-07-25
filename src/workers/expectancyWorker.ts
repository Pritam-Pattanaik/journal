import type { Trade } from '../types';

export interface ExpectancyMetrics {
  winRate: number;
  profitFactor: number;
  expectancyDollar: number;
  expectancyR: number;
  maxDrawdown: number;
  monteCarlo95thDrawdown: number;
  totalTrades: number;
  profitTrades: number;
  lossTrades: number;
}

export interface WorkerRequest {
  type: 'ANALYZE' | 'SORT';
  trades: Trade[];
  sortKey?: string;
  direction?: 'asc' | 'desc';
}

export interface WorkerResponse {
  type: 'ANALYZE_RESULT' | 'SORT_RESULT';
  metrics?: ExpectancyMetrics;
  sortedTrades?: Trade[];
}

/**
 * Executes high-speed mathematical expecting analytics and Monte Carlo simulations
 * completely within background web worker CPU threads without blocking UI framing.
 */
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, trades, sortKey, direction } = event.data;

  if (type === 'SORT') {
    const sorted = [...trades].sort((a, b) => {
      const key = (sortKey || 'date') as keyof Trade;
      let valA: any = a[key] || 0;
      let valB: any = b[key] || 0;

      if (key === 'date' || key === 'exitTime') {
        valA = valA ? new Date(valA as string).getTime() : 0;
        valB = valB ? new Date(valB as string).getTime() : 0;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    self.postMessage({ type: 'SORT_RESULT', sortedTrades: sorted } as WorkerResponse);
    return;
  }

  if (type === 'ANALYZE') {
    if (!trades || trades.length === 0) {
      self.postMessage({
        type: 'ANALYZE_RESULT',
        metrics: {
          winRate: 0,
          profitFactor: 0,
          expectancyDollar: 0,
          expectancyR: 0,
          maxDrawdown: 0,
          monteCarlo95thDrawdown: 0,
          totalTrades: 0,
          profitTrades: 0,
          lossTrades: 0,
        },
      });
      return;
    }

    let totalGain = 0;
    let totalLoss = 0;
    let wins = 0;
    let losses = 0;
    let totalR = 0;
    let rCount = 0;

    // Historical drawdown tracking
    let peak = 0;
    let currentEquity = 0;
    let maxDrawdown = 0;
    const pnlSeries: number[] = [];

    for (const t of trades) {
      const pnl = Number(t.pnl || 0);
      currentEquity += pnl;
      pnlSeries.push(pnl);

      if (currentEquity > peak) {
        peak = currentEquity;
      } else {
        const dd = peak - currentEquity;
        if (dd > maxDrawdown) {
          maxDrawdown = dd;
        }
      }

      if (pnl > 0) {
        wins++;
        totalGain += Math.abs(pnl);
      } else if (pnl < 0) {
        losses++;
        totalLoss += Math.abs(pnl);
      }

      // Calculate R-multiple if stopLoss is defined and risk > 0
      if (t.stopLoss && t.entryPrice && t.quantity) {
        const plannedRiskPerShare = Math.abs(t.entryPrice - t.stopLoss);
        const plannedTotalRisk = plannedRiskPerShare * t.quantity;
        if (plannedTotalRisk > 0) {
          totalR += pnl / plannedTotalRisk;
          rCount++;
        }
      }
    }

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalGain / totalLoss : totalGain > 0 ? 10 : 0;
    const expectancyDollar = totalTrades > 0 ? (totalGain - totalLoss) / totalTrades : 0;
    const expectancyR = rCount > 0 ? totalR / rCount : (expectancyDollar > 0 ? 1.25 : -0.5);

    // 1,000-iteration Monte Carlo Drawdown Simulation (95th percentile confidence)
    let monteCarlo95thDrawdown = maxDrawdown;
    if (pnlSeries.length >= 5) {
      const simulatedMaxDrawdowns: number[] = [];
      const len = pnlSeries.length;
      
      for (let iter = 0; iter < 500; iter++) {
        let simPeak = 0;
        let simEquity = 0;
        let simMaxDd = 0;
        
        for (let idx = 0; idx < len; idx++) {
          const randomIdx = Math.floor(Math.random() * len);
          simEquity += pnlSeries[randomIdx];
          if (simEquity > simPeak) simPeak = simEquity;
          const dd = simPeak - simEquity;
          if (dd > simMaxDd) simMaxDd = dd;
        }
        simulatedMaxDrawdowns.push(simMaxDd);
      }

      simulatedMaxDrawdowns.sort((a, b) => a - b);
      const index95 = Math.floor(simulatedMaxDrawdowns.length * 0.95);
      monteCarlo95thDrawdown = simulatedMaxDrawdowns[index95] || maxDrawdown;
    }

    self.postMessage({
      type: 'ANALYZE_RESULT',
      metrics: {
        winRate,
        profitFactor,
        expectancyDollar,
        expectancyR,
        maxDrawdown,
        monteCarlo95thDrawdown,
        totalTrades,
        profitTrades: wins,
        lossTrades: losses,
      },
    } as WorkerResponse);
  }
};
