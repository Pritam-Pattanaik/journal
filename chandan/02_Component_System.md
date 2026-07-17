# 02. COMPONENT SYSTEM

This specification dictates the exact construction and interaction mechanics of all reusable primitives. Do NOT reinvent components from scratch; utilize the mandated libraries (Radix UI, shadcn/ui, Framer Motion) as the foundation, then style strictly according to these rules.

## 1. The Core Primitives (shadcn/ui + Radix UI)

### 1.1 Button (`<Button>`)
- **Library:** `cva` (Class Variance Authority), `framer-motion` (for press state).
- **Anatomy:** `inline-flex items-center justify-center gap-2`.
- **Sizing:** 
  - `sm`: `h-8 px-3 text-xs`
  - `md`: `h-9 px-4 text-sm` (Default)
  - `lg`: `h-10 px-8 text-base`
- **Variants:**
  - `primary`: `bg-accent text-white hover:bg-accent/90 shadow-sm`.
  - `secondary`: `bg-surface-2 text-primary hover:bg-surface-3 border border-border`.
  - `ghost`: `bg-transparent hover:bg-surface-2 text-secondary hover:text-primary`.
  - `destructive`: `bg-danger text-white hover:bg-danger/90`.
- **Motion:** `whileTap={{ scale: 0.98 }}` via Framer Motion.
- **Loading State:** Replaces leading icon with a spinner, disables interaction, keeps dimensions fixed to prevent layout shift.

### 1.2 Interactive Overlays (Dialog, Sheet, Dropdown)
- **Library:** `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`.
- **Backdrop:** `bg-black/60 backdrop-blur-sm` (Mandatory for all modals).
- **Dialog (Modal):** 
  - `bg-surface-3 border border-border shadow-xl rounded-xl`.
  - Enters via `framer-motion` scale up (`0.95 -> 1`) and fade in over 200ms spring.
- **Sheet (Side Drawer):** 
  - Enters from right (`x: "100%" -> 0`). 
  - Used for Trade Details and Settings panels.
- **Dropdown Menu:** 
  - Sub-pixel border, inner shadow. Items have `hover:bg-surface-2 hover:text-primary` with 4px border-radius.

### 1.3 Forms (Input, Select, Switch)
- **Library:** Radix UI primitives.
- **Input:** `h-9 bg-surface-0 border border-border rounded-md px-3 text-sm`.
  - Focus state: `focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-transparent`.
- **Select:** Radix Select for flawless keyboard navigation and portalled popovers.
- **Switch:** Radix Switch. Active state uses `bg-accent`, inactive `bg-surface-2`.

## 2. Advanced Application Components

### 2.1 The Command Palette (`<Command>`)
- **Library:** `cmdk`.
- **Purpose:** Global search and quick actions (`Cmd+K`).
- **Styling:** Floating dialog in the center of the screen. `bg-surface-3` with a blurred backdrop. Input has no visible border, separated from results by a 1px divider.
- **Behavior:** Keyboard traversable, categorized results (Pages, Trades, Actions).

### 2.2 Data Tables (`<Table>`)
- **Construction:** `w-full text-sm text-left`.
- **Headers:** `text-xs uppercase tracking-wider text-secondary font-medium pb-3 border-b border-border`.
- **Cells:** `py-3 align-middle`. NO vertical borders. Subtle horizontal borders.
- **Tabular Data:** Any cell containing P&L, Price, or Date MUST use `font-mono tabular-nums text-right`.
- **Hover:** `hover:bg-surface-0/50` on `<tr>` with a fast transition.

### 2.3 KPI / Stat Cards
- **Construction:** `bg-surface-1 border border-border rounded-xl p-5 flex flex-col gap-1`.
- **Motion (Magic UI influence):** Implement a subtle, cursor-following radial gradient hover effect (`background: radial-gradient(circle at X Y, rgba(255,255,255,0.05), transparent)`).
- **Content:** Title (text-secondary text-sm), Value (font-mono text-2xl font-semibold), Delta Badge (+X% in success/danger color).

### 2.4 AI Chat Interface (Terminal Style)
- **Philosophy:** Developer-tool aesthetic, not an iMessage clone.
- **User Prompt:** Prefixed with `> ` or a chevron. `text-secondary`.
- **AI Response:** Streaming markdown. Rendered with `prose prose-invert`. Code blocks use `bg-surface-0` with strict monospace.
- **Motion:** Staggered opacity reveal for incoming blocks.

## 3. Feedback & State

### 3.1 Toast Notifications
- **Library:** `sonner`.
- **Placement:** Bottom-right.
- **Styling:** `bg-surface-3 border border-border shadow-lg`. Highly compact. Left edge color-coded based on intent (Success/Error/Info).

### 3.2 Skeletons & Loading
- **Component:** `<Skeleton className="animate-pulse bg-surface-2 rounded-md" />`.
- **Rule:** Never use blocking full-screen spinners. Render the exact structural outline of the page (Skeletons) while data fetches.

### 3.3 Empty States
- **Anatomy:** Center-aligned. Minimalistic monochromatic SVG wireframe icon, a subtle heading, and a primary CTA. Never just leave a blank table.
