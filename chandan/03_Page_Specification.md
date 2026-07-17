# 03. PAGE SPECIFICATIONS

This document outlines the exact layout, grid structure, and visual hierarchy for every screen in the TradeVault ecosystem.

## 1. Global Shell (Authenticated App Layout)
- **Left Sidebar:** 
  - Width: 240px expanded, 64px collapsed.
  - Background: `bg-surface-1`, right border `border-border`.
  - Contains navigation links. Active link: `bg-surface-2 text-primary` with a 2px left absolute border (`bg-accent`).
  - Mobile: Converts to a Radix `<Sheet>` sliding in from the left.
- **Top Header:** 
  - Height: 48px. 
  - Background: `bg-canvas/80 backdrop-blur-md` (Sticky).
  - Left: Dynamic Breadcrumbs (`Home / Trades / Details`).
  - Center: Command Palette Trigger (`Cmd+K`).
  - Right: Theme toggle, Status indicator, User Avatar.
- **Main Canvas:**
  - `bg-canvas`. Max-width constraint (e.g., `max-w-7xl mx-auto px-6 py-6`).
  - Page entry animation: Fade in and slide up (`y: 10, opacity: 0` to `y: 0, opacity: 1` over 200ms).

---

## 2. Landing & Marketing Pages (`/`, `/about`, `/pricing`)
- **Library Reliance:** Framer Motion, Lenis (Smooth Scroll), Magic UI (for hero effects).
- **Hero Section:** 
  - Massive, centered typography (Geist Sans, tight tracking).
  - Subtitle: High contrast, `text-secondary`.
  - Primary CTA: Glowing button.
  - Background: Subtle grid pattern or animated radial noise texture (Aceternity UI influence).
- **Bento Box Features:** 
  - Grid of cards (varying spans: 2x2, 2x1, 1x1). 
  - Cards highlight on hover using cursor-tracking gradients.
- **Pricing:** 
  - 3-column grid. Highlighted middle tier (`border-accent shadow-[0_0_30px_rgba(99,102,241,0.2)]`).
- **Responsive:** Stacks to 1-column on mobile. Navigation becomes a full-screen blurred overlay.

---

## 3. Authentication (`/login`, `/signup`)
- **Layout:** Split screen or centered floating card.
- **Centered Card (Vercel style):** 
  - Width: 400px. `bg-surface-1 border border-border shadow-2xl rounded-2xl p-8`.
  - Brand logo centered at top.
  - Minimalistic form: Input labels outside inputs, clear validation styling.
  - Social Auth: Secondary buttons with brand icons.

---

## 4. Dashboard (`/app`)
- **Grid System:** Strict 12-column CSS Grid. `gap-6`.
- **Top Row (Metrics):** 4 cards, each spanning 3 columns. (Total P&L, Win Rate, Profit Factor, Active Trades).
- **Middle Row (Charts):**
  - Left (8 cols): P&L Over Time. A sleek Area Chart using Recharts. No grid lines, no axis lines, just the data curve with a gradient fill.
  - Right (4 cols): Win/Loss Donut Chart.
- **Bottom Row:** Compact recent activity feed. 
- **Animation:** Staggered load. Cards appear sequentially (50ms delay each).

---

## 5. Trade Log (`/app/trades`)
- **Header Actions:** Flex container. Left: Search & Filter dropdowns. Right: "Log Trade" primary button.
- **Data Table:** 
  - Full width. Custom `<Table>` component.
  - Direction badges (`LONG` = success, `SHORT` = danger/info depending on context, use distinct semantics).
  - P&L column right-aligned, strict tabular-nums.
- **Row Click Action:** Does NOT open a blocking modal. Triggers a right-side `<Sheet>` containing complete trade details, execution charts, and journal notes. This maintains user context.

---

## 6. Journal (`/app/journal`)
- **Layout:** 2-Pane Split.
- **Left Pane (30%):** Calendar view. Highlights days with trades (green/red dot based on daily P&L).
- **Right Pane (70%):** Editor Canvas.
  - **Header:** Date, Daily P&L summary.
  - **Body:** Distraction-free rich text editor. `text-lg text-primary leading-relaxed max-w-3xl`.
  - **Meta:** Sliding segmented controls for "Discipline Rating" (1-5).

---

## 7. AI Coach (`/app/ai-coach`)
- **Layout:** Flex column, max-width 800px, centered.
- **Top:** "System Pulse" - 3 compact AI observations generated instantly.
- **Middle:** Chat Thread. Messages have no borders or bubbles. The AI's messages have a distinct monospaced header (`SYSTEM: ANALYZING`).
- **Bottom:** Sticky command input. `bg-surface-1 border border-border rounded-lg shadow-lg`. Pressing Enter streams the response above.

---

## 8. Settings & Admin (`/app/settings`, `/app/admin`)
- **Layout:** Left vertical navigation (Account, Integrations, Security, Danger Zone), Right content pane.
- **Content Pane:** 
  - Grouped settings inside `<Card>` containers.
  - **Danger Zone:** Isolated section. Red borders. Button requires typed confirmation inside a `<Dialog>` to execute destructive actions (Delete Account, Revoke API).
- **Admin Users Table:** Similar to Trades table. Inline role switching via Radix Select.

---

## 9. Error & Empty States
- **404 / 500 Pages:** Centered. Massive typography (`text-9xl font-mono text-surface-2`). Calm, reassuring text and a button to return to Dashboard.
- **Empty Tables:** A dashed border container (`border-dashed border-border bg-surface-0/50`) spanning the table height, containing a monochromatic icon and CTA.
