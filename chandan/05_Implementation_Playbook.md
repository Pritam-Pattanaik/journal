# 05. IMPLEMENTATION PLAYBOOK

This playbook is the definitive engineering guide for executing the TradeVault frontend redesign. It establishes the mandatory stack, execution phases, and strict quality gates required to achieve a genuine 9.5+/10 Premium SaaS standard.

## 1. Absolute Directives
- **No Backend Modifications:** The redesign is strictly limited to the frontend (`src/`). Do not touch APIs, database schemas, or authentication logic.
- **Extract, Don't Copy:** Study Linear, Vercel, Stripe, and Raycast to extract their *principles* (physics, depth, grid alignment). NEVER copy their explicit layouts or branding.
- **Headless First:** Do not invent complex components (Modals, Selects, Dropdowns) from scratch using raw DOM nodes. You MUST use Radix UI.

## 2. Mandatory Tech Stack & Libraries
To achieve world-class interactions, the following libraries are non-negotiable:

**Core Architecture:**
- `react` / `react-dom`
- `react-router-dom` (Existing)
- `zustand` (Existing)

**Premium UI Infrastructure:**
- `tailwindcss` (Strict utility-first styling)
- `clsx` & `tailwind-merge` (For the `cn()` utility)
- `class-variance-authority` (cva) (For structured variant definitions, especially in `<Button>`)
- `lucide-react` (For perfectly aligned, consistent iconography)

**Headless Primitives & Accessibility:**
- `radix-ui` (Dialog, DropdownMenu, Select, Tabs, Popover, Tooltip, Switch)
- `shadcn/ui` (Use as reference for styling Radix primitives)
- `cmdk` (For the global Command Palette)

**Motion & Physics:**
- `framer-motion` (For spring physics, AnimatePresence, layout animations, and press scales)

**Feedback & Polish:**
- `sonner` (For compact, non-blocking toast notifications)

**Marketing (Only for `/`, `/about`, `/pricing`):**
- `@studio-freight/lenis` (Smooth scroll for marketing pages)
- `magic-ui` / `aceternity-ui` concepts (Cursor tracking, bento box grids, hero animations)

## 3. Phased Execution Architecture
The redesign MUST be executed sequentially. Do not start a phase until the previous one clears its Quality Gate.

### Phase 1: Core Foundation & Design System
- Setup `tailwind.config.js` with the exact HSL tokens defined in `01_Design_System.md`.
- Install all required libraries (`radix-ui`, `framer-motion`, `cva`, etc.).
- Build the core primitive components (`Button`, `Card`, `Input`, `Badge`).
- **Gate 1:** Are the tokens compiling correctly? Do buttons scale on press?

### Phase 2: Global Shell & Layouts
- Rewrite `PageWrapper.tsx`, `Sidebar.tsx`, and `Header.tsx`.
- Implement Framer Motion `AnimatePresence` for route transitions.
- Integrate the `cmdk` Command Palette into the Header.
- **Gate 2:** Does the layout remain perfectly stable at all breakpoints? Do transitions crossfade smoothly without flash of unstyled content (FOUC)?

### Phase 3: High-Density Data (Trades & Dashboard)
- Construct the `Table` primitive. Implement strict tabular numbers.
- Convert the Dashboard to a CSS Grid Bento Box.
- Convert the Trades "Add/Edit" modal to a Radix `<Sheet>` sliding drawer.
- **Gate 3:** Do the charts and tables respect the 8px grid? Are the numbers perfectly legible?

### Phase 4: Specialized Workflows (Journal & AI Coach)
- Rebuild the Journal as a Notion-style markdown canvas.
- Rebuild the AI Coach as a Terminal-style interface.
- **Gate 4:** Do the text editors and chat interfaces feel native and fast?

### Phase 5: Authentication & Marketing
- Rebuild `/login` and `/signup` as focused, high-elevation centered cards.
- Construct the Marketing Landing Page using Lenis and Scroll Reveals.
- **Gate 5:** Is the first impression undeniably premium?

### Phase 6: Final Polish & Audit
- Replace all legacy `alert()` and `confirm()` with `sonner` toasts or Radix Dialogs.
- Sweep for remaining raw hex codes or inline styles.

## 4. Final Quality Gate (The 9.5+ Audit)
Before marking the redesign complete, it must pass this 5-point audit:

1. **Build Verification:** `tsc -b` and `vite build` must exit with 0 errors. No TS `any` type hacks on new components.
2. **Visual Audit:** Compare against Linear/Vercel. Is the elevation deep enough? Are the borders hairline 1px translucent white/black?
3. **Motion Audit:** Does every interactive element react within 100ms? Do modals use spring physics? Is there zero reliance on slow CSS `transition: all`?
4. **Accessibility Audit:** Run Lighthouse. Can the entire app be navigated via the `Tab` key? Do focus rings appear correctly?
5. **Performance Audit:** Verify there are no layout shifts (CLS = 0) during component mounts or data fetching. Skeletons must exactly match the loaded layout.

If the application fails any point of this audit, the implementation is not finished. Fix it.
