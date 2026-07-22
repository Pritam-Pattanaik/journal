# TradeVault

TradeVault is a premium, institutional-grade journal and market intelligence platform for retail traders. It seamlessly integrates trade logging, AI-driven performance coaching, and deep market context, elevating the user's trading awareness to professional standards.

## Project Overview

### Purpose
To bridge the gap between simple trade journals and complex Bloomberg-style terminals. TradeVault allows traders to log their trades, analyze performance, receive un-biased AI coaching, and understand macroeconomic conditions all in one unified platform.

### Vision
To become the ultimate operating system for independent traders, empowering them with data-driven insights to reduce emotional trading and improve their win rates consistently over time.

### Problem Statement
Retail traders often lose money due to a lack of discipline, poor position sizing, and emotional "revenge trading." While existing journals record PnL, they fail to provide contextual market analysis or personalized coaching to correct these psychological pitfalls.

### Target Users
- Intermediate to advanced retail stock/options traders
- Day traders and swing traders
- Traders seeking to treat their trading like a professional business

### Core Features
- **Intelligent Trade Journal:** Log trades with automatic tagging, execution quality rating, and rich text notes.
- **AI Coach (Lunar AI):** A personalized LLM assistant that reviews trade history and provides actionable insights.
- **Market & News Hub:** A premium intelligence center offering interactive macro charts, economic calendars, and sector heatmaps.
- **Analytics Dashboard:** Real-time metrics on win rate, profit factor, drawdown, and discipline adherence.
- **Goal Tracking:** Milestone tracking for consistency and compounding portfolio growth.

---

## Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS (Vanilla CSS approach without utility bloat, mimicking premium SaaS)
- **Icons:** Lucide React
- **Typography:** Bricolage Grotesque (Display), Geist Sans (UI), DM Mono (Numbers)
- **Routing:** React Router v6

### State Management
- **Library:** Zustand
- **Stores:** `authStore`, `tradeStore`, `uiStore`, `goalStore`, `insightStore`, `newsStore`

### Charts & Visualizations
- **Library:** Recharts
- **Components:** Interactive Area/Line charts, Pie charts for discipline, Bar charts for PnL.

### Animations
- **Library:** Framer Motion
- **Usage:** Micro-interactions, slide-overs, page transitions, and subtle hover states.

### Backend & Database (Mocked MVP)
- Currently operates on a mocked in-memory server via `tests/e2e/mock_server.ts`
- **Authentication:** JWT simulation with Bearer tokens
- **Data Persistence:** LocalStorage layer bridging with mock network latency

### AI Integration
- **Architecture:** Mocked LLM responses designed to simulate OpenAI/Claude endpoints.
- **Capabilities:** Strategy analysis, emotional state detection, and macroeconomic context generation.

---

## Folder Structure

```
tradevault/
├── dist/                # Production build output
├── public/              # Static assets (images, fonts, favicon)
├── src/                 # Application source code
│   ├── assets/          # Local static files
│   ├── components/      # Reusable UI components
│   │   ├── auth/        # Login/Signup forms
│   │   ├── dashboard/   # Dashboard widgets
│   │   ├── layout/      # Sidebar, Topbar, AppLayout
│   │   ├── markets/     # Intelligence Hub (Charts, News, Breadth)
│   │   ├── trade/       # Trade rows, forms, filters
│   │   └── ui/          # Generic design system (Buttons, Badges, Modals)
│   ├── lib/             # Utility configurations (API client, constants)
│   ├── pages/           # Route-level views (Markets.tsx, AICoach.tsx)
│   ├── stores/          # Zustand global state
│   ├── types/           # TypeScript interfaces and type definitions
│   └── utils/           # Helper functions (date formatting, currency math)
├── tests/               # E2E tests and Mock Server
└── eslint.config.js     # Linter configuration
```

---

## Application Modules

### Dashboard (`Dashboard.tsx`)
The user's home screen. Provides a bird's-eye view of account performance, active goals, and a quick summary of recent trades.

### Trades (`Trades.tsx`)
A powerful data table for viewing, sorting, and filtering historical trades. Includes execution quality tracking and detailed slide-over drawers for individual trade analysis.

### Journal (`Journal.tsx`)
A rich-text scratchpad for traders to write pre-market plans and post-market reviews.

### Market & News (`Markets.tsx`)
A Bloomberg-inspired intelligence hub featuring interactive charts, sector heatmaps, market breadth indicators, and an economic calendar.

### Analytics (`Analytics.tsx`)
Deep statistical breakdown of trader performance, including win rate curves, drawdown analysis, and strategy profitability.

### AI Coach (`AICoach.tsx`)
A chat-based interface where traders can converse with "Lunar AI" to analyze their past week's performance or get advice on specific psychological hurdles.

### Settings (`Settings.tsx`)
User profile management, theme preferences, and API key configuration.

---

## Architecture

### State Flow
The application uses a unidirectional data flow via Zustand. Components subscribe to specific slices of state. Actions dispatched to the stores handle API communication (mocked) and mutate the state, triggering re-renders.

### Design System
- **Typography:** `font-display` for headings, `font-sans` for body, `font-mono` for data/metrics.
- **Color Tokens:** Built on CSS variables mapping to semantic Tailwind classes (`bg-surface-0`, `text-primary`, `border-border`).
- **Responsive Strategy:** Mobile-first approach using flex/grid. The application maintains perfect layout fidelity from 320px up to 1920px screens.

---

## Security

### Authentication
- Implements JWT-style Bearer token authentication.
- Routes are protected via an `AuthLayout` wrapper that verifies session validity before rendering `Outlet`.
- Invalid sessions automatically redirect to `/login`.

### Environment Variables
- Safe environment variables loaded via Vite's `import.meta.env`.
- Secrets are never exposed to the client bundle.

---

## Performance Optimizations

- **Tree Shaking:** Vite and Rollup ensure dead code is eliminated during build.
- **SVG Icons:** Lucide-react optimizes icon delivery to prevent bloat.
- **Memoization:** Expensive calculations (like PnL summaries and chart data parsing) are wrapped in `useMemo`.

---

## Known Limitations

- **Mock Backend:** The current implementation relies on an in-memory mock server. A real backend (Node.js/Go) and database (PostgreSQL) must be implemented for production persistence.
- **Real-Time Data:** Market data in the Intelligence Hub is currently static/simulated. It requires integration with AlphaVantage, Polygon.io, or equivalent APIs.

---

## Roadmap

### Completed
- [x] Core Authentication UI and Auth State Management
- [x] Trade Logging and Journaling System
- [x] Advanced Analytics and Charting Visualizations
- [x] AI Coach Chat Interface
- [x] Premium Market & News Intelligence Hub
- [x] Production-grade Responsive Engineering

### Future
- [ ] Connect to live market data websockets
- [ ] Implement backend Node.js API with PostgreSQL
- [ ] Stripe integration for premium subscriptions
- [ ] Real LLM integration (OpenAI/Anthropic) for AI Coach

---

## Credits
- **Design & Architecture:** Built with inspiration from Linear, Vercel, and TradingView.
