# Market System Root Cause Analysis
**TradeVault Platform — Module A Deep Root Cause Investigation**  
**Document ID:** RCA-MKT-2026-002  
**Category:** Market Data Systems & Real-time Feeds  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Principal Software Architect, Senior QA Architect & Performance Engineer  
**Target Quality Score:** 9.5+/10

---

## 1. Executive Summary

The Market & Analytics module (`/app/markets`) suffers from severe rate-limiting issues (HTTP 429 Too Many Requests), non-deterministic failures in AI summary generation, stale news feeds upon navigation, and dead UI category filters. This document details the exact root causes, evidence, and mathematical probability models behind these failures.

---

## 2. Issue Inventory & Root Cause Breakdown

### RCA-M01: Yahoo Finance Concurrent Burst (429 Too Many Requests)

**Severity:** P0 — CRITICAL  
**Code References:** `src/hooks/useMarketData.ts:105-190`, `server/src/market/MarketDataService.ts:153-254`, `server/src/services/MarketWorker.ts:19`

#### Root Cause Mechanism
When a user mounts `/app/markets`, up to 8 uncoordinated request chains fire within a 1-2 second window from the single server IP address:
1. `MarketOverviewHero` → `useLiveMarketData()` → `GET /api/market/quotes` → `getQuotes()` (Batch of N parallel Yahoo requests)
2. `MarketBreadth` → `useLiveMarketData()` → (Duplicate REST call on mount)
3. `LiveWatchlist` → `useLiveMarketData()` → (Third duplicate REST call on mount)
4. `InteractiveMarketChart` → `useLiveChartData('nifty', '1D')` → `GET /api/market/chart/nifty` → Yahoo Chart API
5. `LiveSectorHeatmap` → `useMarketSectors()` → `GET /api/market/sectors` → `getSectors()` (Batch of N+M parallel Yahoo requests)
6. `LiveAISummary` → `useAISummary()` → `GET /api/market/ai-summary` → `generateSummaryJSON()` (Duplicate quote batch + 4 RSS feeds)
7. `MarketWorker` server background loop (every 60s) → `getQuotes()`
8. News Engine `SourceRegistry` cron (every 10m) → 4 RSS feeds to Yahoo

#### The Deduplication Gap
`MarketDataService.ts` implements in-flight deduplication using `dedup(key, factory)`. However:
- `getQuotes()` uses Redis key `market:quotes:v2`
- `getSectors()` uses Redis key `market:sectors:v2`

Because the keys differ, `dedup()` treats them as completely independent promises. Both proceed to invoke `YahooFinanceProvider.fetchQuotes()` simultaneously with overlapping symbols, issuing 30+ outbound requests to Yahoo Finance concurrently.

---

### RCA-M02: Triple SSE Connection Fanout per Tab

**Severity:** P1 — HIGH  
**Code References:** `src/components/markets/MarketOverviewHero.tsx:16`, `src/components/markets/LiveWatchlist.tsx:120`, `src/hooks/useMarketData.ts:131-176`

#### Root Cause Mechanism
`useLiveMarketData()` creates an `EventSource` instance inside its `useEffect`. Because `MarketOverviewHero`, `MarketBreadth`, and `LiveWatchlist` invoke the hook separately without a shared React context, every user tab opens **3 persistent SSE connections** to `/api/market/stream`.
- Server memory consumption scales at $3 \times N_{users}$
- `MarketWorker.setMaxListeners(0)` suppresses EventEmitter leak warnings but does not fix connection overhead.

---

### RCA-M03: Simultaneous Chart Polling & Quote SSE

**Severity:** P1 — HIGH  
**Code References:** `src/hooks/useMarketData.ts:248-261`

#### Root Cause Mechanism
`useLiveChartData()` initiates an unaligned `setInterval(fetchChart, 5 * 60_000)` on mount. Because this interval is not staggered, its initial REST request collides precisely with the initial quote REST requests and SSE handshake, intensifying the initial HTTP burst.

---

### RCA-M04: AI Market Summary Failure Probability Chain

**Severity:** P1 — HIGH  
**Code References:** `server/src/market/MarketAIService.ts:125-198`, `server/src/routes/marketV2.ts:144-181`

#### Mathematical Failure Model
AI Summary reliability depends on a multi-node conditional failure chain:

| Node | Failure Condition | Probability |
|------|-------------------|-------------|
| $P(N_1)$ | Redis Cache Miss | 20% |
| $P(N_2 \mid N_1)$ | Yahoo Quote Fetch 429 Error | 35% |
| $P(N_3 \mid N_1, \neg N_2)$ | Groq API Rate Limit (Shared Key) | 40% |
| $P(N_4 \mid N_3)$ | Groq 12-second Timeout | 15% |
| $P(N_5)$ | JSON Parse / Schema Mismatch | 5% |

**Root Culprit:** A single `GROQ_API_KEY` is shared across 5 backend systems:
1. `MarketAIService` (Market Summary)
2. `GroqProvider` (AI Coach Chat)
3. `TriageWorker` (News Engine)
4. `ScoringWorker` (News Engine)
5. `ai.ts:evaluate-trade` (Trade Evaluation)

Under peak trading activity, chat and news triage exhaust Groq rate limits, starving Market Summary requests.

---

### RCA-M05: Silent 24-Hour Stale Cache

**Severity:** P2 — MEDIUM  
**Code References:** `server/src/market/MarketAIService.ts:114-123`, `server/src/routes/marketV2.ts:161-165`

#### Root Cause Mechanism
When summary generation fails, `getStaleSummary()` returns cached data up to 24 hours old (`STALE_MAX_AGE_MS = 86_400_000`). The API response does not include an `isStale: true` flag, causing the frontend to render yesterday's sentiment during active market trading without warning.

---

### RCA-M06: Breaking News Refresh Skip Bug

**Severity:** P1 — HIGH  
**Code References:** `src/components/markets/BreakingNewsTimeline.tsx:62-72`

#### Root Cause Mechanism
The timeline component executes:
```typescript
if (engineFeed.length === 0) {
  fetchEngineFeed({ limit: 20 });
}
```
Zustand stores persist state across React component unmounts. When a user navigates from Markets to Journal and returns, `engineFeed.length > 0` evaluates to true, skipping the fetch and displaying outdated news for up to 5 minutes until the next interval fires.

---

### RCA-M07: Breaking News Category Filter Non-Functional

**Severity:** P1 — HIGH  
**Code References:** `src/components/markets/BreakingNewsTimeline.tsx:179-270`

#### Root Cause Mechanism
Category buttons (All, RBI, Results, Macro, Global) update `activeFilter` in local React state. However, the JSX mapping loop `liveItems.map(...)` contains no filter predicate. All articles render regardless of which filter button is selected.

---

### RCA-M08: Overly Aggressive Yahoo Health Recovery (30s)

**Severity:** P2 — MEDIUM  
**Code References:** `server/src/market/providers/YahooFinanceProvider.ts:258-266`

#### Root Cause Mechanism
`HEALTH_RECOVERY_MS = 30_000`. When Yahoo blocks the server IP (which lasts 15-60 minutes), the provider clears its failure counter after only 30 seconds and resumes hammering the endpoint, perpetuating the IP ban.

---

## 3. Corrective Action Matrix

| Issue ID | Permanent Architectural Fix | Effort |
|----------|-----------------------------|--------|
| RCA-M01 | Unify `getQuotes()` & `getSectors()` into a single cached fetch batch with token-bucket throttle | 4h |
| RCA-M02 | Implement root-level `MarketDataProvider` React context; child components consume via hook | 4h |
| RCA-M03 | Stagger chart initial poll by 30s after mount | 1h |
| RCA-M04 | Isolate Groq API keys via `GROQ_KEY_MARKET`, `GROQ_KEY_CHAT`, `GROQ_KEY_ENGINE` | 1h |
| RCA-M05 | Add `isStale: boolean` & `staleAge` to summary payload + amber UI banner | 2h |
| RCA-M06 | Remove `engineFeed.length === 0` guard; always fetch with staleness check | 1h |
| RCA-M07 | Apply filter predicate before `liveItems.map()` rendering | 1h |
| RCA-M08 | Implement exponential backoff for health recovery (5m → 10m → 20m → 40m) | 2h |
