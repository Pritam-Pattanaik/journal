# QA Test Strategy & Failure Mode Matrix (FMEA)
**TradeVault Platform — Quality Assurance & Verification Architecture**  
**Document ID:** QA-FMEA-2026-006  
**Category:** Quality Assurance & Testing Standards  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Senior QA Architect & Principal Systems Engineer  
**Target Quality Score:** 9.5+/10

---

## 1. Quality Assurance Strategy & Test Pyramid

TradeVault enforces a zero-regression, evidence-based testing pipeline across all real-time and AI workloads:

```
                      ┌────────────────────────┐
                      │    Playwright E2E      │ (Critical User Flows)
                      │ - Market Live Stream   │
                      │ - AI Chat & Stop Gen   │
                      ├────────────────────────┤
                      │   Integration Tests    │ (Route & Redis Layer)
                      │ - MarketDataService    │
                      │ - Provider Waterfall   │
                      ├────────────────────────┤
                      │     Unit Test Suite    │ (Pure Functions)
                      │ - Deduplication Logic  │
                      │ - Prompt Builder       │
                      └────────────────────────┘
```

---

## 2. Failure Mode and Effects Analysis (FMEA Matrix)

| Failure Mode | Severity | Probability | Detection | Root Cause ID | Automated Test Vector | Verification Criterion |
|--------------|----------|-------------|-----------|---------------|------------------------|------------------------|
| **Yahoo 429 Surge** | Critical | High | Sentry 429 Alert | RCA-M01 | Mount 5 tabs concurrently | All tabs share 1 cached backend fetch |
| **Stream Corruption** | Critical | High | Token Parser Crash | RCA-A01 | Click Regenerate at $t = 500\text{ms}$ | Only 1 clean assistant bubble rendered |
| **Silent Stale Summary** | High | Medium | UI Staleness Check | RCA-M05 | Disconnect Yahoo API mock | Amber banner indicates data age |
| **Breaking News Skip** | High | High | Visual Timeline Diff | RCA-M06 | Navigate Markets → Journal → Markets | Fresh feed request emitted on mount |
| **Dead Filter UI** | High | Certain | Filter Click Assert | RCA-M07 | Click "RBI" category pill | Only RBI-tagged articles visible |
| **Triple SSE per Tab** | High | Certain | Network Tab Count | RCA-M02 | Mount Markets overview page | Exactly 1 SSE `/api/market/stream` |
| **Inactive Export Null** | Medium | High | Download Size Check | RCA-A06 | Export sidebar item #3 | Markdown file contains full message transcript |
| **Event Bus Dropped Action** | Medium | Medium | Action Listener Mock | RCA-A07 | Simulate 300ms slow render | Quick action prompt successfully submitted |

---

## 3. High-Risk Concurrency Test Vectors

### 3.1 Test Case TC-AI-01: Rapid Stream Interruption & Regeneration
```typescript
test('should cleanly abort previous stream when regenerate is clicked', async ({ page }) => {
  await page.goto('/app/ai-coach');
  await page.fill('[data-testid="ai-chat-input"]', 'Analyze my recent trades in Bank Nifty');
  await page.click('[data-testid="ai-send-button"]');

  // Wait for first token stream to initiate
  await page.waitForSelector('[data-testid="ai-streaming-indicator"]');
  
  // Interrupt immediately with regenerate
  await page.click('[data-testid="ai-regenerate-button"]');

  // Verify only one assistant message is present in DOM
  const assistantBubbles = await page.$$('[data-testid="ai-message-assistant"]');
  expect(assistantBubbles.length).toBe(1);

  // Verify no duplicate message saved in database
  const dbMessages = await fetchConversationMessages(convId);
  expect(dbMessages.filter(m => m.role === 'assistant').length).toBe(1);
});
```

### 3.2 Test Case TC-MKT-01: Network Offline & Stale Fallback Handshake
```typescript
test('should render stale cache gracefully during network blackout', async ({ page, context }) => {
  await page.goto('/app/markets');
  await page.waitForSelector('[data-testid="market-hero-card"]');

  // Simulate network offline
  await context.setOffline(true);

  // Assert UI enters offline resilience mode without crashing
  await expect(page.locator('[data-testid="market-status-indicator"]')).toContainText('Offline (Cached Data)');
  await expect(page.locator('[data-testid="market-hero-card"]')).toBeVisible();

  // Restore network
  await context.setOffline(false);
  await expect(page.locator('[data-testid="market-status-indicator"]')).toContainText('Live');
});
```
