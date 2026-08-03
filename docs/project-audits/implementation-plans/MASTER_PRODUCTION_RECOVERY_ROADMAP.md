# Master Production Recovery Roadmap (7-Phase Blueprint)
**TradeVault Platform — Institutional Engineering Execution Plan**  
**Document ID:** PLAN-REC-2026-011  
**Category:** Implementation Plans & Execution Roadmaps  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Technical Lead & Principal Software Architect  
**Target Quality Score:** 9.5+/10

---

## 1. Executive Summary

This roadmap provides the step-by-step engineering execution blueprint to raise the TradeVault platform from its audited **5.3/10** score to **9.3+/10 institutional production quality**.

**Total Implementation Effort:** 18 – 26 Engineer Days  
**Execution Strategy:** Sequential phase delivery with verification gates at every step.

---

## 2. Seven-Phase Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│                    7-PHASE EXECUTION DEPENDENCY MAP                    │
│                                                                        │
│  [Phase 1: Critical P0 Blockers] (Days 1-3)                            │
│  - Fix AbortController Race Condition                                  │
│  - Isolate Groq API Keys (Market / Chat / News)                        │
│                           │                                            │
│                           ▼                                            │
│  [Phase 2: Market Data Architecture] (Days 4-7)                        │
│  - Unified /all-quotes Endpoint & Cache Invalidation                   │
│  - Shared React MarketDataProvider Context (1 SSE per tab)             │
│  - Exponential Backoff Health Recovery                                 │
│                           │                                            │
│                           ▼                                            │
│  [Phase 3: AI Coach V2 Core Pipeline] (Days 8-11)                      │
│  - Live Market & News Context Injection                                │
│  - Prisma Message & Conversation Pagination                            │
│  - AI-Powered Title Generation via Groq Instant                        │
│                           │                                            │
│                           ▼                                            │
│  [Phase 4: UI/UX & Interaction Polish] (Days 12-14)                   │
│  - Breaking News Category Filter Logic                                 │
│  - Sidebar Time-Bucketing & Inline Rename                              │
│  - Custom Delete Modal with 5s Undo Toast                              │
│                           │                                            │
│                           ▼                                            │
│  [Phase 5: AI Specialized Modes Sprint] (Days 15-18)                   │
│  - Implement 10 Trading Modes (Pre/Post Market, Risk, Psychology)      │
│  - Dynamic Context Injection & Token Budget Guardrails                 │
│                           │                                            │
│                           ▼                                            │
│  [Phase 6: Security & Production Hardening] (Days 19-22)               │
│  - Per-Route Redis Rate Limiting                                       │
│  - Cookie-Only Auth Standardization                                    │
│  - Structured Winston Logging & PII Removal                            │
│                           │                                            │
│                           ▼                                            │
│  [Phase 7: QA Verification & Test Suite] (Days 23-26)                  │
│  - E2E Playwright Regression Vectors                                   │
│  - Concurrency Stress Testing & Load Sign-off                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Phase Task Breakdowns

### Phase 1 — Critical Stability & Race Conditions (Days 1-3)
- [ ] **Task 1.1:** Refactor `src/stores/insightStore.ts` to maintain an active AbortController map keyed by conversation ID.
- [ ] **Task 1.2:** Split environment variables in `server/.env` to define `GROQ_KEY_MARKET`, `GROQ_KEY_CHAT`, and `GROQ_KEY_ENGINE`.
- [ ] **Task 1.3:** Update `MarketAIService`, `GroqProvider`, and `NewsEngine` to utilize dedicated client instances.

### Phase 2 — Market Module Overhaul (Days 4-7)
- [ ] **Task 2.1:** Implement unified quote + sector fetching in `MarketDataService.ts` using key `market:all-quotes:v2`.
- [ ] **Task 2.2:** Build `MarketDataProvider` React context in `src/context/MarketDataContext.tsx`.
- [ ] **Task 2.3:** Refactor `MarketOverviewHero`, `MarketBreadth`, and `LiveWatchlist` to consume shared context.
- [ ] **Task 2.4:** Replace 30s fixed health recovery in `YahooFinanceProvider.ts` with exponential backoff (5m to 60m).

### Phase 3 — AI Coach V2 Core Infrastructure (Days 8-11)
- [ ] **Task 3.1:** Replace `marketSnapshot = null` in `server/src/routes/ai.ts` with live market cache and top news headlines.
- [ ] **Task 3.2:** Implement cursor-based pagination in Prisma conversation/message endpoints (`take: 50`).
- [ ] **Task 3.3:** Upgrade `/api/ai/generate-title` to query fast `llama-3.1-8b-instant` LLM.
- [ ] **Task 3.4:** Fix export function in `insightStore.ts` to fetch message history on demand for inactive threads.

### Phase 4 — UI/UX & Interaction Polish (Days 12-14)
- [ ] **Task 4.1:** Fix category filter predicate in `BreakingNewsTimeline.tsx`.
- [ ] **Task 4.2:** Implement time-bucketed sidebar categories in `AICoachSidebar.tsx` (Today / Yesterday / This Week / Older).
- [ ] **Task 4.3:** Add inline click-to-edit rename and custom confirmation modal for conversation deletion.
- [ ] **Task 4.4:** Wire `ThumbsUp` and `ThumbsDown` buttons to `POST /api/ai/feedback`.

### Phase 5 — Specialized Intelligence Modes (Days 15-18)
- [ ] **Task 5.1:** Implement UI Mode Selector bar in `AIChatWorkspace.tsx`.
- [ ] **Task 5.2:** Build specialized system prompt branches in `promptBuilder.ts` for all 10 trading modes.
- [ ] **Task 5.3:** Enforce token budget compressor (<8k tokens) on trade history and journal logs.

### Phase 6 — Security & Hardening (Days 19-22)
- [ ] **Task 6.1:** Install and configure `express-rate-limit` with Redis storage on AI and Market endpoints.
- [ ] **Task 6.2:** Remove `localStorage` token fallback in `aiStreamClient.ts`; standardize on `HttpOnly` cookies.
- [ ] **Task 6.3:** Replace raw `console.log` statements in routes with Winston structured logging.
- [ ] **Task 6.4:** Build public `/health` and protected `/api/admin/system-health` diagnostics endpoints.

### Phase 7 — Verification & Automated Testing (Days 23-26)
- [ ] **Task 7.1:** Execute full Playwright E2E test suite covering live quote streaming and chat interruption.
- [ ] **Task 7.2:** Run load-testing script simulating 100 concurrent SSE subscribers.
- [ ] **Task 7.3:** Perform final security audit and obtain production sign-off.
