# 04. MOTION SYSTEM

Motion in TradeVault is functional, spatial, and physics-based. We do not use animation for decoration. Motion exists solely to explain spatial relationships (where did this modal come from?) and confirm interaction (did I press this button?).

**Core Mandate:** All complex animations MUST be built using `framer-motion`. Do not rely on CSS `@keyframes` for structural layout shifts.

## 1. Physics Engine (Framer Motion Defaults)
We abandon linear easing and CSS `cubic-bezier` for spring physics. Springs feel natural because they mimic real-world momentum.

**Standard Spring Configuration:**
```javascript
const springConfig = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1
};
```
- Use higher stiffness (500) for fast micro-interactions (button clicks).
- Use higher damping (40) for larger elements (Sheets) so they don't bounce aggressively.

## 2. Route Transitions (Shared Layout)
- **Library:** `AnimatePresence` from Framer Motion.
- **Implementation:** Wrap the main `<Outlet />` or page content.
- **Animation:** 
  - Initial: `opacity: 0, y: 10`
  - Animate: `opacity: 1, y: 0`
  - Exit: `opacity: 0, y: -10` (fast duration: 150ms)
- This creates a smooth upward crossfade when navigating between Dashboard, Trades, and Journal.

## 3. Micro-Interactions
### Buttons & Interactive Elements
- **Hover:** CSS `transition-colors duration-200 ease-out`. (Backgrounds change instantly but smoothly).
- **Tap/Press:** `whileTap={{ scale: 0.98 }}`. The button must physically compress when clicked to confirm action.
- **Focus:** The focus ring (`ring-2`) must transition in over 100ms.

### Cursor-Linked Highlights (Magic UI pattern)
- Applied to Bento Box cards (Dashboard) and Pricing cards.
- A radial gradient follows the user's mouse (`onMouseMove` capturing clientX/Y mapped to CSS variables `--mouse-x`, `--mouse-y`).

## 4. Structural Animations
### Dialogs & Modals
- **Backdrop:** Fades in (`opacity: 0 -> 1`).
- **Modal Body:** Scales up (`scale: 0.95 -> 1`) while fading in. Uses the standard spring config to settle perfectly into place.

### Sheets (Side Drawers)
- Enters from the right edge. `initial={{ x: '100%' }} animate={{ x: 0 }}`.
- Slower spring (`stiffness: 300, damping: 35`) to account for the larger distance traveled.

### Layout Shifts (`layout` prop)
- When lists change order (e.g., sorting the Trades table) or elements expand (e.g., opening an accordion), attach the `layout` prop in Framer Motion. This interpolates the bounding box changes seamlessly rather than snapping.

## 5. Staggered Reveals
When a page loads complex data (e.g., the Dashboard metrics), elements should not appear all at once, nor should they load individually with unrelated spinners.
- Wrap the grid in a `motion.div` with `variants` defining a `staggerChildren: 0.05`.
- Each child (Card) fades and slides up sequentially. This creates a highly premium cascading entrance.

## 6. Scroll Reveals (Marketing Only)
- For the Landing Page (`/`), elements should reveal as they enter the viewport.
- Use `whileInView={{ opacity: 1, y: 0 }}` and `viewport={{ once: true, margin: "-100px" }}` to trigger animations slightly before they cross the threshold.
- Integrate **Lenis** for global smooth scrolling on marketing pages ONLY (do not use smooth scrolling inside the authenticated app, as it creates input lag for data-heavy interfaces).

## 7. Performance & Accessibility Rules
- **Reduced Motion:** Respect `prefers-reduced-motion`. Wrap extreme layout shifts in checks, or use Framer Motion's global reduced motion handling to degrade springs into simple crossfades.
- **GPU Acceleration:** Always animate `transform` (scale, x, y) and `opacity`. NEVER animate `width`, `height`, `margin`, or `padding` directly unless using the `layout` prop (which uses transforms under the hood).
- **Forbidden:** No infinite bouncing, pulsing (except skeletons), or spinning (except tiny loading indicators).
