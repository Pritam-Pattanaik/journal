# Performance Audit & Latency Optimization Plan
**TradeVault Platform — High-Throughput & Low-Latency Performance Architecture**  
**Document ID:** PERF-AUDIT-2026-009  
**Category:** Performance Engineering & Latency SLAs  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Performance Engineer & Principal Architect  
**Target Quality Score:** 9.5+/10

---

## 1. Executive Summary & Latency SLAs

Active financial trading applications require sub-second UI updates and instantaneous AI feedback. This audit identifies all network waterfalls, unindexed database queries, redundant serializations, and streaming bottlenecks.

### Target Performance SLAs
- **Market Data Time-To-First-Render (TTFR):** $< 1.5\text{s}$ on cold load; $< 100\text{ms}$ on warm cache
- **Redis Cache Hit Latency:** $< 15\text{ms}$
- **AI Streaming Time-To-First-Byte (TTFB):** $< 450\text{ms}$ on Groq Llama-3.3-70b
- **Database Query Latency ($p_{95}$):** $< 25\text{ms}$ for paginated trade records
- **Client Render Frame Rate:** Constant 60fps during live SSE updates

---

## 2. Bottlenecks & Optimization Strategies

### 2.1 Request Waterfall Consolidation

```
BEFORE (Serial Burst):
[Mount] ──► GET /quotes ──────► [Yahoo Batch 1] (2.4s)
        ──► GET /sectors ─────► [Yahoo Batch 2] (2.8s)  Total: 30+ Requests
        ──► GET /chart ───────► [Yahoo Chart]   (1.2s)

AFTER (Unified Coalescing):
[Mount] ──► GET /all-quotes ──► [Redis Hit / Single Yahoo Batch] (0.8s)
        ──► Staggered Chart (Delayed 30s)               Total: 1 Request
```

### 2.2 Database Query Optimization & Pagination
```typescript
// Optimized Prisma cursor pagination for message history
export async function getConversationMessages(conversationId: string, cursor?: string) {
  return prisma.aiMessage.findMany({
    where: { conversationId },
    take: 50,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}
```

### 2.3 Eliminating UI Skeleton Loader Flash
- Maintain `lastFetchedAt` in Zustand stores.
- If store already holds $>0$ items on component mount, initialize with `loading: false` to render existing data immediately, executing the fetch in the background.
