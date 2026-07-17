# 01. DESIGN SYSTEM & CORE FOUNDATION

## 1. Design Philosophy
This system dictates the architectural and visual language for TradeVault. We operate on the principle of **"Invisible Power."**
- **Restraint:** Data is the hero. The UI recedes. We do not use color for decoration; color strictly indicates state or semantics (e.g., success, warning, danger, active).
- **Physicality:** We reject flat design. We build digital physicality using precise layering, sub-pixel inner borders (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)`), and meticulously calibrated shadow gradients.
- **Fluidity:** The application must feel alive. States do not snap; they spring. Transitions are physics-based, not duration-based.

## 2. Typography Engine
We mandate **Geist Sans** for UI and **Geist Mono** for data.

**Principles:**
- **Tabular Rigidity:** Every financial metric, timestamp, and P&L value MUST use `font-variant-numeric: tabular-nums`.
- **Tracking:** Tighter tracking on headings (`-0.02em` to `-0.04em`). Slightly looser tracking on uppercase micro-labels (`+0.02em`).

**Scale (Tailwind Configuration):**
- `text-xs`: 12px, leading 16px
- `text-sm`: 14px, leading 20px (Default body)
- `text-base`: 16px, leading 24px
- `text-lg`: 18px, leading 28px, tracking `-0.01em`
- `text-xl`: 20px, leading 28px, tracking `-0.02em`
- `text-2xl`: 24px, leading 32px, tracking `-0.03em`
- `text-3xl`: 30px, leading 36px, tracking `-0.04em` (Hero/Metrics)

## 3. Color Science & Tokens
We abandon rigid hex codes for an HSL/RGB variable system that allows for flawless opacity manipulation via Tailwind (e.g., `bg-surface/50`).

### The Depth Scale (Dark Mode)
- `--color-canvas`: `9 9 11` (Pure deep background, used for the main viewport body)
- `--color-surface-0`: `14 14 17` (Inset containers, code blocks, secondary panels)
- `--color-surface-1`: `22 22 26` (Default cards, primary sidebar)
- `--color-surface-2`: `32 32 36` (Hovered cards, slightly elevated sections)
- `--color-surface-3`: `39 39 42` (High elevation: Modals, Popovers, Dropdowns)

### Borders & Dividers
Borders are never opaque gray. They are translucent white/black over surfaces to maintain contrast dynamically.
- `--color-border`: `rgba(255, 255, 255, 0.08)` (Default structural borders)
- `--color-border-hover`: `rgba(255, 255, 255, 0.15)`
- `--color-border-focus`: `var(--color-accent)`

### Semantics
- `--color-accent`: `99 102 241` (Indigo - Primary actions, active states, focus rings)
- `--color-success`: `16 185 129` (Wins, Profit, Connected status)
- `--color-danger`: `239 68 68` (Loss, Delete, Disconnect)
- `--color-warning`: `245 158 11` (Pending, Alerts)
- `--color-info`: `59 130 246` (Neutral notifications, system info)

## 4. Spacing & Grid System
- We adhere strictly to an 8px baseline (`0.5rem` = `8px`).
- Minor spacing uses a 4px sub-grid (`0.25rem`).
- Layout grids (Dashboards, Bento boxes) utilize CSS Grid `gap-4` (16px) or `gap-6` (24px). No arbitrary margins. Elements must lock into the grid precisely.

## 5. Elevation & Glassmorphism
### Shadows
Elevation is handled via multi-layered box-shadows to simulate real-world physics.
- `shadow-sm`: `0 1px 2px rgba(0,0,0,0.4)` (Buttons)
- `shadow-md`: `0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)` (Cards)
- `shadow-lg`: `0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.4)` (Dropdowns)
- `shadow-xl`: `0 20px 25px -5px rgba(0,0,0,0.6), 0 10px 10px -5px rgba(0,0,0,0.5)` (Modals/Dialogs)

### Glassmorphism Rules
Glassmorphism is reserved EXCLUSIVELY for components that float over shifting content (Headers, Sticky Navs, Context Menus).
- Implementation: `bg-surface-1/80 backdrop-blur-xl`.
- Forbidden: Using glassmorphism on static dashboard cards. It destroys contrast and performance.

## 6. Accessibility & Focus
- **Focus Rings:** Every interactive element MUST have a highly visible focus state for keyboard navigation.
- Implementation: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`.
- Contrast ratios must meet WCAG 2.1 AA standards. Semantic colors on text must use adjusted luminance against dark backgrounds.

## 7. Forbidden Practices
- 🚫 `margin-top` / `margin-left` for layout positioning (Use Flex/Grid gaps).
- 🚫 Hardcoded hex values inside components (e.g., `text-[#FF0000]`).
- 🚫 Standard JS alerts or confirms.
- 🚫 Unaligned tabular data (e.g., center-aligned currency).
- 🚫 Layout shifting during loading (Allocate fixed height or use skeletons).
