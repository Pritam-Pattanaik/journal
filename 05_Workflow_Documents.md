# Workflow Documents — TradeVault
**Version:** 1.0  
**Date:** June 2026

---

## Workflow 1 — New User Onboarding

**Actor:** First-time user  
**Goal:** Account created and first trade synced in under 5 minutes

### Steps

**Step 1 — Sign Up**
User lands on the signup page. Enters full name, email, and password (min 8 chars). Clicks "Create Account". Supabase creates `auth.users` record and triggers `profiles` table insert. Confirmation email sent.

**Step 2 — Welcome Screen**
User sees a welcome screen with two CTAs: "Connect Your Broker" or "Explore Dashboard". Skip is always available. Skipping lands on an empty Dashboard with a persistent "Connect a broker to get started" banner.

**Step 3 — Broker Selection**
Two cards shown: Zerodha and AngelOne. User selects one.

**Step 4a — Zerodha Flow**
User clicks "Connect via Kite OAuth". Redirected to Kite login page with the platform's API key. User authenticates in Kite. Kite redirects back with `request_token`. Edge function exchanges token for `access_token`. Token encrypted and saved. User sees "Connected" status. Warning shown: "Zerodha tokens expire at 6 AM IST daily — you will be prompted to re-authenticate each morning."

**Step 4b — AngelOne Flow**
User enters their SmartAPI key, client ID, and MPIN. System generates TOTP via stored secret. Edge function calls SmartAPI `/user/login`. JWT token stored encrypted. User sees "Connected" status.

**Step 5 — First Sync**
System immediately triggers trade sync for past 30 days. Progress indicator shown. On completion: "Synced 47 trades". User is redirected to Dashboard with real data.

### Decision Points
- If OAuth fails → show error with retry and manual entry fallback
- If API key invalid → inline error with help link
- If user has no trades in past 30 days → empty state with manual entry prompt

---

## Workflow 2 — Daily Login (Returning User)

**Actor:** Active trader, returning each morning  
**Goal:** App ready before market opens at 9:15 AM IST

### Steps

**Step 1 — Login**
User opens app and logs in with email/password or Google.

**Step 2 — Token Check**
On session restore, app checks broker connection status. If Zerodha `token_expiry` is past → show full-width amber banner: "Your Zerodha session expired. Re-authenticate to sync today's trades." Banner persists across all pages until resolved.

**Step 3 — Re-authentication (Zerodha)**
User clicks "Re-authenticate". Redirected to Kite OAuth. Completes login. New token saved. Banner dismissed. Sync triggered automatically.

**Step 4 — Auto-sync Check**
If token is valid and last sync was more than 15 minutes ago → trigger background sync silently. Header shows "Syncing..." → "Synced 2 min ago" when complete.

**Step 5 — Pre-market Journal**
User navigates to Journal. Today's entry is blank. User fills in market bias, key levels, watchlist, and news. Clicks "Save Pre-Market". Entry saved to Supabase.

---

## Workflow 3 — Post-Trade Annotation

**Actor:** Trader who just closed a trade  
**Goal:** Record the decision, mindset, and learning for a specific trade

### Steps

**Step 1 — Navigate to Trade Log**
User opens Trade Log page. Newly synced trades appear at the top sorted by date descending.

**Step 2 — Select Trade**
User clicks the trade row. TradeModal opens with full broker data: symbol, entry/exit, P&L, quantity, date.

**Step 3 — Fill Annotation**
User fills in:
- Strategy: selects from dropdown (their strategy library) or types a new one
- Setup Description: text field describing what they saw
- Mindset: text field ("focused", "anxious after morning loss", etc.)
- Decision Notes: what triggered the entry/exit
- Learnings: what they'd do differently
- Discipline Score: clicks 1–5 dot rating

**Step 4 — Save**
User clicks "Save Annotation". Data written to `trades` table via Supabase client. Modal shows brief success flash. Trade row in table now shows annotation indicator (small dot on the row).

**Step 5 — Post-Market Journal (end of day)**
User opens Journal page for today. Post-market section auto-links to today's annotated trades. User fills reflection, wins, and improvements. Saves entry.

### Edge Cases
- If user closes modal without saving → no data written, no confirmation prompt (by design — friction-free)
- If annotation already exists → fields pre-populated, user can update freely

---

## Workflow 4 — AI Coach Analysis

**Actor:** Trader who wants performance feedback  
**Goal:** Get specific, actionable coaching from recent trade history

### Steps

**Step 1 — Navigate to AI Coach**
User opens AI Coach page. Three automated insight cards are always visible (computed client-side, no API call needed):
- Revenge Trading Card: counts trades with low discipline immediately following a loss
- Boredom Trade Card: counts trades where mindset text contains "bored", "forced", or "no setup"
- Best Strategy Card: shows highest net P&L strategy name and win rate

**Step 2 — Trigger Deep Analysis**
User clicks "Run Analysis". Button changes to "Analyzing..." with spin icon. Request sent to Supabase Edge Function `run-ai-analysis`.

**Step 3 — Edge Function Processing**
Edge function fetches all trades for the user from the database. Formats them into a structured prompt including: date, symbol, market, P&L, strategy, mindset, decision, learnings, and discipline score per trade. Calls Claude API (`claude-sonnet-4-20250514`) with a strict coaching system prompt.

**Step 4 — Response Display**
Claude response streamed back (or returned as a single response). Displayed in the AI response panel with white-space: pre-wrap formatting to preserve section breaks. Result also saved to `ai_insights` table with type = `deep_analysis`.

**Step 5 — View History**
User can scroll down to see past AI analyses in reverse chronological order. Each entry shows the date and trade count analyzed.

### Edge Cases
- If fewer than 5 trades → show warning "Add at least 5 annotated trades for meaningful analysis"
- If Claude API call fails → show "Analysis failed. Try again." with retry button
- If user clicks Run Analysis again within 24 hours → prompt "You ran an analysis today. Run again?" to avoid unnecessary API costs

---

## Workflow 5 — Strategy Performance Review

**Actor:** Trader reviewing which setups are profitable  
**Goal:** Understand which strategies to trade more and which to stop

### Steps

**Step 1 — Navigate to Strategies**
User opens Strategies page. All strategies with at least one trade are shown as cards.

**Step 2 — Review Cards**
Each strategy card shows: total P&L (colored), win rate, number of trades, average P&L per trade. A thin bar at the bottom shows the win rate visually.

**Step 3 — Create New Strategy**
User clicks "New Strategy". Modal opens. Fields: name, description, rules/checklist, applicable markets, timeframe. User saves. Strategy appears in the list and becomes available in the trade annotation dropdown.

**Step 4 — Tag Existing Trades**
User goes to Trade Log. Opens a trade without a strategy assigned. Selects the new strategy from the dropdown. Saves. The strategy card in Strategies page updates its stats immediately.

---

## Workflow 6 — Manual Trade Entry

**Actor:** Trader entering a crypto trade (not auto-synced) or a trade missed by sync  
**Goal:** Get the trade into the journal manually

### Steps

**Step 1 — Open Add Trade Form**
User clicks "+ Add Trade" button in Trade Log page header.

**Step 2 — Fill Trade Details**
Form fields: Date, Symbol, Market (NSE / F&O / Crypto), Instrument type, Direction (Long/Short), Entry price, Exit price, Quantity. System auto-calculates P&L and status (WIN/LOSS/BREAKEVEN).

**Step 3 — Add Annotation (Optional)**
Same annotation fields available inline: strategy, mindset, decision, learnings, discipline score. User can fill immediately or come back later.

**Step 4 — Save**
Trade written to `trades` table with `source = 'manual'`. Appears in Trade Log with a small "Manual" badge.

---

## Workflow 7 — Broker Disconnection

**Actor:** Trader changing brokers or revoking access  
**Goal:** Remove broker connection cleanly

### Steps

**Step 1 — Navigate to Settings**
User opens Settings page → Broker Connections section.

**Step 2 — Disconnect**
User clicks "Disconnect" under the connected broker. Confirmation modal: "Disconnect Zerodha? Your existing trades will remain. New trades will not sync." User confirms.

**Step 3 — Cleanup**
`broker_connections` record's `is_active` set to false. Encrypted tokens deleted from Supabase Vault. Header sync indicator disappears. Re-authenticate banner no longer shown.

**Step 4 — Trade Data**
All previously synced trades remain in the database. They are not deleted. User can still annotate and analyze them.

---

## Workflow 8 — Weekly AI Digest (Automated)

**Actor:** System (cron job), delivered to trader  
**Goal:** Deliver a weekly performance summary every Monday morning

### Steps

**Step 1 — Cron Trigger**
Supabase Edge Function `weekly-digest` fires every Monday at 7:00 AM IST via pg_cron.

**Step 2 — User Selection**
Function queries all users with `is_active = true` and at least 1 trade in the past 7 days.

**Step 3 — Per-User Analysis**
For each user, fetches last 7 days of trades. Calls Claude API with a weekly digest prompt. Gets structured summary: week's P&L, top win, worst loss, one behavioral observation, one specific recommendation for the week.

**Step 4 — Email Delivery**
Result formatted as an HTML email. Sent via Resend API to user's registered email. Email contains the summary and a CTA link: "View full analysis in TradeVault."

**Step 5 — Storage**
Digest content saved to `ai_insights` table with type = `weekly_digest`. Accessible in the AI Coach page history.

### Edge Cases
- If user has no trades that week → skip, no email sent
- If Claude API fails for a user → log error, skip that user, retry on next run
- If user has unsubscribed from emails → skip delivery but still save to DB

---

## Workflow 9 — Data Export

**Actor:** Trader wanting their data  
**Goal:** Download a full trade history as CSV

### Steps

**Step 1 — Navigate to Trade Log**
User applies any filters they want (or none for full history).

**Step 2 — Export**
Clicks "Export CSV" button. Client-side utility converts the current filtered trade array to CSV format including all fields: date, symbol, market, entry, exit, P&L, strategy, mindset, discipline, learnings.

**Step 3 — Download**
Browser triggers file download: `tradevault-trades-2026-06-08.csv`.

---

## System Data Flow — Trade Sync

```
Broker API (Zerodha/AngelOne)
        │
        │  HTTP request from Edge Function
        ▼
  Edge Function: sync-trades
        │
        ├── Fetch trades since last_synced_at
        ├── Normalize field names to TradeVault schema
        ├── Calculate P&L and status
        ├── Check for duplicates (broker_trade_id UNIQUE constraint)
        │
        ▼
  Supabase Postgres (trades table)
        │  INSERT ... ON CONFLICT DO NOTHING
        ▼
  Realtime broadcast → Frontend
        │
        ▼
  UI updates trade count and last synced timestamp
```

---

## System Data Flow — AI Analysis

```
Frontend: User clicks "Run Analysis"
        │
        │  POST /functions/v1/run-ai-analysis
        ▼
  Edge Function (authenticated, server-side)
        │
        ├── Validate JWT, get user_id
        ├── Query trades table for user's trades
        ├── Format trade data as structured text
        │
        ▼
  Anthropic Claude API
  (API key stored as Supabase Secret — never exposed to client)
        │
        │  Response: structured coaching text
        ▼
  Edge Function
        │
        ├── Save result to ai_insights table
        └── Return response to frontend
        │
        ▼
  Frontend: Display coaching output
```

---

*Document Owner: Pritam | Updated: June 2026*
