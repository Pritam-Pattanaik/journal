/**
 * TradeVault AI News Engine — Central Configuration
 *
 * All runtime behaviour is controlled from this file.
 * Feature flags can be overridden via environment variables for kill-switch control.
 */

// ─── Feature Flags (Kill Switches) ───────────────────────────────────────────

export const FLAGS = {
  /** Master kill switch — false pauses the entire pipeline */
  NEWS_ENGINE_ENABLED: process.env.NEWS_ENGINE_ENABLED !== 'false',

  /** Controls LLM triage stage (Haiku 4.5) */
  TRIAGE_ENABLED: process.env.TRIAGE_ENABLED !== 'false',

  /** Controls LLM scoring stage (Sonnet) */
  SCORING_ENABLED: process.env.SCORING_ENABLED !== 'false',

  /** Controls all delivery (digests + breaking alerts) */
  DELIVERY_ENABLED: process.env.DELIVERY_ENABLED !== 'false',

  /** Controls breaking push notifications specifically */
  BREAKING_ALERTS_ENABLED: process.env.BREAKING_ALERTS_ENABLED !== 'false',

  /** Per-source kill switches */
  NSE_POLLER_ENABLED: process.env.NSE_POLLER_ENABLED !== 'false',
  BSE_POLLER_ENABLED: process.env.BSE_POLLER_ENABLED !== 'false',
  RBI_POLLER_ENABLED: process.env.RBI_POLLER_ENABLED !== 'false',
  PIB_POLLER_ENABLED: process.env.PIB_POLLER_ENABLED !== 'false',
  MACRO_POLLER_ENABLED: process.env.MACRO_POLLER_ENABLED !== 'false',
  NEWSDATA_POLLER_ENABLED: process.env.NEWSDATA_POLLER_ENABLED !== 'false',

  /**
   * ADVISORY_MODE — NEVER enable without SEBI RA registration.
   * Hard-coded to false. Requires both env var AND code change to enable.
   */
  ADVISORY_MODE_ENABLED: false as const,

  /** Human review gate — if true, scored items require admin approval before delivery */
  HUMAN_REVIEW_REQUIRED: process.env.HUMAN_REVIEW_REQUIRED === 'true',
} as const;

// ─── AI Model Configuration ───────────────────────────────────────────────────

export const AI_MODELS = {
  /** Triage: cheapest, fastest — classifies all incoming items */
  TRIAGE_MODEL: 'claude-haiku-4-5',
  TRIAGE_PROMPT_VERSION: 'triage-v1.0',

  /** Scoring: highest quality — only for items that pass triage */
  SCORING_MODEL: 'claude-sonnet-4-5',
  SCORING_PROMPT_VERSION: 'scoring-v1.0',

  /** 
   * Default/Fallback Provider: Groq (llama-3.3-70b-versatile)
   * This is used as the default for both Triage and Scoring if ANTHROPIC_API_KEY is not set.
   * Switching to Claude later requires only adding ANTHROPIC_API_KEY to the environment.
   */
  FALLBACK_MODEL: 'llama-3.3-70b-versatile',

  /** Max tokens for triage response — keep small to control cost */
  TRIAGE_MAX_TOKENS: 150,

  /** Max tokens for scoring response */
  SCORING_MAX_TOKENS: 800,

  /** Timeouts */
  TRIAGE_TIMEOUT_MS: 30_000,
  SCORING_TIMEOUT_MS: 45_000,
} as const;

// ─── Cost Governance ──────────────────────────────────────────────────────────

export const COST = {
  /** Pause scoring jobs if estimated daily Anthropic spend exceeds this (USD) */
  MAX_DAILY_SCORING_USD: Number(process.env.MAX_DAILY_SCORING_USD) || 15,

  /** Approximate cost per 1M tokens (USD) — used for spend estimation */
  HAIKU_COST_PER_M_IN: 1.0,
  HAIKU_COST_PER_M_OUT: 5.0,
  SONNET_COST_PER_M_IN: 3.0,
  SONNET_COST_PER_M_OUT: 15.0,
} as const;

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

export const CIRCUIT_BREAKER = {
  /** Number of consecutive AI failures before opening the circuit */
  FAILURE_THRESHOLD: 3,
  /** How long the circuit stays open before attempting recovery (ms) */
  RECOVERY_TIMEOUT_MS: 5 * 60_000, // 5 minutes
} as const;

// ─── Source Polling Configuration ────────────────────────────────────────────

export interface SourceConfig {
  intervalMs: number;
  marketHoursOnly: boolean;
  backoffBaseMs: number;
  maxRetries: number;
  timeoutMs: number;
}

export const SOURCE_CONFIG: Record<string, SourceConfig> = {
  NSE: {
    intervalMs: 90_000,       // every 90 seconds
    marketHoursOnly: true,    // only during 9:00–16:00 IST Mon–Fri
    backoffBaseMs: 2_000,
    maxRetries: 3,
    timeoutMs: 10_000,
  },
  BSE: {
    intervalMs: 90_000,
    marketHoursOnly: true,
    backoffBaseMs: 2_000,
    maxRetries: 3,
    timeoutMs: 10_000,
  },
  RBI: {
    intervalMs: 600_000,      // every 10 minutes
    marketHoursOnly: false,   // always-on (RBI announcements happen any time)
    backoffBaseMs: 5_000,
    maxRetries: 3,
    timeoutMs: 10_000,
  },
  PIB: {
    intervalMs: 600_000,
    marketHoursOnly: false,
    backoffBaseMs: 5_000,
    maxRetries: 3,
    timeoutMs: 10_000,
  },
  MACRO: {
    intervalMs: 300_000,      // every 5 minutes
    marketHoursOnly: false,
    backoffBaseMs: 3_000,
    maxRetries: 3,
    timeoutMs: 10_000,
  },
  NEWSDATA: {
    intervalMs: 300_000,
    marketHoursOnly: false,
    backoffBaseMs: 3_000,
    maxRetries: 3,
    timeoutMs: 10_000,
  },
};

// ─── Sector Bucket Mapping ────────────────────────────────────────────────────
// Keywords that trigger sector classification. Order matters: first match wins.
// Keep terms lowercase — matching is case-insensitive.

export const SECTOR_KEYWORDS: Record<string, string[]> = {
  'Nifty Bank': [
    'rbi', 'repo rate', 'bank', 'lender', 'credit', 'deposit', 'npa', 'banking',
    'monetary policy', 'liquidity', 'crar', 'nim', 'net interest margin',
    'sbi', 'hdfc bank', 'icici bank', 'axis bank', 'kotak bank', 'yes bank',
    'idfc', 'federal bank', 'bandhan',
  ],
  'Nifty IT': [
    'it sector', 'software', 'tech services', 'rupee', 'usd/inr', 'dollar depreciation',
    'infosys', 'tcs', 'wipro', 'hcl tech', 'tech mahindra', 'mphasis', 'coforge',
    'attrition', 'headcount', 'visa', 'h1b', 'outsourcing',
  ],
  'Nifty Auto': [
    'ev', 'electric vehicle', 'vehicle sales', 'automobile', 'auto',
    'maruti', 'tata motors', 'bajaj auto', 'hero motocorp', 'mahindra',
    'ola electric', 'two-wheeler', 'commercial vehicle', 'pli auto',
  ],
  'Nifty Pharma': [
    'pharma', 'drug', 'usfda', 'us fda', 'api', 'generics', 'healthcare',
    'sun pharma', 'dr reddy', 'cipla', 'divi\'s', 'aurobindo', 'alkem',
    'clinical trial', 'form 483', 'warning letter', 'gdufa',
  ],
  'Nifty FMCG': [
    'fmcg', 'consumer', 'rural demand', 'monsoon', 'packaged food', 'inflation cpi',
    'hindustan unilever', 'itc', 'nestle', 'britannia', 'dabur', 'godrej consumer',
    'marico', 'emami', 'gst', 'commodity costs',
  ],
  'Nifty Metal': [
    'steel', 'aluminium', 'copper', 'iron ore', 'metal', 'commodity',
    'tata steel', 'jsw steel', 'hindalco', 'vedanta', 'sail', 'coking coal',
    'china demand', 'anti-dumping',
  ],
  'Nifty Energy': [
    'oil', 'crude', 'brent', 'gas', 'refinery', 'opec', 'petroleum',
    'reliance industries', 'ongc', 'bpcl', 'ioc', 'hpcl', 'gail',
    'lng', 'natural gas', 'oil price', 'wti',
  ],
  'Nifty Realty': [
    'real estate', 'housing', 'residential', 'commercial property', 'reit',
    'dlf', 'godrej properties', 'prestige', 'brigade', 'sobha', 'macrotech',
    'rera', 'repo rate housing', 'affordable housing',
  ],
  'Nifty PSU Bank': [
    'psu bank', 'public sector bank', 'state bank', 'nationalised bank',
    'sbi', 'pnb', 'bank of baroda', 'canara bank', 'union bank', 'bank of india',
    'recapitalisation', 'merger bank',
  ],
  'Nifty Financial Services': [
    'nbfc', 'insurance', 'mutual fund', 'amc', 'sebi', 'irdai', 'irda',
    'bajaj finance', 'hdfc amc', 'sbi life', 'max life', 'lic', 'edelweiss',
    'microfinance', 'mfi', 'credit card', 'bnpl',
  ],
};

// ─── Market Hours (IST) ───────────────────────────────────────────────────────

export const MARKET_HOURS = {
  /** Market opens 9:15 AM IST — pollers start slightly earlier to catch pre-open */
  OPEN_HOUR: 9,
  OPEN_MINUTE: 0,
  /** Market closes 3:30 PM IST — pollers stop at 4:00 PM */
  CLOSE_HOUR: 16,
  CLOSE_MINUTE: 0,
  TIMEZONE: 'Asia/Kolkata',
} as const;

// ─── Compliance ───────────────────────────────────────────────────────────────

export const EDUCATIONAL_DISCLAIMER =
  '⚠️ Educational Use Only: This analysis is for educational purposes and market awareness only. ' +
  'It does not constitute investment advice, research, or a recommendation to buy, sell, or hold ' +
  'any security. Past sector observations do not guarantee future performance. Please consult a ' +
  'SEBI-registered financial advisor before making investment decisions. TradeVault is not a ' +
  'SEBI-registered Research Analyst.';

/** Regex patterns that indicate ADVISORY_MODE language — must be blocked in EDUCATIONAL_MODE */
export const COMPLIANCE_BLOCK_PATTERNS = [
  /\b(buy|sell|short|long)\s+(above|below|at|around|near)\s+[₹$]?\d/gi,
  /\b(target|tp|target price)\s*:?\s*[₹$]?\d/gi,
  /\b(stop.?loss|sl|stoploss)\s*:?\s*[₹$]?\d/gi,
  /\b(entry|enter|accumulate)\s+(at|around|near|above|below)\s+[₹$]?\d/gi,
  /\b(\d+)%\s+(accuracy|success|correct|win\s?rate)/gi,
  /\b(predicted|forecast|will\s+rise|will\s+fall|will\s+go)\s+to\s+[₹$]?\d/gi,
  /\b(recommended\s+to\s+(buy|sell|hold))/gi,
  /\b(returns?\s+of\s+\d+%)/gi,
];

/** Max words in scoring rationale (enforced post-generation) */
export const MAX_RATIONALE_WORDS = 200;

// ─── Delivery Schedule (IST) ─────────────────────────────────────────────────

export const DIGEST_SCHEDULE = {
  /** Pre-market digest: 7:30 AM IST Mon–Fri */
  PRE_MARKET_CRON: '30 2 * * 1-5',   // 2:00 UTC = 7:30 IST

  /** EOD digest: 4:00 PM IST Mon–Fri */
  EOD_CRON: '30 10 * * 1-5',          // 10:30 UTC = 16:00 IST

  /** Precision backtest job: 9:00 PM IST daily */
  BACKTEST_CRON: '30 15 * * *',        // 15:30 UTC = 21:00 IST

  /** Metrics flush: every 5 minutes */
  METRICS_CRON: '*/5 * * * *',
} as const;
