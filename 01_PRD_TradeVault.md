# Product Requirements Document — TradeVault
**Version:** 1.0  
**Date:** June 2026  
**Status:** Draft  
**Owner:** Pritam

---

## 1. Executive Summary

TradeVault is a web-based trading journal and performance analytics platform for Indian retail traders. It enables traders to automatically sync trades from Zerodha and AngelOne, annotate each trade with strategy, mindset, and learnings, and receive AI-powered coaching from behavioral pattern analysis. The platform supports multi-user accounts across NSE equities, F&O, and Crypto markets.

---

## 2. Problem Statement

Indian retail traders lose money not just because of bad strategies — they lose because of poor self-awareness. Most traders:

- Have no structured record of what they did and why
- Cannot identify which of their strategies are actually profitable
- Repeat the same behavioral mistakes (revenge trading, boredom trades, late entries) without detecting the pattern
- Receive generic advice from coaches rather than analysis tied to their own data

There is no Indian-market-native trading journal that combines broker auto-sync, behavioral annotation, and AI coaching in one place.

---

## 3. Product Vision

> Give every trader a mirror — not a motivational poster.

TradeVault turns a trader's own history into their most honest coach. Every loss has a reason. Every win has a pattern. The platform surfaces both, automatically.

---

## 4. User Personas

### Persona 1 — Disciplined Learner ("Vikram")
- **Profile:** 2–5 years of trading, trades NSE equities + F&O part-time
- **Goal:** Improve consistency, understand which setups actually work
- **Pain:** Uses a spreadsheet that he forgets to update after bad days
- **Need:** Automatic sync, easy annotation, visual P&L breakdown

### Persona 2 — Impulsive Trader ("Riya")
- **Profile:** 1–2 years trading, mostly intraday F&O
- **Goal:** Stop blowing accounts, understand her mistakes
- **Pain:** Knows she revenge-trades but can't quantify it
- **Need:** Behavioral pattern detection, AI warnings before she self-destructs

### Persona 3 — Education Student ("Arjun")
- **Profile:** Student of Manabaditya's course, just starting out
- **Goal:** Build disciplined habits from day one
- **Pain:** No framework for journaling or tracking progress
- **Need:** Structured daily journal, clear templates, accessible analytics

---

## 5. Core Features — MVP (Phase 1 + Phase 2)

### 5.1 Authentication & Multi-User
- Email/password signup and login via Supabase Auth
- Google OAuth login
- Individual user accounts — data completely isolated per user
- Profile management (name, avatar, timezone)

### 5.2 Broker Integration (Auto Trade Sync)
- **Zerodha Kite Connect:** OAuth-based connection; daily token refresh prompt at login
- **AngelOne SmartAPI:** API key + TOTP-based connection
- Sync all trades: NSE equities, F&O (CE/PE/FUT), intraday + positional
- Manual trade entry (fallback when sync unavailable)

### 5.3 Trade Log
- Full trade history with: symbol, market, instrument type, entry/exit price, quantity, P&L
- Per-trade annotation fields: strategy used, setup description, mindset, decision rationale, learnings, tags
- Discipline self-rating per trade (1–5 scale)
- Trade status: WIN / LOSS / BREAKEVEN
- Filter by: date range, market, strategy, status, symbol
- CSV export

### 5.4 Daily Journal
- Pre-market section: bias, key levels, watchlist, news/events
- Post-market section: reflection, what went well, what to improve
- Daily mood selector and overall discipline score
- Linked to trades of that day

### 5.5 Strategy Library
- Create and manage named strategies
- Per-strategy performance: P&L, win rate, trade count, avg R:R
- Tag trades to strategies
- Strategy notes and rules

### 5.6 Dashboard & Analytics
- Cumulative P&L curve (equity curve)
- Win rate, average R:R, total trades, net P&L — top stats bar
- P&L by strategy (bar chart)
- Discipline distribution (pie chart)
- Calendar heatmap of trading days
- Best/worst performing days, symbols, strategies

### 5.7 AI Coach
- **Always-visible automated alerts:** revenge trading detection, boredom trade detection, overtrading warnings
- **Deep analysis (Claude API):** full journal analysis → critical issues, behavioral patterns, strengths, specific action items
- **Trade-by-trade feedback:** AI commentary added to each annotated trade
- **Weekly digest:** auto-generated weekly performance summary with coaching notes

---

## 6. User Stories

### Authentication
- As a trader, I can sign up with email/password so I have a private account
- As a trader, I can log in with Google for faster access
- As a trader, my data is visible only to me

### Broker Sync
- As a trader, I can connect my Zerodha account so trades sync automatically
- As a trader, I am prompted to re-authenticate Zerodha each morning (token expiry)
- As a trader, I can manually add a trade if broker sync misses something
- As a trader, I can see when trades were last synced

### Trade Annotation
- As a trader, I can open any trade and add my strategy, mindset, and learnings
- As a trader, I can rate my discipline on each trade from 1 to 5
- As a trader, I can tag trades with custom labels (e.g., "revenge", "textbook", "breakout")

### Analytics
- As a trader, I can see my cumulative P&L curve since I started
- As a trader, I can filter trades by strategy to see which one is actually profitable
- As a trader, I can compare my win rate across different markets

### AI Coach
- As a trader, I can click "Run Analysis" and get specific, honest coaching on my last N trades
- As a trader, I am shown an automatic warning when the system detects a revenge-trading pattern
- As a trader, I receive a weekly email digest with my performance summary

### Journal
- As a trader, I can write pre-market and post-market notes for any trading day
- As a trader, I can see all journal entries linked to trades from that day

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard loads in < 2 seconds |
| Performance | Trade sync completes in < 10 seconds for up to 500 trades |
| Availability | 99.5% uptime target |
| Scalability | Support up to 10,000 concurrent users |
| Security | All broker API keys encrypted at rest (AES-256) |
| Security | Row-level security — users cannot access other users' data |
| Security | HTTPS only, no plain HTTP |
| Accessibility | WCAG 2.1 AA compliance for core flows |
| Browser support | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| Data retention | Trade data retained indefinitely unless user deletes account |
| GDPR/Privacy | User data export and delete on request |

---

## 8. Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Registered users | 500+ |
| Daily active users | 30%+ of registered |
| Broker accounts connected | 60%+ of registered users |
| Trades annotated per user | avg 70%+ of trades have annotations |
| AI analysis runs per week | avg 3 per active user |
| 30-day retention | 40%+ |
| User-reported improvement | 70%+ say journaling improved their trading (survey) |

---

## 9. Out of Scope — v1.0

- Mobile app (iOS/Android) — Web responsive only
- Crypto exchange auto-sync (CoinDCX, WazirX) — manual entry only in v1
- Social/community features — no sharing of trade journals
- Copy trading or signals
- Paper trading / simulation mode
- Automated trading / algo execution
- Broker other than Zerodha and AngelOne
- Tax reporting / P&L statements for IT filing
- Real-time streaming market data

---

## 10. Release Phases

### Phase 1 — Frontend & AI (Weeks 1–3)
Full UI with all pages, mock data, real Claude API AI coaching, no auth

### Phase 2 — Backend (Weeks 4–7)
Supabase auth, Postgres DB, data persistence, Zerodha OAuth, AngelOne API

### Phase 3 — Advanced (Weeks 8–12)
Weekly email digest, calendar heatmap, crypto manual entry, CSV export, mobile-responsive polish

---

## 11. Open Questions

1. Will each user pay for their own Kite Connect API subscription (₹2000/month), or will the platform provide a shared integration?
2. Should Manabaditya's students get a dedicated onboarding flow or bulk invite system?
3. Is the AI coaching unlimited per user, or is there a daily/monthly cap to manage Claude API costs?
4. Should strategy templates be provided to new users or is it fully free-form?

---

*Document Owner: Pritam | Review cycle: Before each sprint*
