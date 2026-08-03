# Scalability Assessment & Deployment Architecture
**TradeVault Platform — Multi-Instance Horizontal Scaling & Operations**  
**Document ID:** DEP-SCALE-2026-010  
**Category:** Infrastructure, Scalability & Deployment  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Principal Infrastructure & DevOps Engineer  
**Target Quality Score:** 9.5+/10

---

## 1. Scalability Assessment (Current State vs Target)

### Can the current architecture scale to thousands of concurrent users?
**Answer:** No. In its pre-audit state, single-process SSE in-memory broadcasting, single-IP Yahoo Finance dependence, and a single shared Groq API key cap maximum concurrency at approximately **50-100 active users**.

### Bottleneck Breakdown & Multi-Instance Target

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MULTI-INSTANCE TARGET TOPOLOGY                     │
│                                                                         │
│                         [Cloudflare / NGINX ALB]                        │
│                         (Sticky Sessions / WSS)                         │
│                                    │                                    │
│                 ┌──────────────────┴──────────────────┐                 │
│                 ▼                                     ▼                 │
│      ┌─────────────────────┐               ┌─────────────────────┐      │
│      │  Node.js Instance 1 │               │  Node.js Instance 2 │      │
│      │  (SSE Clients 1-N)  │               │ (SSE Clients N+1-2N)│      │
│      └──────────┬──────────┘               └──────────┬──────────┘      │
│                 │                                     │                 │
│                 └──────────────────┬──────────────────┘                 │
│                                    ▼                                    │
│                    ┌───────────────────────────────┐                    │
│                    │     REDIS CLUSTER / PUB-SUB   │                    │
│                    │ Channel: 'market:quotes:stream│                    │
│                    └───────────────┬───────────────┘                    │
│                                    │                                    │
│                                    ▼                                    │
│                    ┌───────────────────────────────┐                    │
│                    │    Dedicated Market Ingestor  │                    │
│                    │    (Single Leader / Cron)     │                    │
│                    └───────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Distributed SSE Broadcast via Redis Pub/Sub

To horizontally scale Node.js instances behind a load balancer without duplicating upstream provider requests:
1. **Leader Worker:** A single leader instance executes `MarketWorker` polling on a 60-second timer.
2. **Publish:** The leader publishes updated quote payloads to Redis channel `market:quotes:stream`.
3. **Subscribe:** All Node.js backend instances subscribe to `market:quotes:stream` and broadcast received events directly to their locally connected client `EventSource` streams.

---

## 3. Production Health Monitoring & Operator Endpoints

### 3.1 Public Health Check (`GET /health`)
Returns `200 OK` for load balancer probes:
```json
{
  "status": "healthy",
  "timestamp": 1722681600000,
  "uptime": 86400
}
```

### 3.2 Operator System Diagnostics (`GET /api/admin/system-health`)
Requires admin API key header; provides complete subsystem metrics:
```json
{
  "activeProvider": "yahoo",
  "redisConnected": true,
  "dbConnected": true,
  "groqKeyStatus": {
    "market": "active",
    "chat": "active",
    "engine": "active"
  },
  "inFlightRequests": 0,
  "activeSSEConnections": 1420
}
```
