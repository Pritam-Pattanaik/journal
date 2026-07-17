# PREMIUM UI MASTER PLAN 

## 1. Design Philosophy
TradeVault is not just another dashboard; it is a professional financial instrument. Our core philosophy is **"Invisible Power."** The interface should never compete with the user's data. It must recede into the background, allowing the charts, numbers, and AI insights to become the absolute focal points. We build trust through precision, speed, and restraint.

**Core Principles:**
- **Clarity over Cleverness:** Data density must not compromise legibility. If a user has to squint or guess what a number means, we have failed.
- **Micro-friction Removal:** Every hover state, focus ring, and active state must confirm the user's intent instantly.
- **Physicality in the Digital Space:** We don't use arbitrary grays. We use elevation, calculated blur, and sub-pixel borders to create physical depth (glassmorphism executed with extreme restraint).
- **Tabular Precision:** Financial data requires unwavering alignment. We strictly enforce tabular-nums and monospaced anchors for all metrics.

## 2. Visual Direction & Personality
- **Personality:** Professional, authoritative, highly technical but effortlessly usable. It should feel like a tool built for elite traders, not a consumer social app.
- **Mood:** The quiet hum of a high-end server room. Dark mode is deep, inky, and high-contrast for numbers. Light mode is crisp, paper-like, and sterile in a good way.

## 3. Inspiration Analysis
### What to Adopt (The "Premium" Blueprint)
- **Linear:** The obsessive use of keyboard shortcuts, command palettes, subtle glowing borders on active elements, and the absolute lack of visual clutter. Their use of `rgba(255,255,255,0.05)` for borders and micro-interactions.
- **Stripe Dashboard:** Data density without overwhelm. The perfection of their table padding, the subtle shadows on floating cards, and their use of typography (Inter) for data legibility.
- **Vercel:** The stark minimalism. Monochromatic dominance with single, highly-saturated accent colors indicating status (Success/Error/Warning).
- **Attio:** Incredible fluidity. The way panels slide, the spatial awareness of lists, and the absolute perfection of their focus states.
- **TradingView:** The understanding of what traders need—dense, high-contrast charting with tools neatly tucked into spatial boundaries.

### What to Avoid (The "Cheap" Pitfalls)
- **Dribbble "Candy":** Oversized glowing blobs, useless massive border radiuses (e.g., 32px on a small card), and excessive glassmorphism that destroys contrast.
- **Dashboard Templates:** The generic "AdminLTE" look with heavy sidebars, excessive primary colors, and unaligned data tables.
- **Clunky Modals:** Modals that block the screen without a backdrop blur, or modals that abruptly pop in without scaling.
- **Inconsistent Alignment:** Mixing center-aligned and left-aligned numbers in a table.

## 4. Typography System
We will utilize **Geist Sans** (for UI) and **Geist Mono** (for financial data, codes, and IDs).

- **Heading 1:** 24px, 600 weight, -0.02em tracking. (Page Titles)
- **Heading 2:** 16px, 600 weight, -0.01em tracking. (Card Titles)
- **Body:** 14px, 400/500 weight, 0 tracking. (General UI)
- **Label:** 12px, 500 weight, +0.01em tracking, uppercase optionally for super headers.
- **Financial Metric (Large):** 32px, Mono, 600 weight, Tabular-nums.
- **Financial Metric (Small):** 14px, Mono, 500 weight, Tabular-nums.

## 5. Color Philosophy (Dark Mode Primary)
We discard raw hexes. We use HSL or OKLCH for perceptually uniform gradients and depths.

- **Canvas:** Extremely dark, almost OLED black (e.g., `#09090B`).
- **Surfaces:** Layered elevation. 
  - `Surface 0`: `#09090B` (Canvas)
  - `Surface 1`: `#121214` (Cards, Sidebar)
  - `Surface 2`: `#18181B` (Hover states)
  - `Surface 3`: `#27272A` (Borders, Dividers)
- **Accents:** Used *only* for interaction and primary calls to action. We will use a highly saturated Indigo/Violet (Vercel-esque).
- **Semantic Data:** 
  - **Profit/Win:** A sharp, neon-adjacent mint green.
  - **Loss:** A highly legible crimson.
  - **Warning:** A sterile amber.
- **Borders:** "Hairline" precision. Borders are almost exclusively 1px solid `rgba(255,255,255,0.08)`.

## 6. Motion Philosophy
Motion is structural, not decorative. 
- **Springs over Easing:** We will use spring physics (via Framer Motion) for all spatial changes (modals, dropdowns, tab switching). 
- **Duration:** Micro-interactions (hovers) take 100ms. Structural changes (modals) take 250-300ms using a tight spring configuration (`stiffness: 400, damping: 30`).
- **Scale & Fade:** Modals enter with a scale-up (`0.95 -> 1`) and fade (`0 -> 1`).

## 7. Component Philosophy
- **Radix UI / shadcn/ui:** We will rely on headless primitives to guarantee accessible, flawless interactions for Dropdowns, Selects, Dialogs, and Tooltips.
- **Buttons:** 32px height (dense), subtle inner shadow `inset 0 1px 0 rgba(255,255,255,0.1)`, 6px border radius.
- **Cards:** No inner padding by default; padding is handled by utility classes. 1px border. Background is `Surface 1`.
- **Inputs:** 32px height, perfectly aligned with buttons. Subtle focus ring: `ring-2 ring-accent ring-offset-1 ring-offset-canvas`.

## 8. Specific UX Domains
### Dashboard & Financial Tables
- **Bento Box Layout:** The dashboard will use a strictly adhered grid. No floating misaligned cards.
- **Tables:** No vertical borders. Subtle horizontal borders. Hover states on rows highlight slightly. Numbers are strictly right-aligned; text is left-aligned.

### Navigation (Sidebar vs Header)
- **Sidebar:** Collapsible. Icons must perfectly align. Active state receives a subtle inset background and a 2px left border accent. 
- **Header:** Sticky, backdrop blurred (`blur-md`), containing only breadcrumbs, global search (Command Palette), and user profile.

### AI Chat (Coach)
- It must feel like an IDE terminal or a sleek command line interface, not a bouncy consumer chat app (no chat bubbles). Plain text, monospaced data blocks, and markdown rendering.

## 9. Premium Checklist (The 9.5+ Standard)
- [ ] Are all financial numbers tabular?
- [ ] Does every interactive element have a distinct `:focus-visible` state?
- [ ] Do modals have a backdrop blur and press `Esc` to close?
- [ ] Is there a Command Palette (`Cmd+K`) for global navigation?
- [ ] Are scrollbars custom and styled minimally?
- [ ] Do empty states have high-quality, monochromatic wireframe illustrations?
- [ ] Are all icons perfectly optically aligned with their adjacent text?
- [ ] Is there zero layout shift on load?
