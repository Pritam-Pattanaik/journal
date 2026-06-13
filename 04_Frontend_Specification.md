# Frontend Specification Document — TradeVault
**Version:** 1.0  
**Date:** June 2026

---

## 1. Design Direction

**Aesthetic:** "Midnight Exchange" — a professional trading terminal aesthetic. Dense data, sharp precision, dark environment. The interface should feel like a Bloomberg terminal built for the modern web: serious, fast, data-first. No decorative fluff. Every pixel serves the data.

**Memorable element:** Numbers are always in monospace, always colored (green = profit, red = loss). The user's P&L is never neutral text — it's always a statement.

---

## 2. Design System Tokens

### 2.1 Colors
```css
/* Backgrounds */
--bg-base:        #060b1e;   /* page background */
--bg-surface:     rgba(10, 16, 42, 0.92);  /* card/panel */
--bg-surface-hover: rgba(18, 27, 65, 0.92); /* hovered row/card */
--bg-overlay:     rgba(0, 0, 0, 0.7);       /* modal backdrop */

/* Borders */
--border-default: rgba(99, 102, 241, 0.12);
--border-bright:  rgba(99, 102, 241, 0.3);
--border-active:  rgba(99, 102, 241, 0.5);

/* Accent */
--accent:         #6366f1;
--accent-light:   #a5b4fc;
--accent-dim:     rgba(99, 102, 241, 0.15);

/* Semantic: Profit / Loss / Warning */
--green:          #10d990;
--green-dim:      rgba(16, 217, 144, 0.08);
--green-border:   rgba(16, 217, 144, 0.25);
--red:            #ff4b6e;
--red-dim:        rgba(255, 75, 110, 0.08);
--red-border:     rgba(255, 75, 110, 0.25);
--gold:           #f59e0b;
--gold-dim:       rgba(245, 158, 11, 0.08);
--gold-border:    rgba(245, 158, 11, 0.25);

/* Text */
--text-primary:   #e2e8f0;
--text-secondary: #94a3b8;
--text-muted:     #475569;
--text-inverse:   #ffffff;
```

### 2.2 Typography
```css
/* Font families */
--font-ui:   'Outfit', sans-serif;       /* all UI text */
--font-mono: 'JetBrains Mono', monospace; /* all numbers & data */

/* Scale */
--text-xs:   10px;  letter-spacing: 0.1em; (labels, captions)
--text-sm:   12px;  (secondary text, metadata)
--text-base: 13px;  (default body, table cells)
--text-md:   15px;  (headings, modal titles)
--text-lg:   18px;  (stat values, page titles)
--text-xl:   22px;  (primary stat figures)
--text-2xl:  28px;  (P&L in trade modal)

/* Number rule: ALL numbers use --font-mono */
/* Section labels use text-xs, uppercase, letter-spacing 0.1em */
```

### 2.3 Spacing
```
4px   — icon gap, tight items
8px   — form field gap, compact rows
12px  — card gap, list item padding
16px  — card padding (horizontal)
18px  — card padding (vertical)
20px  — section gap
24px  — page padding
32px  — major section gap
```

### 2.4 Border Radius
```
4px  — small badges, chips
6px  — buttons, inputs
8px  — filter pills, table rows
10px — small cards, tooltips
12px — main cards, panels
16px — modals, overlays
```

### 2.5 Elevation / Depth
No box shadows. Depth is created through background color contrast and border brightness only.

---

## 3. Component Specifications

### 3.1 StatCard
```
Width:     flex-1, min-width: 160px
Height:    auto (~90px)
Structure:
  ├── Label row: text-xs, muted, uppercase + icon (13px)
  ├── Value: text-xl, font-mono, colored
  └── Sub-label: text-sm, secondary
Color rules:
  P&L card   → value color = green (positive) or red (negative)
  Win Rate   → accent-light
  R:R Ratio  → gold
  Discipline → green ≥ 4.0, gold ≥ 3.0, red < 3.0
```

### 3.2 TradeRow (Table)
```
Grid columns: 100px | 1fr | 70px | 90px | 80px | 80px | 90px | 56px | 24px
Fields:       Date | Symbol | Market | Strategy | Entry | Exit | P&L | Disc | →
Height:       48px per row
Hover state:  background → --bg-surface-hover (transition 100ms)
Click:        opens TradeModal
P&L cell:     font-mono, green or red, always show + or - sign
Discipline:   5 dot indicators (colored by score level)
```

### 3.3 TradeModal
```
Size:         max-width 560px, centered, max-height 90vh
Backdrop:     --bg-overlay with blur(8px)
Structure:
  ├── Header: symbol + date + market + status badge + close button
  ├── P&L Banner: large P&L figure, entry/exit/qty subtitle
  ├── Details Grid (2-col): Strategy | Market | Mindset | Discipline
  ├── Decision field: full width, accent label
  ├── Learnings field: full width, gold label
  └── (Phase 2): Edit annotation button
Transition:   fade + slide up (200ms)
```

### 3.4 Sidebar
```
Width:        220px expanded, 60px collapsed
Collapse:     width transition 200ms ease
Structure:
  ├── Logo (32px icon + "TradeVault" text)
  ├── Nav items (6 items)
  │   ├── Icon (17px)
  │   └── Label (text-sm, 500 weight)
  ├── Spacer (flex: 1)
  └── User row (avatar + name + broker status)
Active state: accent-dim background + accent-light text
Hover state:  text color → text-secondary (transition 150ms)
```

### 3.5 ChartTooltip
```
Background:   #0a1030 (dark card)
Border:       1px solid --border-bright
Border-radius: 8px
Padding:      8px 12px
Font:         font-mono for numbers, text-sm
Value color:  green or red
```

### 3.6 Badge / Status Tag
```
Variants:
  WIN  → green-dim bg + green border + green text
  LOSS → red-dim bg + red border + red text
  LIVE → green-dim bg, animated dot prefix
  Broker name → accent-dim bg + accent-light text
Sizing: 11px text, 3px/10px padding, border-radius 20px
```

### 3.7 Filter Pill (Market/Status toggles)
```
Default: --bg-surface + --border-default + text-muted
Active (neutral): accent-dim bg + border-bright + accent-light text
Active (WIN): green-dim bg + green border + green text
Active (LOSS): red-dim bg + red border + red text
Transition: all 150ms
Border-radius: 8px
Padding: 7px 14px
```

### 3.8 DisciplineRater (1–5 dots)
```
For trade table: 5 × 8px dots in a row, gap 2px, border-radius 2px
  ≥ 4: filled green
  = 3: filled gold
  ≤ 2: filled red
  Unfilled: --border-default

For annotation form: 5 × 36px squares, clickable
  Same color logic
  Hover: slight opacity on unfilled squares
```

### 3.9 JournalForm Textarea
```
Background:   rgba(6, 11, 30, 0.6)
Border:       1px solid --border-default
Border-radius: 8px
Padding:      10px 12px
Font:         --font-ui, 12px
Color:        --text-primary
Line-height:  1.6
Resize:       vertical
Focus:        border → --border-bright (transition 150ms)
Placeholder:  --text-muted
```

### 3.10 AI Response Display
```
Container:    rgba(6, 11, 30, 0.6) bg + border + border-radius 8px + padding 20px
Font:         --font-ui, 13px, line-height 1.8
Color:        --text-primary
Formatting:   white-space: pre-wrap (preserves AI line breaks)
Section headers (🔴 🟡 ✅ 📋): bolded by AI formatting
```

---

## 4. Page Specifications

### 4.1 Dashboard
```
Layout:       Single column, 3 rows
Row 1:        4 StatCards in a row (flex, gap 14px)
Row 2:        PnLCurve (flex: 2) + DisciplinePie (flex: 1) — gap 14px
Row 3:        StrategyBar (flex: 1) + RecentTrades (flex: 1.2) — gap 14px

PnLCurve chart:
  Type:       AreaChart (Recharts)
  Height:     170px
  Data:       Cumulative P&L, one point per trade, sorted by date
  X-axis:     Date (MM-DD), muted, 9px mono
  Y-axis:     ₹ abbreviated (e.g., ₹4k), 9px mono
  Fill:       Gradient from green/red to transparent
  Reference:  Dashed line at y=0

StrategyBar chart:
  Type:       BarChart, horizontal, layout="vertical"
  Height:     150px
  Bar size:   9px
  Bar color:  green (pnl ≥ 0) or red (pnl < 0)

DisciplinePie:
  Type:       PieChart, donut (innerRadius 34, outerRadius 56)
  Segments:   Perfect (5), Good (3–4), Poor (1–2)
  Legend:     Below chart, dot + label + count
```

### 4.2 Trade Log
```
Header:       Search input (flex:1) + Market filters + Status filters
Table:        Full width, sticky header
Rows:         Sorted by date desc by default
Pagination:   Load more button (Phase 2 — infinite scroll)
Empty state:  Centered illustration + "No trades found" message
Filter count: Show "N trades" below table
```

### 4.3 Journal Page
```
Layout:       Max-width 700px, left-aligned
Date selector: Native date input, styled to match design system
Pre-market card: accent-light header label
Post-market card: gold header label
Mood selector: Horizontal pill list (6 options)
Discipline:   Row of 5 clickable numbered squares
Save button:  Gradient button (accent → purple)
```

### 4.4 AI Coach Page
```
Layout:       Max-width 800px
Row 1:        3 insight cards (revenge | boredom | best strategy)
Row 2:        AI analysis panel
  Header:     Title + subtitle + "Run Analysis" CTA button
  Loading:    RefreshCw spin icon + "Analyzing..." text
  Response:   Pre-formatted white-space: pre-wrap display
```

### 4.5 Strategies Page
```
Layout:       Auto-fill grid, minmax(280px, 1fr)
Card:         Strategy name + profitable/losing badge + 4 stats (2×2 grid) + win rate bar
Stats:        Total P&L | Win Rate | Trades | Avg P&L
Win rate bar: thin bar below stats, red background, green fill at win rate %
```

### 4.6 Settings Page
```
Layout:       Max-width 600px
Sections:
  1. Broker Connections
     - Zerodha card (connected state OR connect form)
     - AngelOne card (connected state OR API key form)
     - Kite token warning note
     - Crypto limitation note (amber warning card)
  2. Profile (Phase 2)
  3. Notification preferences (Phase 3)
```

---

## 5. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | 320px–767px | Single column, nav drawer |
| Tablet | 768px–1023px | Sidebar collapses to icon-only |
| Desktop | 1024px–1439px | Full sidebar + standard layout |
| Wide | 1440px+ | Max content width 1400px, centered |

---

## 6. Interaction States

All interactive elements must have defined states for:

| State | Implementation |
|---|---|
| Default | Base styles as defined per component |
| Hover | Background shift or color change (transition 100–150ms) |
| Active | Slight scale-down (0.97) or darker background |
| Focus | Outline: 2px solid --accent (keyboard nav) |
| Disabled | Opacity 0.4, cursor: not-allowed |
| Loading | Spinner or skeleton, pointer-events: none |
| Error | Red border + error text below input |
| Success | Green border + checkmark icon briefly |

---

## 7. Animation Guidelines

| Element | Animation | Duration |
|---|---|---|
| Page transitions | fade + translateY(8px) in | 300ms ease |
| Modal open | fade + scale(0.97→1) | 200ms ease |
| Sidebar toggle | width transition | 200ms ease |
| Loading spinner | spin | 1s linear infinite |
| Trade row hover | background | 100ms |
| Filter pill toggle | all properties | 150ms |
| Chart bars/lines | Recharts default (500ms) | 500ms |

No bounce animations. No parallax. No enter/exit animations on list items.

---

## 8. Typography Rules

1. All monetary values → `--font-mono`
2. All percentages → `--font-mono`
3. All dates in data tables → `--font-mono`
4. All section labels → `text-xs`, uppercase, `letter-spacing: 0.1em`, muted color
5. Page title in header → `text-md`, 600 weight, --text-primary
6. Modal title → `text-md`, 700 weight, --text-primary
7. Never use more than 2 font weights in one card (400 + 500/600)
8. Minimum font size: 10px (labels only)

---

## 9. Icon Usage

- Library: Lucide React only
- Size: 13px (in cards/stat labels), 14px (in tables), 16px (in buttons/nav), 18px (in header), 20px (large actions)
- Color: inherits from parent text color
- Never use icons as standalone interactive elements without `aria-label`

---

## 10. Error States & Empty States

### Empty States (per page)
- Trades page: "No trades yet" + broker connect CTA
- Journal page: "No entry for this day" — show blank form
- AI Coach: "Run your first analysis" prompt text
- Strategies: "No strategies created yet" + create CTA

### Form Validation
- Required fields: red border + "This field is required" below
- Show error only after first submit attempt or on blur
- Never disable submit button — show errors after click

### API Errors
- Toast notification: bottom-right, 5s auto-dismiss
- Critical errors (auth failure, no data): full-screen error with retry button

---

*Document Owner: Pritam | Updated: June 2026*
