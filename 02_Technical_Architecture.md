# Technical Architecture Document — TradeVault
**Version:** 1.0  
**Date:** June 2026  
**Status:** Production Ready

---

## 1. Architecture Overview

TradeVault is a full-stack web application built on a React frontend, an Express.js Node backend, Neon PostgreSQL database, and third-party broker APIs. The AI coaching layer uses the Anthropic Claude API.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                     │
│         React + Vite · Tailwind · Recharts              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────────┐
│ Express API  │  │ Claude API  │  │  Broker APIs     │
│  + Neon DB   │  │ (Anthropic) │  │  Zerodha Kite    │
│ (PostgreSQL) │  └─────────────┘  │  AngelOne Smart  │
└──────────────┘                   └──────────────────┘
```

---

## 2. Technology Stack

### Frontend
| Layer | Technology | Reason |
|---|---|---|
| Framework | React 18 + Vite | Fast dev server, small bundle |
| Styling | Tailwind CSS v3 | Utility-first, consistent design |
| Motion | Framer Motion | Fluid UI animations & transitions |
| Charts | Recharts | React-native, lightweight |
| Icons | Lucide React | Clean, consistent icon set |
| State | Zustand | Minimal, no boilerplate |
| Data fetching | TanStack Query | Caching, background refetch |
| Routing | React Router v6 | Standard SPA routing |
| Forms | React Hook Form | Performant, minimal re-renders |

### Backend
| Layer | Technology | Reason |
|---|---|---|
| Database | Neon PostgreSQL | Managed, serverless scalable database |
| Auth | JWT Auth (Express) | Custom JSON Web Token based authentication |
| Server-side logic | Express.js (Node.js) | Flexible REST API server |
| File storage | Cloud Storage / AWS S3 | For trade screenshots (Phase 3) |
| ORM | Drizzle ORM | Type-safe SQL wrapper for PostgreSQL |

### External APIs
| Service | Purpose |
|---|---|
| Zerodha Kite Connect | Trade sync — NSE, F&O |
| AngelOne SmartAPI | Trade sync — NSE, F&O |
| Anthropic Claude API (claude-sonnet-4-20250514) | AI coaching and analysis |
| Resend (or SendGrid) | Weekly digest emails |

### Infrastructure
| Layer | Technology |
|---|---|
| Frontend hosting | Vercel (auto CI/CD from GitHub) |
| Backend hosting | Render / DigitalOcean App Platform |
| Database hosting | Neon Tech |
| Monitoring | Sentry (errors), Vercel Analytics |
| CI/CD | GitHub Actions → Vercel/Render |

---

## 3. Database Schema

### 3.1 Users (Managed by custom JWT Auth)
The `users` table handles authentication. We extend it with profile details.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Broker Connections
```sql
CREATE TABLE broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL CHECK (broker IN ('zerodha', 'angelone')),
  api_key TEXT,                      -- encrypted at app layer before storage
  access_token TEXT,                 -- encrypted, refreshed daily (Zerodha)
  refresh_token TEXT,                -- encrypted (AngelOne)
  token_expiry TIMESTAMPTZ,
  client_id TEXT,                    -- Kite login ID / AngelOne client ID
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, broker)
);
```

### 3.3 Trades
```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL,
  broker_trade_id TEXT,              -- original ID from broker API
  date DATE NOT NULL,
  symbol TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('NSE', 'BSE', 'F&O', 'Crypto')),
  instrument_type TEXT NOT NULL CHECK (
    instrument_type IN ('EQ', 'CE', 'PE', 'FUT', 'CRYPTO')
  ),
  direction TEXT CHECK (direction IN ('LONG', 'SHORT')),
  entry_price NUMERIC(18,4),
  exit_price NUMERIC(18,4),
  quantity NUMERIC(18,4),
  pnl NUMERIC(18,2),
  charges NUMERIC(18,2),            -- brokerage + STT + other charges
  net_pnl NUMERIC(18,2),            -- pnl - charges
  status TEXT CHECK (status IN ('WIN', 'LOSS', 'BREAKEVEN')),
  
  -- Annotation fields (user-added)
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  setup_description TEXT,
  mindset TEXT,
  decision_notes TEXT,
  learnings TEXT,
  discipline_score SMALLINT CHECK (discipline_score BETWEEN 1 AND 5),
  tags TEXT[],
  
  -- Source
  source TEXT CHECK (source IN ('broker_sync', 'manual')) DEFAULT 'broker_sync',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, broker, broker_trade_id)
);
```

### 3.4 Strategies
```sql
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,                        -- strategy rules / checklist
  market TEXT[],                     -- applicable markets
  timeframe TEXT,                    -- e.g. "intraday", "positional", "scalp"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

### 3.5 Journal Entries
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Pre-market
  market_bias TEXT,                  -- 'bullish' / 'bearish' / 'neutral'
  key_levels TEXT,
  watchlist TEXT,
  news_notes TEXT,
  
  -- Post-market
  reflection TEXT,
  what_went_well TEXT,
  what_to_improve TEXT,
  
  -- Self-assessment
  mood TEXT,
  overall_discipline SMALLINT CHECK (overall_discipline BETWEEN 1 AND 5),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);
```

### 3.6 AI Insights
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('deep_analysis', 'weekly_digest', 'trade_feedback')),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,  -- for trade_feedback type
  content TEXT NOT NULL,
  trades_analyzed_count INTEGER,
  date_range_start DATE,
  date_range_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. API Architecture

### 4.1 Express API Endpoints

| Endpoint Route | Trigger | Purpose |
|---|---|---|
| `POST /api/trades/sync/zerodha` | Manual / cron | Fetches trades from Kite API and upserts to trades table |
| `POST /api/trades/sync/angelone` | Manual / cron | Fetches trades from SmartAPI and upserts to trades table |
| `GET /api/auth/zerodha/callback` | HTTP GET (OAuth redirect) | Handles Kite OAuth code exchange, stores tokens |
| `POST /api/auth/zerodha/refresh` | Cron (5:55 AM IST daily) | Refreshes expired Kite tokens |
| `POST /api/insights/analyze` | Manual (user triggered) | Fetches user's trades, calls Claude API, stores result |
| `POST /api/cron/weekly-digest` | Cron (Monday 7 AM IST) | Generates weekly digest for all active users |

### 4.2 Zerodha Kite Connect Flow
```
1. User clicks "Connect Zerodha"
2. Frontend redirects to Kite OAuth URL with app api_key
3. User logs in to Kite, approves permission
4. Kite redirects to our callback URL with request_token
5. Express endpoint `/api/auth/zerodha/callback`:
   a. POSTs request_token + api_secret to Kite → gets access_token
   b. Encrypts access_token, stores in broker_connections
6. Frontend shows "Connected" state
7. Token expires next day 6 AM IST → user prompted to re-auth at login
```

### 4.3 AngelOne SmartAPI Flow
```
1. User enters: API key, client ID, MPIN, TOTP secret
2. Express endpoint `/api/auth/angelone/connect`:
   a. Generates current TOTP
   b. POSTs to SmartAPI /user/login
   c. Gets JWT token + feed token
   d. Encrypts and stores in broker_connections
3. Token valid for 24 hours, auto-refreshed via scheduled cron job
```

### 4.4 Claude API Integration
```
POST /v1/messages
Model: claude-sonnet-4-20250514
System prompt: Trading coach persona with specific output format
User message: Structured trade data summary
Max tokens: 1000
Temperature: default
```

---

## 5. State Management Architecture

```
Zustand Store
├── authStore         → user, session, loading
├── tradeStore        → trades[], filters, selectedTrade
├── journalStore      → entries[], currentDate
├── strategyStore     → strategies[]
├── brokerStore       → connections, syncStatus, lastSyncTime
├── insightStore      → insights[]
└── uiStore           → page, sidebarOpen, modal state

TanStack Query Cache (If used alongside Zustand)
├── trades (paginated, filtered)
├── journal entries
├── strategies
├── ai insights
└── broker connection status
```

---

## 6. Frontend Architecture

```
src/
├── main.tsx
├── App.tsx                    # Routes + auth guard
├── components/
│   ├── ui/                    # Reusable: Button, Input, Modal, Badge, Card
│   ├── charts/                # PnLCurve, DisciplinePie, StrategyBar
│   ├── trade/                 # TradeRow, TradeModal, TradeAnnotationForm
│   ├── journal/               # JournalForm, MoodSelector, DisciplineRater
│   └── layout/                # Sidebar, Header, PageWrapper
├── pages/
│   ├── Dashboard.tsx
│   ├── Trades.tsx
│   ├── Journal.tsx
│   ├── AICoach.tsx
│   ├── Strategies.tsx
│   ├── Settings.tsx
│   └── auth/
│       ├── Login.tsx
│       └── Signup.tsx
├── hooks/
│   ├── useTrades.ts           # Query wrappers
│   ├── useJournal.ts
│   ├── useAICoach.ts
│   └── useBroker.ts
├── lib/
│   ├── api.ts                 # Axios / Fetch client
│   ├── analytics.js           # Stats computation
│   └── formatters.js          # Date, currency formatters
└── stores/
    ├── authStore.ts
    ├── tradeStore.ts
    └── strategyStore.ts
```

---

## 7. Security Architecture

See Security & Access Document for full details.

Key points:
- Broker API keys never stored in plain text — AES-256 encrypted using crypto utilities
- Kite access tokens valid for 1 day; stored encrypted, deleted on disconnect
- All API calls are routed through the Express backend, never directly from client
- Claude API key stored as an environment variable on the server (never exposed to frontend)
- JWT tokens used for all API authentication with HttpOnly cookies or Bearer tokens

---

## 8. Performance Targets

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5s |
| Dashboard load (with data) | < 2s |
| Trade sync (500 trades) | < 10s |
| AI analysis response | < 8s |
| Database query P95 | < 200ms |

---

## 9. Deployment Pipeline

```
Developer → GitHub PR → GitHub Actions CI
                         ↓
                    Lint + Tests
                         ↓
                    Vercel / Render Preview Deploy
                         ↓
                    PR Review + Approval
                         ↓
                    Merge to main
                         ↓
                    Production Deploy
                    + Drizzle migrations run
```

---

## 10. Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
```

### Backend Secrets (.env)
```
DATABASE_URL=               # Neon DB connection string
JWT_SECRET=                 # Custom JWT signature secret
ANTHROPIC_API_KEY=
ZERODHA_API_SECRET=
ZERODHA_API_KEY=
ENCRYPTION_KEY=             # AES-256 key for broker token encryption
RESEND_API_KEY=
```

Note: Broker API keys per-user are stored encrypted in the database (not environment variables). The above `ZERODHA_API_KEY/SECRET` is the platform's app-level Kite Connect subscription key.

---

*Document Owner: Pritam | Updated: June 2026*
