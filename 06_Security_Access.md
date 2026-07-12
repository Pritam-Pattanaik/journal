# Security & Access Control Document — TradeVault
**Version:** 1.0  
**Date:** June 2026  
**Classification:** Internal — Development Reference

---

## 1. Security Overview

TradeVault handles two categories of sensitive data:

**Financial data** — trade history, P&L records, strategy notes. Exposure could compromise a trader's competitive edge or enable identity theft.

**Broker credentials** — API keys and access tokens for Zerodha and AngelOne. Exposure could allow an attacker to read or place trades on a user's account.

All security decisions are made with worst-case breach scenarios in mind. The goal: even if the database is fully dumped, broker credentials must be non-recoverable, and one user's data must be inaccessible to any other user.

---

## 2. Authentication

### 2.1 Provider
JWT/Express Auth is the authentication layer. It manages:
- Email and password accounts (bcrypt hashed, Neon/Express handles this)
- Google OAuth 2.0
- JWT session tokens (short-lived access + long-lived refresh)
- Email verification for new accounts
- Password reset via email

### 2.2 Session Management

| Property | Value |
|---|---|
| Access token lifetime | 1 hour |
| Refresh token lifetime | 30 days |
| Refresh token rotation | Enabled (each refresh issues a new refresh token) |
| Concurrent sessions | Allowed (multiple devices) |
| Session invalidation | On password change, on explicit logout, on Neon/Express admin action |

### 2.3 Password Policy
- Minimum 8 characters
- Neon/Express enforces uniqueness of email per account
- No maximum character limit
- Password strength indicator shown on signup (client-side only — not enforced server-side beyond minimum length)

### 2.4 OAuth (Google)
- Standard OAuth 2.0 PKCE flow
- Neon/Express handles token exchange
- Google account email becomes the primary identifier
- No Google tokens stored — only Neon/Express session tokens

### 2.5 Multi-Factor Authentication
- Not implemented in v1
- Planned for v2 — Neon/Express TOTP (authenticator app) support

---

## 3. Authorization & Row Level Security

### 3.1 Principle
Every database table uses Server-side auth middleware (JWT). Users can only read, write, or delete their own rows. This is enforced at the database layer — not just the application layer — meaning even a compromised API call cannot retrieve another user's data.

### 3.2 RLS Policies — All Tables

All tables follow the same pattern:

```sql
-- TRADES table (representative example)
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades"
  ON trades FOR DELETE
  USING (auth.uid() = user_id);
```

Identical policies applied to: `profiles`, `broker_connections`, `strategies`, `journal_entries`, `ai_insights`.

### 3.3 Service Role (Admin)
Express API that run server-side operations (broker sync, AI analysis, weekly digest) use the `Neon/Express_SERVICE_ROLE_KEY`. This key bypasses RLS and is:
- Never exposed to the frontend
- Stored only as a Express API secret
- Used only within Edge Function scope where the user_id is validated from the JWT before any DB operation

### 3.4 Anon Key
The Neon/Express `anon` key is exposed to the frontend. It has no special permissions. All anon-key requests are subject to RLS. The anon key alone cannot read any user data without a valid JWT.

---

## 4. Broker API Key Security

This is the highest-risk data in the system. A leaked Zerodha access token could allow unauthorized access to a user's demat and trading account.

### 4.1 Encryption at Rest

Broker credentials are **never stored in plain text**. The encryption pipeline is:

**For Zerodha access tokens:**
```
User authenticates with Kite OAuth
        │
        ▼
Edge Function receives request_token
        │
        ▼
Exchanges for access_token with Kite API
        │
        ▼
Encrypts access_token using AES-256-GCM
(encryption key stored in Server-side encrypted storage — not in database)
        │
        ▼
Stores encrypted ciphertext in broker_connections.access_token column
```

**For AngelOne API keys:**
```
User submits API key via frontend form
        │
        ▼
Frontend sends to Edge Function over HTTPS (never stored client-side)
        │
        ▼
Edge Function encrypts with AES-256-GCM before DB write
        │
        ▼
Encrypted ciphertext stored in broker_connections.api_key
```

### 4.2 Encryption Key Management
- The AES-256 encryption key (`ENCRYPTION_KEY`) is stored in Server-side encrypted storage (encrypted secrets store)
- It is never written to the database or codebase
- It is injected into Edge Functions at runtime as an environment variable
- Key rotation procedure: generate new key → re-encrypt all stored credentials → update Vault → deprecate old key

### 4.3 Token Lifecycle

**Zerodha:**
- Tokens are valid for ~18 hours (expire 6 AM IST next day)
- On expiry: token is invalidated by Zerodha automatically
- Our system detects expiry on next API call (401 response) and flags the connection as requiring re-auth
- Expired tokens are overwritten on next successful authentication — not accumulated

**AngelOne:**
- JWT tokens valid 24 hours
- Refresh handled by Edge Function `refresh-angelone-token` on a schedule

**On disconnect:**
- Encrypted tokens deleted immediately from the database
- Connection record marked `is_active = false`

### 4.4 What Is Never Stored
- Plain-text API keys or access tokens (anywhere in the system)
- Zerodha `api_secret` per user (the platform secret is server-only; users provide their `api_key` only)
- TOTP secrets for AngelOne in readable form
- Browser localStorage, cookies, or sessionStorage (tokens only in JWT/Express Auth session which uses httpOnly cookies)

---

## 5. Data Transmission Security

### 5.1 Transport
- HTTPS only — no HTTP endpoints
- TLS 1.2 minimum, TLS 1.3 preferred
- Enforced by Vercel (frontend) and Neon PostgreSQL + Express
- HSTS headers enabled on the custom domain

### 5.2 API Communication
- All frontend-to-Neon/Express calls use the REST API client (fetch) which handles JWT attachment automatically
- All Edge Function calls are HTTPS with JWT validation as first step
- No API keys are passed from frontend to backend in request bodies — they are submitted once and stored encrypted server-side

### 5.3 CORS
- Neon/Express CORS configured to allow requests only from the production domain and localhost in development
- Wildcard origins (`*`) are never used in production

---

## 6. Input Validation & Injection Prevention

### 6.1 Frontend Validation
- All form inputs validated with React Hook Form before submission
- Trade prices and quantities: numeric only, positive values, reasonable range limits
- Text fields: max character limits enforced (e.g., strategy name 100 chars, notes 2000 chars)
- Date fields: valid date format, not in the future for trade entries

### 6.2 Database Validation
- All tables use Postgres CHECK constraints (e.g., discipline_score BETWEEN 1 AND 5, status IN ('WIN','LOSS','BREAKEVEN'))
- Parameterized queries only via Prisma ORM — no raw SQL string concatenation in application code
- Server-side auth middleware acts as a second layer even if frontend validation is bypassed

### 6.3 Edge Function Validation
- Every Edge Function validates the incoming JWT as first step — no processing before auth
- Input schemas validated before any DB operation
- Trade data from broker APIs is sanitized and type-cast before database insert

### 6.4 XSS Prevention
- React's default JSX escaping prevents XSS for all rendered user content
- `dangerouslySetInnerHTML` is not used anywhere in the codebase
- AI coaching output is rendered as plain text (white-space: pre-wrap) — never as HTML

### 6.5 Rate Limiting
- Neon/Express enforces rate limits on Auth endpoints (signup, login, password reset) by default
- Edge Functions (especially `run-ai-analysis`) check last analysis timestamp to prevent Claude API abuse
- Broker sync Edge Functions are callable maximum once per 15 minutes per user

---

## 7. Access Roles

| Role | Description | DB Access | Edge Functions |
|---|---|---|---|
| Authenticated User | Logged-in trader | Own rows only (RLS) | Can call user-scoped functions |
| Service Role (Edge Fn) | Server-side processes | All rows (RLS bypassed) | Internal only — not callable by frontend |
| Database Admin (Neon dashboard) | Platform admin | Full access | Full access |
| No role (anon) | Unauthenticated visitor | None (RLS blocks all) | None |

### 7.1 Admin Access
There is no in-app admin panel in v1. Administrative actions (user deletion, data queries, support) are done directly via the Neon dashboard with:
- Admin access limited to named team members only
- Dashboard protected by Neon/Express account MFA
- No shared admin credentials — individual logins only

---

## 8. Privacy & Data Handling

### 8.1 Data Collected
| Data Type | Purpose | Stored |
|---|---|---|
| Name, email | Account identification | JWT/Express Auth + profiles table |
| Trade history | Core journaling feature | trades table |
| Journal entries | Core journaling feature | journal_entries table |
| Broker API credentials | Trade sync automation | broker_connections (encrypted) |
| AI analysis results | Coaching history | ai_insights table |
| IP address, user agent | JWT/Express Auth logs | Neon platform (30-day retention) |

### 8.2 Data Not Collected
- No financial account numbers or demat account details
- No payment information (no billing in v1)
- No device location data
- No behavioral tracking or analytics beyond Vercel's basic analytics

### 8.3 Data Retention
- All user data retained indefinitely while account is active
- On account deletion: all user data deleted within 30 days (cascaded deletes via FK constraints + scheduled cleanup job)
- Broker tokens: deleted immediately on disconnect or account deletion

### 8.4 Third-Party Data Sharing
| Third Party | Data Shared | Purpose |
|---|---|---|
| Neon/Express | All user and trade data | Storage, auth, compute |
| Anthropic (Claude) | Anonymized trade summaries | AI coaching analysis |
| Vercel | None (static frontend only) | Hosting |
| Resend | Email address | Weekly digest delivery |
| Zerodha/AngelOne | None — we receive from them | Trade data source |

**Note on Anthropic:** Trade data sent to Claude API for analysis does not include personally identifiable information (name, email, account numbers). It includes only trading activity: dates, symbols, P&L, and self-written notes. Anthropic's API data handling policies apply.

### 8.5 User Rights
Users can:
- Export all their data as CSV from the Trade Log page
- Delete individual trades from the Trade Log
- Delete their account (Account Settings → Danger Zone → Delete Account)
- Request full data export by contacting support (manual process in v1)

---

## 9. Incident Response

### 9.1 Suspected Credential Breach
If a broker credential is suspected to have been accessed by an unauthorized party:
1. Immediately revoke the token via broker's API
2. Delete the record from `broker_connections`
3. Force-expire the user's Neon/Express session
4. Notify the user by email with instructions to revoke access in their broker account
5. Rotate the `ENCRYPTION_KEY` in Server-side encrypted storage
6. Re-encrypt all remaining stored tokens with the new key

### 9.2 Database Breach
If the Postgres database is compromised:
- Broker credentials are encrypted at rest — attacker cannot decrypt without the Vault key
- User passwords are managed by JWT/Express Auth (bcrypt, separate from application DB)
- Notify all users to change passwords and revoke broker connections as a precaution

### 9.3 Vulnerability Reporting
Security issues should be reported to the platform owner directly (not via public GitHub issues). Response target: acknowledgment within 48 hours, patch within 7 days for critical issues.

---

## 10. Development Security Practices

### 10.1 Secrets Management
- No secrets in source code, ever
- `.env.local` files in `.gitignore` — never committed
- Production secrets in Server-side encrypted storage and Vercel Environment Variables only
- CI/CD secrets stored in GitHub Actions Secrets (not in YAML files)

### 10.2 Dependency Management
- `npm audit` run as part of CI pipeline — build fails on high/critical vulnerabilities
- Dependabot configured for automated security update PRs
- Dependencies pinned to exact versions in production (`package-lock.json` committed)

### 10.3 Code Review
- All PRs require at least one review before merge to main
- Security-sensitive changes (auth flows, encryption, broker integration) require explicit security review sign-off
- No direct commits to main branch

### 10.4 Environment Separation
- Separate Neon projects for development and production
- Separate Vercel deployments for preview and production
- Production database never seeded with real user data from dev environments

---

## 11. Security Checklist — Pre-Launch

- [ ] RLS enabled and tested on all tables
- [ ] Neon/Express anon key confirmed to have no elevated permissions
- [ ] Broker token encryption tested: store encrypted → decrypt → verify match
- [ ] Edge Function JWT validation tested: reject requests with invalid tokens
- [ ] CORS configured to production domain only
- [ ] HTTPS enforced — HTTP redirects to HTTPS
- [ ] Rate limiting on AI analysis endpoint verified
- [ ] `npm audit` passes with no high/critical issues
- [ ] No secrets in git history (checked with `git-secrets` or equivalent)
- [ ] Admin dashboard access locked to named individuals with MFA
- [ ] Account deletion flow tested — all cascade deletes verified
- [ ] JWT/Express Auth email templates customized (no default Neon/Express branding with internal config details)

---

*Document Owner: Pritam | Updated: June 2026 | Review before each major release*
