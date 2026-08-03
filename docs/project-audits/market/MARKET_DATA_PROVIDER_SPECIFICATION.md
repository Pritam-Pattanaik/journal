# Market Data Provider Specification & Waterfall Architecture
**TradeVault Platform — Institutional Data Pipeline & Provider Fallback**  
**Document ID:** SPEC-MKT-2026-003  
**Category:** Market Feeds & Provider Specifications  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Principal Software Architect & Trading Platform Engineer  
**Target Quality Score:** 9.5+/10

---

## 1. Provider Waterfall Architecture

TradeVault orchestrates multiple data sources through a fault-tolerant waterfall pipeline. The frontend and Express route handlers never interact directly with individual data providers. All data requests flow through the singleton `MarketDataService`.

```
                  ┌───────────────────────┐
                  │   Incoming Request    │
                  │ (getQuotes/getSectors)│
                  └───────────┬───────────┘
                              │
                    [Check Redis Cache]
                     ├── HIT  ──► Return Cached JSON
                     └── MISS ──► Proceed to Waterfall
                              │
                  ┌───────────▼───────────┐
                  │ 1. YahooFinanceProvider│ (Primary Real-time)
                  │    - v8 Chart API      │
                  │    - Multi-Symbol Batch│
                  └───────────┬───────────┘
                     ├── SUCCESS ──► Update Redis + Stale Cache ──► Return
                     └── FAILURE ──► Increment Fail Count (Backoff)
                              │
                  ┌───────────▼───────────┐
                  │ 2. MoneyControlProvider│ (Secondary Fallback)
                  │    - Indian Indices    │
                  │    - Sector Breadth    │
                  └───────────┬───────────┘
                     ├── SUCCESS ──► Update Redis + Stale Cache ──► Return
                     └── FAILURE ──► Switch Active Provider
                              │
                  ┌───────────▼───────────┐
                  │ 3. InvestingComProvider│ (Tertiary Fallback)
                  │    - Global & Macro    │
                  │    - Commodities       │
                  └───────────┬───────────┘
                     ├── SUCCESS ──► Update Redis + Stale Cache ──► Return
                     └── FAILURE ──► Proceed to Fallback Layer
                              │
                  ┌───────────▼───────────┐
                  │ 4. Stale In-Memory    │ (Resilience Layer)
                  │    - Last-Known-Good   │
                  │    - Max Age: 5 Mins   │
                  └───────────────────────┘
```

---

## 2. Tracked Symbols & Instrument Taxonomy

### 2.1 Core Benchmark Indices (`TRACKED_SYMBOLS`)
| Symbol ID | Display Name | Yahoo Ticker | MoneyControl ID | Exchange | Status Type |
|-----------|--------------|--------------|-----------------|----------|-------------|
| `nifty` | NIFTY 50 | `^NSEI` | `in;NSX` | NSE | Market Hours (09:15-15:30 IST) |
| `sensex` | SENSEX | `^BSESN` | `in;SEN` | BSE | Market Hours (09:15-15:30 IST) |
| `banknifty` | BANK NIFTY | `^NSEBANK` | `in;NBX` | NSE | Market Hours (09:15-15:30 IST) |
| `finnifty` | NIFTY FIN SERVICE | `NIFTY_FIN_SERVICE.NS` | `in;NFS` | NSE | Market Hours (09:15-15:30 IST) |
| `midcap` | NIFTY MIDCAP 100 | `NIFTY_MIDCAP_100.NS` | `in;MID` | NSE | Market Hours (09:15-15:30 IST) |
| `vix` | INDIA VIX | `^INDIAVIX` | `in;VIX` | NSE | Market Hours (09:15-15:30 IST) |

### 2.2 Global, Commodities & Currencies
| Symbol ID | Display Name | Yahoo Ticker | Asset Class | Trading Window |
|-----------|--------------|--------------|-------------|----------------|
| `gold` | Gold (MCX / Spot) | `GC=F` | Commodity | 24/7 / Extended |
| `silver` | Silver | `SI=F` | Commodity | 24/7 / Extended |
| `crude` | Crude Oil WTI | `CL=F` | Commodity | 24/7 / Extended |
| `usdinr` | USD / INR | `INR=X` | Forex | 24/7 |

### 2.3 Sectoral Symbol Definitions (`SECTOR_SYMBOLS`)
| Sector ID | Sector Name | Yahoo Ticker |
|-----------|-------------|--------------|
| `sector-it` | NIFTY IT | `^CNXIT` |
| `sector-auto` | NIFTY Auto | `^CNXAUTO` |
| `sector-pharma` | NIFTY Pharma | `^CNXPHARMA` |
| `sector-fmcg` | NIFTY FMCG | `^CNXFMCG` |
| `sector-metal` | NIFTY Metal | `^CNXMETAL` |
| `sector-realty` | NIFTY Realty | `^CNXREALTY` |
| `sector-energy` | NIFTY Energy | `^CNXENERGY` |
| `sector-infra` | NIFTY Infra | `^CNXINFRA` |

---

## 3. Caching & Request Coalescing Specifications

### 3.1 Redis Cache Key Taxonomy
| Data Category | Redis Cache Key | TTL | Invalidation Trigger |
|---------------|-----------------|-----|----------------------|
| Unified Quotes | `market:all-quotes:v2` | 60 sec | Auto-expiry / Force refresh |
| Benchmark Quotes | `market:quotes:v2` | 60 sec | Synchronized with `all-quotes` |
| Sector Performance | `market:sectors:v2` | 60 sec | Synchronized with `all-quotes` |
| Intraday Chart (1D) | `market:chart:v2:{symbol}:5m:1d` | 300 sec | Auto-expiry |
| Historical Chart (1W/1M) | `market:chart:v2:{symbol}:1d:{range}` | 3600 sec | Daily auto-expiry |
| AI Market Summary | `market:ai-summary:v2` | 300 sec | Auto-expiry / New trading session |

### 3.2 In-Flight Request Deduplication Algorithm
```typescript
const inFlight = new Map<string, Promise<any>>();

function dedup<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = factory().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
```

---

## 4. Rate-Limiting & Circuit Breaker Policy

### 4.1 Token Bucket Algorithm for Yahoo Provider
- **Bucket Capacity:** 10 tokens
- **Refill Rate:** 1 token every 2 seconds (Max 30 requests/minute)
- **Burst Limit:** Up to 10 requests allowed simultaneously on cache miss; subsequent requests queued.

### 4.2 Exponential Backoff Recovery Schedule
When a provider encounters 3 consecutive failures ($N_{fail} \ge 3$):
$$\text{Recovery Delay (ms)} = \min\left(300{,}000 \times 2^{N_{fail} - 3},\; 3{,}600{,}000\right)$$

- Failure 3: 5 Minutes backoff
- Failure 4: 10 Minutes backoff
- Failure 5: 20 Minutes backoff
- Failure 6+: 60 Minutes maximum backoff cap
- Reset: On first successful response, $N_{fail} \to 0$.
