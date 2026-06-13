import { pgTable, uuid, text, timestamp, boolean, numeric, integer, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  timezone: text('timezone').default('Asia/Kolkata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const brokerConnections = pgTable('broker_connections', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  broker: text('broker').notNull(),
  apiKey: text('api_key'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  clientId: text('client_id'),
  isActive: boolean('is_active').default(false),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const strategies = pgTable('strategies', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  rules: text('rules'),
  market: text('market').array(),
  timeframe: text('timeframe'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trades = pgTable('trades', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  broker: text('broker').notNull(),
  brokerTradeId: text('broker_trade_id'),
  date: timestamp('date').notNull(),
  symbol: text('symbol').notNull(),
  market: text('market').notNull(),
  instrumentType: text('instrument_type').notNull(),
  direction: text('direction'),
  entryPrice: numeric('entry_price'),
  exitPrice: numeric('exit_price'),
  quantity: numeric('quantity'),
  pnl: numeric('pnl'),
  charges: numeric('charges'),
  netPnl: numeric('net_pnl'),
  status: text('status'),
  strategyId: uuid('strategy_id').references(() => strategies.id, { onDelete: 'set null' }),
  setupDescription: text('setup_description'),
  mindset: text('mindset'),
  decisionNotes: text('decision_notes'),
  learnings: text('learnings'),
  disciplineScore: integer('discipline_score'),
  tags: text('tags').array(),
  source: text('source'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  marketBias: text('market_bias'),
  keyLevels: text('key_levels'),
  watchlist: text('watchlist'),
  newsNotes: text('news_notes'),
  reflection: text('reflection'),
  whatWentWell: text('what_went_well'),
  whatToImprove: text('what_to_improve'),
  mood: text('mood'),
  overallDiscipline: integer('overall_discipline'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiInsights = pgTable('ai_insights', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type'),
  tradeId: uuid('trade_id').references(() => trades.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  tradesAnalyzedCount: integer('trades_analyzed_count'),
  dateRangeStart: timestamp('date_range_start'),
  dateRangeEnd: timestamp('date_range_end'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const coachMemory = pgTable('coach_memory', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  patternType: text('pattern_type').notNull(), // 'revenge_trading' | 'after_loss_day' | 'boredom_trading' | 'low_discipline' | 'best_symbol' | 'worst_symbol'
  title: text('title').notNull(),
  description: text('description').notNull(), // Data-backed e.g. "4 incidents, avg P&L –₹2,800, avg discipline 1.5"
  severity: text('severity').notNull().default('warning'), // 'critical' | 'warning' | 'improving' | 'positive'
  count: integer('count').notNull().default(0),
  previousCount: integer('previous_count').notNull().default(0),
  avgPnl: numeric('avg_pnl'),
  detectedAt: timestamp('detected_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

