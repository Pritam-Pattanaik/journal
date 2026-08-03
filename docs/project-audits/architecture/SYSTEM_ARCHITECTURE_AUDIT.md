# System Architecture Audit & Dependency Map
**TradeVault Platform — Version 2.0 Engineering Architecture**  
**Document ID:** ARCH-2026-001  
**Category:** Architecture & System Topology  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Principal Software Architect & AI Systems Engineer  
**Target Quality Score:** 9.5+/10

---

## 1. System Topology Overview

TradeVault is an institutional-grade trading journal and live market intelligence platform tailored for Indian financial markets (NSE/BSE).

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                       │
│                                                                         │
│   ┌─────────────────────┐   ┌──────────────────────┐   ┌────────────┐   │
│   │    /app/markets     │   │    /app/ai-coach     │   │ /app/journal│  │
│   │ (Market Overview,   │   │ (Trading Mentor V2,  │   │ (Trades,   │   │
│   │  Chart, Breadth,    │   │  Context Sync,       │   │  Analytics,│   │
│   │  Sectors, News)     │   │  Discipline Review)  │   │  P&L)      │   │
│   └──────────┬──────────┘   └──────────┬───────────┘   └─────┬──────┘   │
│              │ (Context Hook)          │ (Stream Client)     │ (REST)   │
└──────────────┼─────────────────────────┼─────────────────────┼──────────┘
               │                         │                     │
               ▼                         ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Express + TS)                        │
│                                                                         │
│   ┌─────────────────────┐   ┌──────────────────────┐   ┌────────────┐   │
│   │   Market Router     │   │      AI Router       │   │  Auth &    │   │
│   │   (/api/market/*)   │   │    (/api/ai/*)       │   │  Journal   │   │
│   └──────────┬──────────┘   └──────────┬───────────┘   └─────┬──────┘   │
│              │                         │                     │          │
│   ┌──────────▼──────────┐   ┌──────────▼───────────┐         │          │
│   │  MarketDataService  │   │  PromptBuilder &     │         │          │
│   │  (Waterfall + Dedup)│   │  ProviderFactory     │         │          │
│   └──────────┬──────────┘   └──────────┬───────────┘         │          │
│              │                         │                     │          │
│   ┌──────────▼──────────┐   ┌──────────▼───────────┐   ┌─────▼──────┐   │
│   │    MarketWorker     │   │  News Engine Workers │   │ Prisma ORM │   │
│   │ (SSE Broadcaster)   │   │ (Triage & Scoring)   │   │ (Postgres) │   │
│   └─────────────────────┘   └──────────────────────┘   └────────────┘   │
└──────────────┬─────────────────────────┬─────────────────────┬──────────┘
               │                         │                     │
               ▼                         ▼                     ▼
┌───────────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│   REDIS CACHE LAYER       │ │  EXTERNAL AI LLMS  │ │  MARKET PROVIDERS  │
│ - market:quotes:v2        │ │ - Groq (Llama-3.3) │ │ - Yahoo Finance    │
│ - market:sectors:v2       │ │ - Anthropic/Claude │ │ - MoneyControl     │
│ - market:ai-summary:v2    │ │ - Future: Nemotron │ │ - Investing.com    │
│ - In-Memory Stale Fallback│ │                    │ │ - News RSS Feeds   │
└───────────────────────────┘ └────────────────────┘ └────────────────────┘
```

---

## 2. Module A — Market & Analytics Dependency Map

### 2.1 Component-to-Provider Flow

```
MARKETS PAGE (src/pages/Markets.tsx)
 │
 ├── [Overview Tab]
 │    ├── MarketOverviewHero
 │    │    └── useLiveMarketData() [Hook]
 │    │         ├── GET /api/market/quotes (Initial Load)
 │    │         └── SSE /api/market/stream (Live Quote Push)
 │    │              └── MarketWorker.ts (EventEmitter)
 │    │                   └── MarketDataService.getQuotes() (60s loop)
 │    │                        ├── Redis (market:quotes:v2 - TTL 60s)
 │    │                        └── YahooFinanceProvider.fetchQuotes()
 │    │                             └── Yahoo v8 Finance API (Parallel Batch)
 │    │
 │    ├── InteractiveMarketChart
 │    │    └── useLiveChartData(symbol, timeframe) [Hook]
 │    │         └── GET /api/market/chart/:symbol (Mount + 5m Polling)
 │    │              └── MarketDataService.getChart()
 │    │                   ├── Redis (market:chart:v2 - TTL based on interval)
 │    │                   └── YahooFinanceProvider.fetchChart()
 │    │
 │    ├── LiveAISummary
 │    │    └── useAISummary() [Hook]
 │    │         └── GET /api/market/ai-summary
 │    │              ├── Redis (market:ai-summary:v2 - TTL 300s)
 │    │              └── MarketAIService.generateSummaryJSON()
 │    │                   ├── MarketDataService.getQuotes()
 │    │                   ├── YahooNewsService.getMarketNews()
 │    │                   └── GroqProvider (llama-3.3-70b-versatile)
 │    │
 │    ├── MarketBreadth
 │    │    └── useLiveMarketData() [Duplicate Hook Instance]
 │    │
 │    └── LiveSectorHeatmap
 │         └── useMarketSectors() [Hook]
 │              └── GET /api/market/sectors (Mount + 2m Polling)
 │                   └── MarketDataService.getSectors()
 │                        ├── Redis (market:sectors:v2 - TTL 120s)
 │                        └── YahooFinanceProvider.fetchQuotes(TRACKED + SECTOR)
 │
 └── [News Tab]
      └── BreakingNewsTimeline
           └── useNewsStore / engineFeed (Zustand)
                └── GET /api/news-engine/feed
                     └── Prisma / Ingested News Pipeline
```

---

## 3. Module B — AI Coach Architecture

### 3.1 Context Hydration & Streaming Map

```
AI COACH PAGE (src/pages/AICoach.tsx)
 │
 ├── AICoachSidebar
 │    └── useInsightStore
 │         ├── GET /api/ai/conversations (Fetch Session List)
 │         ├── POST /api/ai/conversations (Create New Session)
 │         ├── DELETE /api/ai/conversations/:id (Delete Session)
 │         ├── PUT /api/ai/conversations/:id (Rename Session)
 │         └── PATCH /api/ai/conversations/:id/pin (Pin Session)
 │
 └── AIChatWorkspace
      └── useInsightStore.sendMessage(prompt)
           ├── Optimistic UI Update (User Message Appended)
           └── streamAIInference() [POST /api/ai/chat]
                │
                ├── Route Handler (server/src/routes/ai.ts)
                │    ├── Prisma: Load Trade History (take: 100)
                │    ├── Prisma: Load Journal Entries (take: 30)
                │    ├── Prisma: Load Active CoachMemory
                │    ├── Live Market Snapshot (marketWorker.getCache())
                │    └── promptBuilder.buildConversationContext()
                │
                ├── Provider Layer (server/src/lib/ai/providerFactory.ts)
                │    └── GroqProvider.streamChat()
                │         └── groq.chat.completions.create(stream: true)
                │
                └── SSE Token Response (data: {"chunk": "..."})
                     └── Client onToken Callback -> Zustand streamingMessage
                          └── Stream Completion -> Prisma save assistant message
```

---

## 4. Key Architectural Flaws Identified

1. **Uncoordinated Component Data Fetching:** Frontend components instantiate independent hooks with distinct SSE connections and polling timers, overloading the backend.
2. **Cache Key Disjointedness:** `getQuotes()` and `getSectors()` query overlapping symbols but utilize separate cache keys, defeating in-flight request deduplication.
3. **Module-Level Variable Scope:** `abortController` in `insightStore.ts` violates concurrency safety principles, causing token interleaving during stream regeneration.
4. **Blind AI Context Pipeline:** `marketSnapshot` in `ai.ts` was hardcoded to `null`, completely isolating the AI reasoning engine from real-time market data.

---

## 5. Target Architecture V2 Principles

- **Single Shared Context:** All market visual components consume data from a unified `MarketDataProvider`.
- **Unified Batching:** Sector and benchmark quotes share a single synchronized fetch pipeline.
- **Per-Session State Encapsulation:** Abort signals and streaming tokens are mapped strictly to unique conversation IDs.
- **Deep Market Integration:** Real-time benchmark quotes, sector breadths, and top news headlines are injected into every AI conversation turn.
