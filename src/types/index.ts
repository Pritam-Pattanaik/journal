export interface Trade {
  id: string;
  date: string;
  symbol: string;
  market: 'NSE' | 'BSE' | 'F&O' | 'Crypto';
  instrumentType: 'EQ' | 'CE' | 'PE' | 'FUT' | 'CRYPTO';
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  charges: number;
  netPnl: number;
  status: 'WIN' | 'LOSS' | 'BREAKEVEN';
  strategyId?: string;
  strategyName?: string;
  setupDescription?: string;
  mindset?: string;
  decisionNotes?: string;
  learnings?: string;
  disciplineScore?: number;
  tags?: string[];
  source: 'broker_sync' | 'manual';
}

export interface Strategy {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  market?: string[];
  timeframe?: string;
  isActive: boolean;
  totalPnl: number;
  winRate: number;
  tradeCount: number;
  avgPnl: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  marketBias?: 'bullish' | 'bearish' | 'neutral';
  keyLevels?: string;
  watchlist?: string;
  newsNotes?: string;
  reflection?: string;
  whatWentWell?: string;
  whatToImprove?: string;
  mood?: string;
  overallDiscipline?: number;
}

export interface AIInsight {
  id: string;
  type: 'deep_analysis' | 'weekly_digest' | 'trade_feedback';
  content: string;
  tradesAnalyzedCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  createdAt: string;
}

export interface BrokerConnection {
  id: string;
  broker: 'zerodha' | 'angelone';
  clientId: string;
  isActive: boolean;
  lastSyncedAt?: string;
  tokenExpiry?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  timezone: string;
}

export interface DashboardStats {
  totalPnl: number;
  winRate: number;
  avgRR: number;
  avgDiscipline: number;
  totalTrades: number;
}
