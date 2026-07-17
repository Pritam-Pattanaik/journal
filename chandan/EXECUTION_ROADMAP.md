# EXECUTION ROADMAP

## Core Directive
Do NOT start Phase 2 until Phase 1 is 100% complete, reviewed, and passes all gates. We are building a premium application; structural integrity must be absolute before applying polish.

---

### Phase 1: The Core Infrastructure (Headless & Animation)
**Goal:** Rip out raw HTML/CSS structural elements and install professional primitives.

1. **Dependency Installation:**
   - Install `framer-motion` (for all animations).
   - Install `lucide-react` (if not already strictly used).
   - Install Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`, `@radix-ui/react-tooltip`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`).
   - Install `clsx` and `tailwind-merge` (via our `cn` utility).

2. **Primitive Component Construction:**
   - Build `<Button>` (using `Slot` and cva for variants).
   - Build `<Card>` (Card, CardHeader, CardTitle, CardContent).
   - Build `<Input>`, `<Label>`, `<Select>`, `<Tabs>`.
   - Build `<Sheet>` (Right-side sliding drawer) and `<Dialog>` (Modal) using Radix and Framer Motion.
   - Build `<Command>` palette component (cmdk).

**Gate 1 Verification:**
- Build passes?
- Are all primitives perfectly accessible (Tab navigation works)?
- Visual review of the component sandbox.

---

### Phase 2: The Global Shell
**Goal:** Implement the new App Layout.

1. **Sidebar (`Sidebar.tsx`):**
   - Implement the slim design.
   - Add Framer Motion for the expand/collapse physics.
   - Integrate the bottom User Popover (Radix).
2. **Header (`Header.tsx`):**
   - Implement the glassmorphic `backdrop-blur-xl`.
   - Implement breadcrumb logic.
   - Add the `Cmd+K` trigger that opens the `<Command>` palette.
3. **App Wrapper (`App.tsx` / `PageWrapper.tsx`):**
   - Integrate AnimatePresence (Framer Motion) for route transitions.

**Gate 2 Verification:**
- Sidebar animations feel flawless (no layout snapping).
- Global layout holds up on mobile (Sidebar converts to a Sheet).

---

### Phase 3: The Data Grid (Trades)
**Goal:** Overhaul the most critical functional page (`/app/trades`).

1. **Table Primitive:**
   - Build a highly structured Table component.
   - Ensure strict tabular alignment for P&L and prices.
2. **The Sheet Integration:**
   - Convert the old edit/add blocking modal into a Right-Side `<Sheet>`.
3. **Filter Bar:**
   - Implement the highly compact Filter layout above the table.

**Gate 3 Verification:**
- Does the Table look perfectly aligned at all viewports?
- Does clicking a row slide in the Sheet without dropping frames?

---

### Phase 4: Dashboard & Analytics
**Goal:** Implement the Bento Box dashboard layout.

1. **Stat Cards:**
   - Implement the subtle radial gradient hover effect (magic-ui style).
2. **Charts (`Recharts`):**
   - Strip out all axes lines, ticks, and grids. 
   - Apply clean gradient `stop-color` definitions.
   - Customize the Recharts `<Tooltip>` to use our `<Card>` primitive.
3. **Recent Activity:**
   - Build the compact list view.

**Gate 4 Verification:**
- Dashboard adheres strictly to the 12-column grid.
- Resize tests (ensure charts don't overflow).

---

### Phase 5: The Specialized Views (Journal & AI)
**Goal:** Polish the unique interactions of the Journal and AI Coach.

1. **Journal:**
   - Integrate the Calendar primitive.
   - Implement the Notion-style distraction-free editor input.
   - Add sliding segmented controls for discipline rating.
2. **AI Coach:**
   - Convert to the Terminal/Command line layout.
   - Add staggered reveal animations for incoming AI insights.

**Gate 5 Verification:**
- Journal feels like a premium text editor.
- AI Chat feels instantly responsive and technically professional.

---

### Phase 6: Settings, Admin, and Final Polish
**Goal:** Clean up the stragglers and apply the final 5% of polish.

1. **Settings / Admin:**
   - Convert all forms to use the new `<Card>` and `<Input>` primitives.
   - Implement the Danger Zone styling and exact-match delete confirmation Dialogs.
2. **Micro-interactions Sweep:**
   - Ensure every actionable element has `:focus-visible:ring`.
   - Ensure all `Button` elements have an `active:scale-[0.98]` press state.
3. **Empty States & Loading:**
   - Implement Skeleton loaders (pulsing) instead of spinners where applicable.
   - Polish empty state graphics (subtle wireframes).

**Final Gate Verification:**
- Run full strict TypeScript build.
- Perform a Lighthouse accessibility and performance audit.
- Final visual inspection comparing against Linear/Vercel benchmarks.
