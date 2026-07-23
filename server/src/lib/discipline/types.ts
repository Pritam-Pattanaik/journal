export type TradingStyle = 'Scalper' | 'Intraday' | 'Momentum' | 'Swing' | 'Positional' | 'Unknown';

export interface TradeSummary {
  id?: string;
  date: Date;
  entryTime: Date;
  exitTime: Date;
  quantity: number;
  netPnl: number;
  status: string;
  instrumentType: string;
  market: string;
}

export interface TraderProfile {
  tradeCount: number;
  ewmaHoldDurationMins: number;
  ewmaPositionSize: number;
  ewmaLossSize: number;
  ewmaWinSize: number;
  ewmaTimeBetweenTradesMins: number;
  dominantInstrument: string;
  tradingStyle: TradingStyle;
}

export interface BehaviourProfile {
  holdDurationMins: number;
  timeSinceLastTradeMins: number | null;
  consecutiveLossesBefore: number;
  quantity: number;
  pnl: number;
  isOpeningTrade: boolean;
  isClosingTrade: boolean;
}

export interface DisciplineResult {
  score: number;
  rawScore: number;
  confidence: number;
  tradingStyle: string;
  behaviourProfile: BehaviourProfile;
  disciplineBreakdown: any;
  reasons: string[];
}
