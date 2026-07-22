export interface Trade {
  id: string;
  date: string;           // ISO string — entry time (when position was opened)
  exitTime?: string | null; // ISO string — when position was squared off (null for OPEN)
  isCarryForward?: boolean; // true when entry date ≠ exit date (overnight / multi-day hold)
  symbol: string;
  market: string;
  instrumentType: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  charges: number;
  netPnl: number;
  status: string;
  strategyId?: string;
  strategyName?: string;
  setupDescription?: string;
  mindset?: string;
  decisionNotes?: string;
  learnings?: string;
  disciplineScore?: number;
  tags?: string[];
  stopLoss?: number | null;
  mistakes?: string[];
  checklist?: Record<string, boolean>;
  source: string;
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
  tags?: string[];
  image?: string;
}

export interface EnrichedNews {
  id: string;
  headline: string;
  url: string;
  publishedAt: number;
  source: string;
  image?: string;
  originalSummary?: string;
  aiSummary: string;
  tldr: string;
  whyItMatters: string;
  historicalContext: string;
  categories: string[];
  sectors: string[];
  companies: string[];
  financialTerms: { term: string; definition: string }[];
  shortTermImpact?: string;
  longTermImpact?: string;
  whatToWatchNext?: string;
  riskFactors?: string;
  probability?: number;
  confidence?: number;
  marketImpact?: { asset: string; impact: string; sentiment: string }[];
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

export interface AiMessage {
  id?: string;
  conversationId?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  isPinned?: boolean;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    messages: number;
  };
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

export interface TradingRules {
  id?: string;
  windowStart?: string | null;           // "10:00" (IST 24h)
  windowEnd?: string | null;             // "14:00" (IST 24h)
  maxTradesPerDay?: number | null;
  maxDailyLoss?: number | null;          // INR
  maxLossPerTrade?: number | null;       // INR
  allowedInstruments?: string[] | null;  // CE | PE | FUT | EQ
  allowedMarkets?: string[] | null;      // F&O | NSE | BSE | MCX
}

export interface DashboardStats {
  totalPnl: number;
  winRate: number;
  avgRR: number;
  avgDiscipline: number;
  totalTrades: number;
}
