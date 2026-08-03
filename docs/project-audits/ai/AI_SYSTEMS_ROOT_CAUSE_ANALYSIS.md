# AI Systems Root Cause Analysis & Architecture Audit
**TradeVault Platform — Module B Deep Root Cause Investigation**  
**Document ID:** RCA-AI-2026-005  
**Category:** AI Streaming & State Management  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** AI Systems Architect & Senior QA Engineer  
**Target Quality Score:** 9.5+/10

---

## 1. Executive Summary

The AI Coach module (`/app/ai-coach`) features an advanced UI layout and conversation persistence via Prisma, but suffers from stream corruption during concurrent operations, a complete lack of real-time market data awareness, unpaginated database queries, and race-prone client-side event communication.

---

## 2. Issue Inventory & Root Cause Breakdown

### RCA-A01: Module-Level AbortController Race Condition

**Severity:** P0 — CRITICAL  
**Code References:** `src/stores/insightStore.ts:46, 201, 287`

#### Root Cause Mechanism
`abortController` is defined at module scope outside the Zustand store:
```typescript
let abortController: AbortController | null = null;
```
When `sendMessage()` and `regenerateResponse()` are triggered in rapid succession:
1. User clicks "Send", creating Controller A. Token stream starts writing to `streamingMessage`.
2. User clicks "Regenerate" before Stream A finishes, replacing `abortController` with Controller B.
3. Stream A becomes an orphaned, un-abortable background promise.
4. Both Stream A and Stream B write to the same Zustand `streamingMessage` state simultaneously via `onToken(accumulated)`.
5. Tokens interleave, producing corrupted, incoherent responses and duplicate assistant messages in the database.

---

### RCA-A02: Hardcoded Null Market Snapshot (Market Blindness)

**Severity:** P1 — HIGH  
**Code References:** `server/src/routes/ai.ts:247`

#### Root Cause Mechanism
```typescript
// We can fetch live market data if available (placeholder for actual implementation)
const marketSnapshot = null; 
```
The AI Coach prompt builder skips market context injection entirely when `marketSnapshot` is null. As a result, the AI cannot answer:
- Current Nifty / Bank Nifty levels or market sentiment
- Overnight global market gap impacts
- Breaking news correlations with user trade performance

---

### RCA-A03: Redundant CoachMemory Database Fetching

**Severity:** P2 — MEDIUM  
**Code References:** `src/stores/insightStore.ts:236-237`

#### Root Cause Mechanism
`sendMessage()` executes `get().fetchCoachMemory()` in its `finally` block on every single message turn. Coach memory patterns change only during automated trade evaluations. Querying Prisma for coach memory on every chat interaction creates unneeded DB I/O.

---

### RCA-A04 & RCA-A05: Absence of Message & Session Pagination

**Severity:** P2 — MEDIUM  
**Code References:** `server/src/routes/ai.ts:26-41, 59-73`

#### Root Cause Mechanism
Prisma queries fetch all conversations and all messages without `take` or `skip` limits. For power users with 500+ messages in a thread, the backend serializes the entire history into a massive JSON payload on every conversation switch.

---

### RCA-A06: Export Fails for Non-Active Conversations

**Severity:** P2 — MEDIUM  
**Code References:** `src/stores/insightStore.ts:157-176`

#### Root Cause Mechanism
`exportConversation(id)` inspects `state.messages`, which contains only the messages of `activeConversationId`. Attempting to export an inactive conversation from the sidebar context menu exports an empty file.

---

### RCA-A07: Quick Action Event Bus 100ms Timeout Race

**Severity:** P2 — MEDIUM  
**Code References:** `src/pages/AICoach.tsx`, `src/components/ai/AIChatWorkspace.tsx:76-85`

#### Root Cause Mechanism
Quick actions dispatch global events via `window.dispatchEvent(new CustomEvent('ai-quick-action'))` wrapped in `setTimeout(..., 100)`. If workspace rendering takes longer than 100ms on low-spec hardware, the event fires before the event listener mounts and is lost.

---

### RCA-A08: Dead UI ThumbsUp / ThumbsDown Feedback Buttons

**Severity:** P2 — MEDIUM  
**Code References:** `src/components/ai/AIChatWorkspace.tsx:51-56`

#### Root Cause Mechanism
Feedback buttons render icons with hover styles but lack `onClick` handlers or backend persistence, losing critical reinforcement feedback data.

---

### RCA-A09: Substring Truncation Titled as "Auto-Generated"

**Severity:** P3 — LOW  
**Code References:** `server/src/routes/ai.ts:150-180`

#### Root Cause Mechanism
The `/generate-title` endpoint executes `cleanMsg.substring(0, 60) + '...'` rather than calling the LLM, producing truncated user prompts instead of meaningful semantic conversation titles.

---

## 3. Corrective Action Matrix

| Issue ID | Permanent Architectural Fix | Effort |
|----------|-----------------------------|--------|
| RCA-A01 | Map abort controllers per conversation in Zustand (`Map<string, AbortController>`) | 3h |
| RCA-A02 | Inject `marketWorker.getCache()` and top news headlines directly into chat context | 2h |
| RCA-A03 | Decouple `fetchCoachMemory()` to mount and 5-minute background polling | 1h |
| RCA-A04/05 | Add cursor-based pagination to Prisma queries (`take: 50`) + Infinite Scroll UI | 4h |
| RCA-A06 | Fetch inactive conversation messages via REST before exporting | 2h |
| RCA-A07 | Replace window event bus with direct React props (`onSelectAction`) | 1h |
| RCA-A08 | Implement `POST /api/ai/feedback` endpoint and wire onClick handlers | 2h |
| RCA-A09 | Connect title generation to fast Groq `llama-3.1-8b-instant` endpoint | 2h |
