# Feature Ticket List — TradeVault
**Version:** 1.0  
**Date:** June 2026  
**Estimation key:** XS = 1–2h · S = 2–4h · M = 4–8h · L = 1–2d · XL = 2–4d

---

## EPIC 1 — Project Setup & Infrastructure

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| INF-001 | Initialize React + Vite project with TypeScript | P0 | XS | 1 | — |
| INF-002 | Configure Tailwind CSS + design tokens | P0 | S | 1 | INF-001 |
| INF-003 | Set up Neon project (dev + prod) | P0 | S | 1 | — |
| INF-004 | Configure Neon local dev environment | P0 | S | 1 | INF-003 |
| INF-005 | Set up GitHub repository + branch strategy | P0 | XS | 1 | — |
| INF-006 | Connect Vercel to GitHub, configure preview deploys | P0 | S | 1 | INF-005 |
| INF-007 | Configure GitHub Actions CI (lint, test, build) | P1 | M | 1 | INF-006 |
| INF-008 | Set up Sentry error tracking | P1 | S | 2 | INF-001 |
| INF-009 | Configure environment variable management | P0 | XS | 1 | INF-003 |
| INF-010 | Set up ESLint + Prettier + Husky pre-commit hooks | P1 | S | 1 | INF-001 |

---

## EPIC 2 — Authentication

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| AUTH-001 | Create JWT/Express Auth configuration (email + Google OAuth) | P0 | S | 2 | INF-003 |
| AUTH-002 | Build Signup page UI (email, password, name) | P0 | M | 2 | INF-002 |
| AUTH-003 | Build Login page UI (email/password + Google button) | P0 | M | 2 | INF-002 |
| AUTH-004 | Implement auth state management with Zustand | P0 | M | 2 | AUTH-001 |
| AUTH-005 | Implement route guard — redirect unauthenticated users | P0 | S | 2 | AUTH-004 |
| AUTH-006 | Build Forgot Password + Reset Password flow | P1 | M | 2 | AUTH-001 |
| AUTH-007 | Create `profiles` table + trigger to auto-create on signup | P0 | S | 2 | AUTH-001 |
| AUTH-008 | Build Profile Settings page (name, avatar, timezone) | P1 | M | 2 | AUTH-007 |
| AUTH-009 | Implement logout with token cleanup | P0 | XS | 2 | AUTH-004 |
| AUTH-010 | Apply RLS to all tables — policies for auth.uid() | P0 | M | 2 | INF-003 |

---

## EPIC 3 — Database & Schema

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| DB-001 | Create `trades` table with all columns + indexes | P0 | M | 2 | INF-003 |
| DB-002 | Create `strategies` table | P0 | S | 2 | INF-003 |
| DB-003 | Create `journal_entries` table | P0 | S | 2 | INF-003 |
| DB-004 | Create `broker_connections` table | P0 | M | 2 | INF-003 |
| DB-005 | Create `ai_insights` table | P0 | S | 2 | INF-003 |
| DB-006 | Write RLS policies for all tables | P0 | M | 2 | DB-001 through DB-005 |
| DB-007 | Create DB migration scripts + seed data for dev | P1 | M | 2 | DB-001 |
| DB-008 | Set up Server-side encrypted storage for encrypted secret storage | P0 | M | 2 | INF-003 |
| DB-009 | Add DB indexes for common query patterns | P1 | S | 2 | DB-001 |

---

## EPIC 4 — Core Layout & Navigation

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| NAV-001 | Build Sidebar component (nav items, collapse, user info) | P0 | M | 1 | INF-002 |
| NAV-002 | Build Header component (page title, sync status, alerts) | P0 | S | 1 | INF-002 |
| NAV-003 | Build PageWrapper layout component | P0 | S | 1 | NAV-001, NAV-002 |
| NAV-004 | Set up React Router v6 with all route definitions | P0 | S | 1 | INF-001 |
| NAV-005 | Implement active route highlighting in sidebar | P0 | XS | 1 | NAV-001, NAV-004 |
| NAV-006 | Build mobile-responsive navigation drawer | P2 | L | 3 | NAV-001 |

---

## EPIC 5 — Trade Log

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| TRD-001 | Build TradeRow component (table row with all fields) | P0 | M | 1 | INF-002 |
| TRD-002 | Build Trades page with filter bar (search, market, status) | P0 | L | 1 | TRD-001 |
| TRD-003 | Build TradeModal (full detail view + annotation form) | P0 | L | 1 | TRD-001 |
| TRD-004 | Implement trade annotation save (strategy, mindset, etc.) | P0 | M | 2 | TRD-003, DB-001 |
| TRD-005 | Build Manual Trade Entry form | P1 | L | 2 | DB-001 |
| TRD-006 | Implement trade filtering logic (client-side + server-side) | P0 | M | 2 | TRD-002, DB-001 |
| TRD-007 | Implement trade sorting (date, P&L, symbol, discipline) | P1 | S | 2 | TRD-002 |
| TRD-008 | Build DisciplineRater component (1–5 star/dot selector) | P0 | S | 1 | INF-002 |
| TRD-009 | Build TagInput component (custom tags per trade) | P1 | M | 2 | TRD-003 |
| TRD-010 | Implement CSV export of filtered trade data | P1 | M | 3 | TRD-002, DB-001 |
| TRD-011 | Build trade delete with confirmation modal | P1 | S | 2 | DB-001 |
| TRD-012 | Implement pagination for trade list (cursor-based) | P1 | M | 2 | DB-001 |

---

## EPIC 6 — Dashboard & Analytics

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| DASH-001 | Build StatCard component (P&L, win rate, R:R, discipline) | P0 | S | 1 | INF-002 |
| DASH-002 | Build cumulative P&L area chart (Recharts) | P0 | M | 1 | DASH-001 |
| DASH-003 | Build P&L by strategy horizontal bar chart | P0 | M | 1 | DASH-001 |
| DASH-004 | Build discipline distribution pie/donut chart | P0 | M | 1 | DASH-001 |
| DASH-005 | Build analytics computation utility (computeStats) | P0 | M | 1 | — |
| DASH-006 | Build recent trades mini-table on dashboard | P0 | S | 1 | TRD-001 |
| DASH-007 | Wire all dashboard charts to real Neon/Express data | P0 | M | 2 | DASH-002 through DASH-006, DB-001 |
| DASH-008 | Build calendar heatmap component (trading day activity) | P1 | L | 3 | DB-001 |
| DASH-009 | Add date range selector for dashboard filtering | P1 | M | 3 | DASH-007 |
| DASH-010 | Build win/loss streak tracker | P2 | M | 3 | DB-001 |
| DASH-011 | Build "best day of week" and "worst session" analytics | P2 | M | 3 | DB-001 |

---

## EPIC 7 — Strategy Library

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| STRAT-001 | Build Strategy card component (P&L, win rate, count) | P0 | M | 1 | INF-002 |
| STRAT-002 | Build Strategies page (grid of strategy cards) | P0 | M | 1 | STRAT-001 |
| STRAT-003 | Build Create/Edit Strategy modal (name, rules, market) | P1 | M | 2 | DB-002 |
| STRAT-004 | Wire strategy CRUD to Neon/Express | P1 | M | 2 | DB-002, STRAT-003 |
| STRAT-005 | Wire strategy stats to real trade data | P0 | M | 2 | DB-001, DB-002 |
| STRAT-006 | Add strategy selector to TradeModal annotation form | P0 | S | 2 | TRD-003, DB-002 |

---

## EPIC 8 — Daily Journal

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| JRNL-001 | Build JournalForm component (pre + post market fields) | P0 | L | 1 | INF-002 |
| JRNL-002 | Build MoodSelector component (emoji/label picker) | P0 | S | 1 | INF-002 |
| JRNL-003 | Build Journal page with date navigation | P0 | M | 1 | JRNL-001 |
| JRNL-004 | Implement journal CRUD to Neon/Express | P0 | M | 2 | DB-003, JRNL-001 |
| JRNL-005 | Link journal entry to trades of same date | P1 | M | 2 | DB-001, DB-003 |
| JRNL-006 | Build journal history list view | P1 | M | 3 | JRNL-004 |

---

## EPIC 9 — AI Coach

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| AI-001 | Build automated insight cards (revenge/boredom/overtrading detection) | P0 | M | 1 | DASH-005 |
| AI-002 | Build AI Coach page layout | P0 | M | 1 | INF-002 |
| AI-003 | Build "Run Analysis" button + loading state | P0 | S | 1 | INF-002 |
| AI-004 | Build AI response display component (formatted output) | P0 | M | 1 | INF-002 |
| AI-005 | Create Express API: `run-ai-analysis` | P0 | L | 2 | DB-001, DB-005 |
| AI-006 | Wire AI analysis to Claude API (claude-sonnet-4-20250514) | P0 | M | 2 | AI-005 |
| AI-007 | Store AI analysis results to `ai_insights` table | P0 | S | 2 | AI-005, DB-005 |
| AI-008 | Build AI insights history (past analyses) | P1 | M | 2 | AI-007 |
| AI-009 | Build per-trade AI feedback (trade-level Claude prompt) | P1 | M | 2 | TRD-003, AI-005 |
| AI-010 | Create weekly digest Edge Function (cron Monday 7 AM) | P1 | L | 3 | AI-005 |
| AI-011 | Build weekly digest email template | P1 | M | 3 | AI-010 |

---

## EPIC 10 — Broker Integration

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| BRK-001 | Build Settings page — Broker Connections section | P0 | M | 1 | INF-002 |
| BRK-002 | Create Edge Function: Zerodha OAuth callback + token exchange | P0 | XL | 2 | DB-004 |
| BRK-003 | Create Edge Function: Zerodha trade sync | P0 | XL | 2 | DB-001, BRK-002 |
| BRK-004 | Create Edge Function: AngelOne connect (TOTP-based) | P0 | XL | 2 | DB-004 |
| BRK-005 | Create Edge Function: AngelOne trade sync | P0 | XL | 2 | DB-001, BRK-004 |
| BRK-006 | Implement daily Kite token expiry detection + re-auth banner | P0 | M | 2 | BRK-002 |
| BRK-007 | Build sync status indicator in header (last synced, syncing) | P0 | S | 2 | BRK-003, BRK-005 |
| BRK-008 | Build manual sync trigger button | P0 | S | 2 | BRK-003, BRK-005 |
| BRK-009 | Implement duplicate trade detection on sync | P0 | M | 2 | BRK-003, DB-001 |
| BRK-010 | Create scheduled cron to auto-sync all active connections | P1 | M | 3 | BRK-003, BRK-005 |
| BRK-011 | Build broker disconnect flow with confirmation | P1 | S | 2 | DB-004 |
| BRK-012 | Map broker trade fields to TradeVault schema (field normalization) | P0 | M | 2 | DB-001 |

---

## EPIC 11 — UI Polish & Responsive Design

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| UI-001 | Build reusable Button component (variants: primary, ghost, danger) | P0 | S | 1 | INF-002 |
| UI-002 | Build reusable Modal component | P0 | S | 1 | INF-002 |
| UI-003 | Build reusable Badge/Tag component | P0 | XS | 1 | INF-002 |
| UI-004 | Build Toast notification system | P1 | M | 2 | INF-002 |
| UI-005 | Build Empty state components per page | P1 | S | 2 | INF-002 |
| UI-006 | Build Loading skeleton components | P1 | M | 2 | INF-002 |
| UI-007 | Build Error boundary + fallback UI | P1 | M | 2 | INF-002 |
| UI-008 | Full mobile responsive layout (320px–767px) | P2 | XL | 3 | All pages |
| UI-009 | Tablet layout optimization (768px–1023px) | P2 | L | 3 | All pages |
| UI-010 | Dark/light mode toggle + persistence | P2 | M | 3 | INF-002 |
| UI-011 | Keyboard navigation + focus management | P2 | L | 3 | All pages |
| UI-012 | Page load animations (fade-in, staggered reveals) | P2 | M | 3 | All pages |

---

## EPIC 12 — Testing

| ID | Ticket | Priority | Effort | Phase | Depends On |
|---|---|---|---|---|---|
| TEST-001 | Set up Vitest + React Testing Library | P1 | S | 1 | INF-001 |
| TEST-002 | Unit tests for analytics utility (computeStats) | P1 | M | 1 | DASH-005 |
| TEST-003 | Unit tests for broker field normalization | P1 | M | 2 | BRK-012 |
| TEST-004 | Integration tests for auth flows | P1 | L | 2 | AUTH-001 |
| TEST-005 | Integration tests for trade CRUD | P1 | L | 2 | DB-001 |
| TEST-006 | E2E tests with Playwright (happy path flows) | P2 | XL | 3 | All epics |

---

## Priority Summary

| Priority | Meaning | Phase |
|---|---|---|
| P0 | Must ship in that phase — blocks other tickets | 1 & 2 |
| P1 | Important — ship if time allows | 2 & 3 |
| P2 | Nice to have — polish and enhancement | 3 |

## Phase Summary

| Phase | Focus | Estimated Duration |
|---|---|---|
| Phase 1 | Frontend UI + mock data + AI coaching (no auth) | Weeks 1–3 |
| Phase 2 | Neon/Express backend + auth + broker APIs + real data | Weeks 4–7 |
| Phase 3 | Polish, mobile, advanced analytics, email digest | Weeks 8–12 |

---

*Total estimated tickets: 97 | P0: 52 | P1: 36 | P2: 9*
