# Security Audit & Hardening Specification
**TradeVault Platform — Institutional Security Architecture & Compliance**  
**Document ID:** SEC-AUDIT-2026-007  
**Category:** Security, Privacy & API Hardening  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Security Engineer & Principal Architect  
**Target Quality Score:** 9.5+/10

---

## 1. Executive Summary & Threat Model

The TradeVault security audit evaluated authentication, data isolation, secrets management, logging hygiene, and API rate-limiting. While multi-tenant Prisma isolation is robust (`userId` filters on all queries), several high-priority vulnerabilities must be hardened prior to production.

---

## 2. Identified Vulnerabilities & Hardening Specs

### SEC-01: User PII Leakage in Production Log Streams

**Severity:** P2 — MEDIUM  
**Code Reference:** `server/src/routes/ai.ts:198`

#### Vulnerability
```typescript
console.log('[AI-DEBUG-1] POST /chat hit. userId:', req.userId);
```
Unstructured `console.log` emits user identifiers into raw `stdout`. In containerized production environments (Datadog, CloudWatch, Papertrail), this violates GDPR / Indian Digital Personal Data Protection (DPDP) standards.

#### Remediation
Replace with structured Winston logger utilizing log levels and metadata masking:
```typescript
logger.debug('[AI] Chat request received', { 
  conversationId: req.body.conversationId,
  messageLength: req.body.message?.length 
});
```

---

### SEC-02: Dual Authentication Mechanism & localStorage JWT Exposure

**Severity:** P2 — MEDIUM  
**Code Reference:** `src/lib/aiStreamClient.ts:27`

#### Vulnerability
`aiStreamClient.ts` reads JWTs from `localStorage.getItem('token')` as a fallback, while main REST endpoints use `HttpOnly` secure session cookies. Tokens in `localStorage` are vulnerable to Cross-Site Scripting (XSS) extraction.

#### Remediation
Standardize all streaming endpoints to utilize `credentials: 'include'` with `HttpOnly`, `SameSite: Strict`, `Secure` cookies. Completely eliminate `localStorage` token access.

---

### SEC-03: Absence of Per-Route Rate Limiting

**Severity:** P2 — MEDIUM  
**Code Reference:** `server/src/index.ts`, `server/src/routes/marketV2.ts`

#### Vulnerability
Authenticated users can make unrestricted requests to expensive backend LLM endpoints, enabling denial-of-wallet and API starvation attacks.

#### Hardening Policy
Implement `express-rate-limit` with Redis storage across all sensitive routes:

```typescript
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 messages/min per user
  keyGenerator: (req: any) => req.userId || req.ip,
  message: { error: 'Rate limit exceeded. Please pace your chat queries.' }
});

export const aiSummaryRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5, // 5 requests/5min per user
  keyGenerator: (req: any) => req.userId || req.ip,
});
```

---

### SEC-04: Sentry Tracing Over-Sampling (100% in Production)

**Severity:** P2 — MEDIUM  
**Code Reference:** `server/src/index.ts:49`

#### Vulnerability
`tracesSampleRate: 1.0` transmits 100% of all HTTP transactions to third-party monitoring servers, adding network overhead and increasing third-party payload exposure.

#### Remediation
```typescript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 1.0,
});
```
