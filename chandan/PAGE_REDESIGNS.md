# PAGE REDESIGNS

## 1. Global Shell (App Layout)
### Current Problems
- The sidebar takes up too much horizontal space and relies on high-contrast active states.
- The header is basic, lacking global search capabilities (Command Palette) and spatial awareness.
- Breadcrumbs are missing or hardcoded.

### New Layout & Hierarchy
- **Left Sidebar:** Slim (240px expanded, 64px collapsed). Contains global navigation, isolated active states (subtle `Surface 2` background with a 2px left-accent border). Bottom contains a slim User Profile popover trigger.
- **Top Header:** 48px height. Glassmorphic backdrop (`backdrop-blur-xl`). Contains: Breadcrumbs (Left), `Cmd+K` Trigger (Center), Sync Status & Theme Toggle (Right).
- **Main Canvas:** Background `Surface 0`. Scrollbar customized to be 4px wide, disappearing when not hovered.

### Motion
- **Sidebar Collapse:** Framer Motion spring layout transition.
- **Route Changes:** Next.js-style crossfade + slight slide-up (`y: 10, opacity: 0` to `y: 0, opacity: 1` over 200ms).

---

## 2. Dashboard (`/app`)
### Current Problems
- Stat cards are generic and float arbitrarily.
- The charts take up too much vertical space without adequate data density.
- Recent trades list is a basic HTML table lacking proper tabular alignment.

### New Layout & Hierarchy
- **Bento Box Grid:** 12-column CSS Grid.
- **Top Row (Metrics):** 4 compact Stat Cards. 
  - *Wireframe:* [ Title ] [ Value (Mono) ] [ 24h Delta Badge (+/-%) ].
  - Sub-pixel borders, inner drop shadow (`inset 0 1px 0 rgba(255,255,255,0.05)`).
- **Middle Row (Visualization):** 
  - Left (8 cols): P&L Over Time (Area Chart using Recharts, minimal axes, `stop-color` gradients).
  - Right (4 cols): Win/Loss Donut Chart with a custom center label.
- **Bottom Row (Recent Activity):** 
  - A highly compact, Vercel-style list (not a full table) of the 5 most recent trades.

### Interaction & Motion
- Hovering a Stat Card reveals a subtle radial gradient highlight following the cursor (like magic-ui).
- Charts animate in with a 500ms staggered path-draw effect.

---

## 3. Trade Log (`/app/trades`)
### Current Problems
- The table is a basic HTML table. No column resizing, no advanced filtering.
- P&L values are center-aligned (terrible for readability).
- Modals for adding/editing trades are blocking and unpolished.

### New Layout & Hierarchy
- **Header Actions:** A robust Filter Bar. 
  - *Wireframe:* [ Search... ] [ Filter: Date ] [ Filter: Market ] --- [ + Add Trade (Primary Button) ]
- **The Data Grid:** 
  - A professional Radix-based Table or highly optimized Grid.
  - Columns: Date/Time, Market (Badge), Direction (Badge), Entry, Exit, P&L (Strictly Right-Aligned, Tabular Nums).
- **Detail View:** Clicking a row does NOT open a blocking modal. It opens a **Right-Side Sliding Drawer** (Sheet) allowing the user to view the trade details while keeping context of the list.

### Interaction & Motion
- **Row Hover:** Entire row dims slightly; action icons (Edit, Delete) fade in gracefully.
- **Sheet Entry:** Spring animation sliding from `x: 100%` to `0` with a 400ms duration.

---

## 4. AI Coach (`/app/ai-coach`)
### Current Problems
- Looks like a generic chat app. Bubbles take up too much space.
- Insights are just text blocks.

### New Layout & Hierarchy
- **Layout Paradigm:** Raycast / Terminal hybrid.
- **Top Section:** "Current Pulse" - 3 compact insight cards (e.g., "Revenge Trading Detected").
- **Interaction Canvas:** A seamless command input at the bottom (like Linear's comment box or ChatGPT's input).
- **Thread:** No chat bubbles. Just plain text blocks, monospaced code/data snippets for clarity. The AI's responses are delineated by a subtle left border (e.g., `border-l-2 border-accent`).

### Interaction & Motion
- Typing triggers a minimal glowing pulse on the input border.
- New insights stream in using a staggered opacity reveal.

---

## 5. Journal (`/app/journal`)
### Current Problems
- Form inputs are clunky. The calendar takes up arbitrary space.

### New Layout & Hierarchy
- **Two-Pane Layout:**
  - **Left Pane:** A sleek, sticky Calendar primitive (radix-ui/react-calendar). Dates with entries have a subtle dot indicator.
  - **Right Pane:** The Entry Editor. A Notion-style rich text or clean markdown editor. Title is massive and borderless (`text-3xl`). Body is distraction-free.
  - **Side-Panel:** Discipline rater using segmented controls instead of dropdowns.

### Interaction & Motion
- Clicking a date performs a seamless crossfade of the Right Pane content.
- Segmented controls slide an active background indicator behind the selected option (Framer Motion `layoutId`).

---

## 6. Settings & Admin (`/app/settings`, `/app/admin`)
### Current Problems
- Sprawling forms. Disjointed visual hierarchy. Dangerous actions (Disconnect, Delete) look identical to safe actions.

### New Layout & Hierarchy
- **Layout:** Left-side internal navigation (Account, Preferences, API Integrations, Security).
- **Form Sections:** Grouped in distinct Cards with `<Divider />` components.
- **API Integrations:** Vercel-style deployment cards. [ Logo ] [ Status Badge ] [ "Connect" / "Revoke" Button ].
- **Danger Zone:** Strictly delineated with a faint red border and a warning icon.

### Interaction & Motion
- Navigating between settings tabs uses a subtle slide animation (`x: -10 -> 0`).
- Dialogs for dangerous actions require typing confirmation (e.g., "Type DELETE to confirm") in a heavily blurred Radix Dialog.
