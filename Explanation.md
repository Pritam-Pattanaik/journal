
# TradeVault – Institutional Engineering Documentation

# 1. Project Overview

## 1.1 Project Name
**TradeVault** (V2)

## 1.2 Vision
To become the ultimate operating system for independent and retail traders, elevating their workflow, data analysis, and market awareness to institutional and professional standards.

## 1.3 Mission
TradeVault exists to bridge the massive tooling gap between simplistic, spreadsheet-based trade journals and prohibitively expensive, complex institutional terminals (like Bloomberg). It aims to provide traders with a unified platform where they can log trades, analyze performance, understand macroeconomic conditions, and receive unbiased, data-driven AI coaching.

## 1.4 Problem Statement
Retail traders consistently underperform and lose capital not necessarily due to a lack of strategy, but due to psychological pitfalls: lack of discipline, poor position sizing, and emotional "revenge trading." 
Existing trade journals merely act as accounting tools—recording Profit and Loss (PnL). They fail to provide contextual market analysis, they do not correlate market breadth with trade success, and they offer zero proactive, personalized coaching to correct behavioral mistakes. Traders are left with raw data but no insight.

## 1.5 Target Users
- Intermediate to advanced retail stock, options, and futures traders.
- Day traders, swing traders, and active investors.
- Traders who approach trading as a serious business and require strict risk management and performance analytics.

## 1.6 Why This Project Exists
Traders need more than just a ledger; they need a mirror. TradeVault was created because the market lacked an all-in-one solution that combined trade execution journaling with deep psychological tracking (the "Discipline Engine") and live market context (the "News Engine"). The project exists to enforce trading rules mechanically, leveraging AI to point out flaws that a human trader's ego might otherwise ignore.

## 1.7 Long-Term Goals
- **Full Automation:** Seamless, real-time syncing with major brokerages (Zerodha, Interactive Brokers, etc.) via secure API integrations to automate trade logging.
- **Proactive Risk Management:** Live rule enforcement that can temporarily lock a trader out of their broker via API if they hit their daily loss limits.
- **Institutional AI Coaching:** Advancing the "Lunar AI" coach to the level of a human quantitative trading psychologist, capable of identifying microscopic flaws in a trader's execution patterns over large datasets.

---

# 2. Product Philosophy

## 2.1 Design Philosophy
**Premium, High-Density, Low-Noise.**
TradeVault is designed to look and feel like top-tier, modern SaaS tools (drawing inspiration from Vercel, Linear, and Stripe). It avoids the cluttered, chaotic, red-and-green flashing lights typical of legacy retail trading platforms.
- *Why:* Traders suffer from decision fatigue and sensory overload. A calm, typography-driven, dark-mode-optimized UI with subtle glassmorphism helps maintain focus and psychological equilibrium.

## 2.2 UX Philosophy
**Keyboard-First, Zero-Friction.**
Every critical action should be accessible within two clicks or a keyboard shortcut. Information density is prioritized so that a trader can view their charts, news, and PnL simultaneously without scrolling.
- *Why:* In active trading, milliseconds matter. The platform must never get in the user's way. Friction in trade journaling leads to skipped entries, which corrupts the data pool.

## 2.3 Engineering Philosophy
**Strict Types, Modular, and Future-Proof.**
The system relies heavily on TypeScript to eliminate runtime ambiguity. We enforce a strict separation of concerns—frontend state is completely decoupled from backend persistence, allowing UI logic to be developed rapidly via mock services before being wired to the real API.
- *Why:* Financial applications have zero tolerance for data corruption or type coercion errors. A scalable architecture allows the platform to pivot easily, for example, from a monolithic Express app to microservices if load demands it.

## 2.4 AI Philosophy
**Co-Pilot, Not Autopilot (with Strict Compliance).**
AI in TradeVault (such as the Triage Worker, Scoring Worker, and Lunar AI Coach) is designed to analyze, filter, and coach—*never* to execute trades or offer financial advice. 
- *Why:* Regulatory constraints (such as SEBI rules in India) mandate that platforms cannot offer specific stock recommendations or guarantee returns without being a registered Research Analyst. Therefore, all AI output operates strictly in `EDUCATIONAL_MODE`, explicitly appending SEBI disclaimers and focusing on sector-level analysis rather than ticker-level predictions. Furthermore, AI must degrade gracefully; if Claude is unavailable, the system automatically falls back to Groq without crashing.

## 2.5 Security Philosophy
**Zero-Trust and Immutable Logging.**
TradeVault handles highly sensitive financial data and API keys. The system requires rigorous JWT-based authentication. Furthermore, all AI-generated content (like News Impacts) is tied to an immutable `NewsAuditLog`.
- *Why:* In the event of a regulatory audit, the platform must prove exactly what prompt was sent to the LLM, what was returned, and how it was filtered. Immutable logging ensures absolute transparency and legal protection.

## 2.6 Performance Philosophy
**O(1) Rendering and Optimistic Updates.**
The frontend heavily utilizes Zustand for atomic state management to prevent unnecessary re-renders. Large lists (like trade history) are virtualized. 
- *Why:* Traders have multiple tabs and intensive applications running (like TradingView or broker software). TradeVault must consume minimal CPU and RAM, maintaining a silky-smooth 60fps experience even with thousands of trades loaded into the client.

---

# 3. Current Development Status

## 3.1 Current Version & Phase
**Version:** v2.0-alpha (Transition Phase)
**Phase:** Backend API, Database Replacement & AI Pipeline Integration.
The project is currently transitioning from its V1 prototype (which relied on an in-memory mock backend and LocalStorage) to a robust V2 architecture powered by a real Node.js/Express backend, PostgreSQL (Neon), and Prisma.

## 3.2 What Has Been Completed (Approx. 65%)
✅ **Frontend UI & Layout:** The complete design system, responsive layouts, sidebar navigation, and Vercel-like premium aesthetic are fully implemented.
✅ **State Management Framework:** Zustand stores (`authStore`, `tradeStore`, `uiStore`, etc.) are fully architected.
✅ **Database Architecture:** The comprehensive Prisma schema (`schema.prisma`), including 8 new tables for the AI News Engine, is finalized and migrated.
✅ **AI News Engine (Backend):** The pipeline for ingesting RSS feeds, triaging relevance (via Claude Haiku or Groq), scoring impact (via Claude Sonnet or Groq), and saving to the DB is fully built, tested, and actively functioning. It includes resilient circuit breakers and automatic fallbacks to Groq natively.
✅ **Backend Authentication:** JWT-based signup/login routes are implemented.

## 3.3 What Is In Progress (Approx. 15%)
🚧 **Frontend-to-Backend Wiring:** Replacing the mocked API calls in the frontend Zustand stores with `fetch` calls to the newly built Express routes (e.g., wiring the `/api/news-engine/feed` to the `NewsEngineFeed.tsx` component).
🚧 **Discipline Engine Logic:** Migrating the behavioral scoring algorithms from the frontend mock services to the backend Node.js worker environment.

## 3.4 What Is Pending (Approx. 20%)
📋 **Live Broker Integrations:** Implementing OAuth and secure API key storage to fetch live trades directly from brokers (Zerodha, Alpaca, etc.).
📋 **Real-Time Data (WebSockets):** Connecting the frontend charts and market breadth indicators to live data feeds (like Polygon.io).
📋 **Subscription/Billing:** Integrating Stripe for SaaS monetization.
📋 **Lunar AI Full Integration:** Upgrading the frontend AI Coach chat to communicate with the real backend LLM endpoints rather than simulated responses.
# 4. Complete Folder Structure

The project employs a clear separation between the client and the server, functioning somewhat like a monorepo.

```text
tradevault/
├── dist/                # (Generated) Production frontend build output
├── public/              # Static assets (favicons, manifest)
├── src/                 # Frontend React application
│   ├── assets/          # Local static files (images, SVGs)
│   ├── components/      # Reusable UI components
│   │   ├── admin/       # Admin dashboard tools and metric widgets
│   │   ├── ai/          # AI Coach chat interface, markdown stream renderers
│   │   ├── dashboard/   # High-level overview widgets (PnL, goals, calendars)
│   │   ├── journal/     # Daily journaling and weekly/monthly reflection editors
│   │   ├── layout/      # Core app layout, navigation sidebar, topbars
│   │   ├── marketing/   # Landing page and public-facing routes
│   │   ├── markets/     # Intelligence Hub, News Engine feeds, Sector heatmaps
│   │   ├── settings/    # User preferences, broker integration UI, Watchlist settings
│   │   ├── trade/       # Trade rows, forms, and discipline evaluation UI
│   │   └── ui/          # Generic Design System (Buttons, Badges, Modals, Dialogs)
│   ├── hooks/           # Custom React hooks (e.g., useDebounce, useAuth)
│   ├── lib/             # Utility configurations (API client wrappers, fetcher)
│   ├── pages/           # Route-level view components (e.g., Markets.tsx)
│   ├── stores/          # Zustand global state (authStore, newsStore, tradeStore)
│   ├── types/           # TypeScript interfaces shared across the frontend
│   └── utils/           # Helper functions (date formatting, currency math)
├── server/              # Backend Node.js/Express application
│   ├── prisma/          # Database schema and migrations (`schema.prisma`)
│   ├── src/
│   │   ├── db/          # Database connection instantiation
│   │   ├── lib/         # Shared backend utilities (logger, providers, discipline logic)
│   │   ├── middleware/  # Express middlewares (JWT auth, error handlers)
│   │   ├── news-engine/ # The AI News Engine core
│   │   │   ├── ai/        # Prompts and LLM registry
│   │   │   ├── delivery/  # Push notifications, digests, and watchlist filtering
│   │   │   ├── ingestion/ # RSS adapters, Rate Limiters, Source Registry
│   │   │   ├── processing/# Entity taggers, Compliance filters, Triage/Scoring workers
│   │   │   └── queue/     # In-process EventEmitter queues
│   │   ├── routes/      # Express API route controllers (e.g., news-engine.ts, auth.ts)
│   │   └── services/    # Business logic (e.g., lockService, rate limiters)
│   └── .env             # Backend environment configuration
└── package.json         # Root scripts and frontend dependencies
```

### Key Architectural Folders
- `src/stores/`: Zustand isolates business logic and state from React components. Stores handle API calls and state mutation, allowing components to remain purely presentational.
- `server/src/news-engine/`: A completely modularized sub-system. It has its own queue, ingestors, and processing workers, totally isolated from standard CRUD routes. This isolation ensures the engine can eventually be extracted into a separate microservice if needed.

---

# 5. System Architecture

TradeVault is built on a standard decoupled Client-Server architecture.

## 5.1 Frontend Architecture
The frontend is a Single Page Application (SPA) built with React and Vite. It utilizes **Zustand** for global state and atomic updates. The UI is built using a custom utility-first approach with Tailwind CSS, augmented by Radix UI primitives for accessible overlays (dialogs, dropdowns).
- **Data Flow:** UI Action → Zustand Store → Fetch API → Zustand State Mutation → React Re-render.

## 5.2 Backend Architecture
The backend is a monolithic Node.js/Express application, highly modularized. It uses **Prisma** as an ORM to interact with a PostgreSQL database.
- **Routing:** API requests are handled by specific controllers in `server/src/routes`.
- **Background Tasks:** The application runs several continuous background workers via `setInterval` and `node-cron` (e.g., the `SourceRegistry` for news ingestion, and `DigestBuilder` for daily summaries).

## 5.3 Authentication Flow
1. User submits credentials to `/api/auth/login`.
2. Backend verifies via `bcrypt` and generates a JWT signed with `JWT_SECRET`.
3. The JWT is returned to the client and stored (currently in memory/local storage by `authStore`).
4. Subsequent requests include the token in the `Authorization: Bearer <token>` header.
5. The `authenticate` middleware in Express verifies the token before allowing access to protected routes.

## 5.4 AI News Engine Flow
This is the most complex subsystem in TradeVault.
1. **Ingestion:** `SourceRegistry` polls RSS feeds (NSE, BSE, RBI, PIB, Macro) every 60 seconds. Items are deduplicated via SHA-256 hashing.
2. **Triage:** New items enter the `TriageQueue`. `TriageWorker` evaluates them for market relevance using Groq (or Anthropic Haiku). Irrelevant items are discarded.
3. **Scoring:** Relevant items enter the `ScoringQueue`. `ScoringWorker` evaluates the directional impact on sectors using Groq (or Anthropic Sonnet).
4. **Compliance:** Model output passes through Zod validation and Regex word-filters to ensure it acts as an educational tool, not a registered investment advisor. SEBI disclaimers are forcibly injected.
5. **Delivery:** Scored items are pushed to user feeds and evaluated against `UserWatchlist` for breaking push alerts. 
6. **Auditing:** Every single LLM interaction is immutably written to `NewsAuditLog` to ensure regulatory compliance.

## 5.5 Database Flow
The system uses Neon's serverless PostgreSQL. Prisma handles all schema migrations and type generation. Due to the serverless nature of Neon, Prisma is configured to use connection pooling (`pgbouncer=true`).

---

# 6. Technology Stack

### 6.1 Frontend Stack
- **React 18:** Chosen for its massive ecosystem and component-driven architecture.
- **TypeScript:** Enforces type safety across the entire stack. Catching errors at compile-time is critical for financial data.
- **Vite:** Replaces Webpack. Chosen for sub-second Hot Module Replacement (HMR) and optimized Rollup production builds.
- **Tailwind CSS:** Chosen for utility-first styling. It avoids massive CSS bundle bloat and keeps styling collocated with logic.
- **Zustand:** Chosen over Redux for state management due to its minimal boilerplate and ability to update state without wrapping the app in context providers.
- **Framer Motion:** Used for premium, 60fps micro-animations that give the platform an institutional "app" feel rather than a flat webpage.
- **Recharts / Lightweight Charts:** Used to render financial data, PnL curves, and discipline breakdown pies.
- **Lucide React:** Minimalist, consistent icon library.

### 6.2 Backend Stack
- **Node.js & Express:** Chosen for rapid iteration and seamless TypeScript sharing between frontend and backend.
- **Prisma:** Modern ORM chosen for its incredibly strict type safety and auto-generated TypeScript clients.
- **PostgreSQL (Neon):** Chosen for relational data integrity (ACID compliance) and serverless scalability. Neon allows for cheap branching and scaling.
- **Groq:** Primary AI inference engine for the News pipeline. Chosen because LLaMA 3 70B runs at blistering speeds (800+ tokens/sec) effectively for free, easily handling massive volumes of incoming market data.
- **Anthropic SDK:** Used for Claude Haiku/Sonnet integration (fallback/upgrade path for higher fidelity reasoning).
- **Zod:** Schema validation library used heavily in the Compliance Filter to guarantee AI outputs match the expected strict JSON format.

---

# 7. Environment Variables

The backend relies on a `.env` file located in the `server/` directory. **Secrets must never be committed to version control.**

| Variable | Required | Default | Purpose | Security Level |
| :--- | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | - | Connection string for PostgreSQL (Neon). Must include `pgbouncer=true`. | High |
| `JWT_SECRET` | **Yes** | - | Cryptographic key used to sign and verify user authentication tokens. | Critical |
| `PORT` | No | `3000` | The local port the Express API listens on. | Low |
| `GROQ_API_KEY` | **Yes** | - | API key for Groq inference. Powers the default AI triage and scoring engines. | High |
| `ANTHROPIC_API_KEY` | No | - | Optional API key for Claude. If absent, the engine seamlessly uses Groq natively. | High |
| `NODE_ENV` | No | `development` | Dictates express behavior, logging verbosity, and CORS strictness. | Low |
| `NEWS_ENGINE_ENABLED`| No | `true` | Feature flag to completely disable background RSS polling and AI queues. | Low |
| `MAX_DAILY_SCORING_USD`| No | `15` | Cost cap. Pauses the scoring worker if daily API spend exceeds this limit. | Low |
| `HUMAN_REVIEW_REQUIRED`| No | `false` | If true, scored AI news requires manual admin approval before being delivered to users. | Low |
# 8. API Documentation

TradeVault's backend exposes a RESTful API prefixed with `/api`. All protected routes require a Bearer token.

## 8.1 Authentication Endpoints
- **POST `/api/auth/signup`**
  - **Purpose:** Register a new user.
  - **Request:** `{ email, password, fullName }`
  - **Response:** `201 Created`
  - **Validation:** Enforces email format and password strength via Zod (or basic checks).
- **POST `/api/auth/login`**
  - **Purpose:** Authenticate and retrieve JWT.
  - **Request:** `{ email, password }`
  - **Response:** `{ token, user }`

## 8.2 News Engine Endpoints (Protected)
- **GET `/api/news-engine/health`**
  - **Purpose:** Returns the operational status of the background workers and queue depth.
  - **Response:** `{ status: 'healthy'|'degraded', engine: { running }, pipeline: { itemsLast1h, triagePassRate... } }`
- **GET `/api/news-engine/sectors`**
  - **Purpose:** Retrieve all standard market sectors for filtering (e.g., Nifty Bank, Nifty IT).
  - **Response:** `{ sectors: string[], disclaimer: string }`
- **GET `/api/news-engine/feed`**
  - **Purpose:** Fetch the scored, contextualized news impact feed.
  - **Query Params:** `?sector=Nifty Bank&direction=positive&limit=10`
  - **Response:** `{ feed: NewsImpactUI[], disclaimer: string }`
- **GET/POST/DELETE `/api/news-engine/watchlist`**
  - **Purpose:** Manage the user's specific watchlist (sectors or tickers) for breaking alerts.

## 8.3 Core Data Endpoints (In Progress / Partially Mocked)
- **GET/POST `/api/trades`** (Planned implementation)
- **GET/POST `/api/journal`** (Planned implementation)
- **GET `/api/analytics`** (Planned implementation)

---

# 9. Database Documentation

The project uses PostgreSQL with Prisma as the ORM. The schema is highly normalized.

## 9.1 Core Models
- **`User`**: Core identity. Has relations to almost all other tables.
- **`BrokerConnection`**: Stores encrypted API keys and OAuth tokens for broker sync.
- **`Trade`**: Represents a single completed execution (or a merged position). Includes complex JSON fields for `disciplineReasons`, `disciplineSignals`, and `checklist`.
- **`Strategy`**: The trading framework assigned to a `Trade`.
- **`JournalEntry`**: Daily textual reflections and market bias.
- **`Goal` / `GoalCompletion`**: Habit tracking (e.g., "Don't revenge trade").

## 9.2 AI News Engine Models
- **`NewsRawItem`**: The raw RSS/JSON payload directly from the ingestion source. Deduplicated via `dedupeHash`.
- **`NewsTriage`**: 1-to-1 with `NewsRawItem`. Stores the boolean `relevant` flag and `urgency`.
- **`NewsImpact`**: 1-to-1 with `NewsRawItem`. Stores the `direction` and `sectorImpact` as evaluated by the scoring model.
- **`NewsAuditLog`**: Immutable ledger of every LLM prompt and response. Required for SEBI compliance.
- **`UserWatchlist`**: Associates a user with a sector/ticker to trigger push notifications.

## 9.3 Migration Strategy
Migrations are handled declaratively via `npx prisma migrate deploy`. Since the DB is hosted on Neon (Serverless Postgres), schema changes are generally non-blocking, but backwards-incompatible changes must be deployed carefully with multi-phase rollouts.

---

# 10. State Management

TradeVault utilizes a highly decoupled, atomic state management strategy.

## 10.1 Zustand
Zustand is the primary global state manager. It completely replaces Redux.
- **`authStore.ts`**: Manages the JWT, login status, and the current user profile. It hydrates from `localStorage` on boot.
- **`tradeStore.ts`**: Holds the array of trades, handles client-side filtering, and computes aggregate PnL in memory (for the mock implementation).
- **`newsStore.ts`**: Manages the active sector filter, polling logic for the news feed, and the user's watchlist subscriptions.
- **`uiStore.ts`**: Manages ephemeral layout states (e.g., is the sidebar collapsed? Which slide-over drawer is open?).

## 10.2 Component/React State
Local `useState` is heavily restricted to form inputs, toggle switches, and strictly local UI interactions. Business logic is invariably pushed up to Zustand.

## 10.3 URL Search Params
Used for deep linking (e.g., `/markets?sector=Nifty+Bank`). The application uses `react-router-dom`'s `useSearchParams` to sync URL state with the Zustand stores.

---

# 11. Authentication System

TradeVault implements a stateless, token-based authentication system.

## 11.1 Flow
- **Token Format:** JSON Web Tokens (JWT).
- **Storage:** The frontend currently stores the JWT in memory (via Zustand) and persists it using Zustand's `persist` middleware (backed by `localStorage`).
- **Authorization (Backend):** The `authenticate` middleware intercepts requests, extracts the Bearer token, verifies it using `JWT_SECRET`, and attaches the `userId` to the `req.user` object.

## 11.2 Security Model
- **Current Limitation:** Because the token is in `localStorage`, it is theoretically vulnerable to XSS. 
- **Planned Refactor:** Moving the JWT to an `HttpOnly` cookie set by the backend to eliminate XSS token theft.

## 11.3 Protected Routes (Frontend)
The `AuthLayout.tsx` wrapper component checks `authStore.isAuthenticated`. If false, it completely suspends rendering of the children (`Outlet`) and triggers a `Navigate` to `/login`.
# 12. AI System

TradeVault integrates AI across two distinct verticals: The **News Engine** (Macro context) and the **Lunar AI Coach** (Micro psychology).

## 12.1 The Lunar AI Coach (Frontend/Backend Hybrid)
- **Purpose:** Provide a conversational interface where the trader can query their own performance (e.g., "Why did I lose money this week?").
- **Conversation State:** Managed by `AiConversation` and `AiMessage` tables.
- **Coach Memory:** The system utilizes a `CoachMemory` table to track recurring psychological flaws. If the AI detects "Revenge Trading" multiple times, it permanently logs this in memory, allowing future sessions to reference past mistakes.
- **Implementation:** Currently in the V2 transition, the frontend chat interface is built, but the backend RAG (Retrieval-Augmented Generation) pipeline linking the `Trade` database to the LLM is **Planned / In Progress**.

## 12.2 The News Engine Pipeline
- **Prompt Flow:** Controlled by `PromptRegistry.ts`. Prompts are strictly versioned (`triage-v1.0`, `scoring-v1.0`) and forcibly inject structural JSON requirements.
- **Scoring & Context:** The model identifies the specific Nifty sector impacted by a news article, assigns a `direction` (positive/negative), and provides a `rationale`.
- **Fallbacks:** 
  - Triage natively defaults to Groq (`llama-3.3-70b-versatile`) for speed/cost.
  - Scoring prefers Anthropic (`claude-sonnet-4-5`) if the API key is present, but seamlessly degrades to Groq if absent or if Anthropic throws an error.
- **Rate Limits:** Ingestion rate limiters prevent IP bans from news sources (e.g., backing off when PIB returns 403). AI cost is strictly capped by `MAX_DAILY_SCORING_USD`.

---

# 13. Broker Integration

TradeVault relies on fetching live trade execution data directly from brokers rather than forcing manual CSV uploads.

## 13.1 Architecture (In Progress)
- **Provider Registry:** Found in `server/src/lib/brokers/`. Follows the Adapter pattern. Each broker (e.g., `dhan.ts`, `angelone.ts`) implements a standard `BrokerAdapter` interface to normalize vastly different API payloads into the standard TradeVault `Trade` format.
- **Authentication Model:** Uses OAuth 2.0 where supported, or encrypted API Key/Secret pairs stored in `BrokerConnection`.
- **Token Lifecycle:** `BrokerConnection` stores the `refreshToken` and `tokenExpiry`. A cron job is planned to proactively refresh expiring tokens before the market opens.
- **Sync Process:** (Planned) A Webhook or background poller will ingest trades continuously and pass them through the `DisciplineEngine` for immediate evaluation.

---

# 14. UI System

The UI is built to mimic high-end enterprise SaaS (think Vercel, Linear). 

## 14.1 Design System & Typography
- **Typography:** Uses a strict hierarchy. `Bricolage Grotesque` for commanding display headers, `Geist Sans` for highly legible dense UI text, and `DM Mono` for numerical data (PnL, prices) ensuring tabular alignment.
- **Color System:** Fully semantic, utilizing CSS variables (e.g., `--background`, `--primary`, `--border`) allowing for effortless theming. The app currently strictly enforces a highly polished Dark Mode to reduce eye strain for traders.
- **Glassmorphism:** Strategic use of `backdrop-blur` and semi-transparent borders on sticky headers and floating command palettes creates a premium depth effect.

## 14.2 Component Architecture
- Built on top of **Tailwind CSS** combined with **Radix UI** primitives. Radix handles the complex accessibility (ARIA attributes, keyboard navigation, focus trapping) of interactive components (Dialogs, Tooltips, Selects), while Tailwind handles the visual presentation via `className`.
- `clsx` and `tailwind-merge` are used heavily to safely compose dynamic classes without utility conflicts.

## 14.3 Animations
- Powered by **Framer Motion**.
- Used for structural transitions (e.g., slide-over drawers for trade details, expanding/collapsing sidebars) and micro-interactions (subtle scale-ups on hover). Animations are kept short (<200ms) to maintain the feeling of speed.

## 14.4 Responsive Strategy
- **Mobile-First Grid:** The layout uses CSS Grid and Flexbox to collapse gracefully. The complex Dashboard and Markets views stack horizontally on mobile, ensuring full usability on iOS/Android browsers.

---

# 15. Performance Optimizations

TradeVault is built to handle thousands of historical trades loaded into memory.

## 15.1 Current Optimizations
- **Virtualization:** The main Trade ledger utilizes `@tanstack/react-virtual` to only render the rows currently visible on the screen. A user can have 10,000 trades, but only 30 DOM nodes are rendered.
- **Memoization:** Heavy calculations, such as aggregating equity curves or grouping trades by strategy, are wrapped in `useMemo` so they only recalculate when the underlying data changes, not on every render.
- **Debouncing:** Inputs (like search bars or complex filters) use custom `useDebounce` hooks to prevent thrashing the state or API.

## 15.2 Bundle Strategy
- **Vite:** The build pipeline uses Rollup to split the code into optimized chunks. Third-party dependencies (like Recharts and Framer Motion) are heavily tree-shaken.

## 15.3 Future Optimizations (Planned)
- **Web Workers:** Moving heavy statistical array calculations (like computing the maximum drawdown over a 5,000-trade dataset) off the main thread into Web Workers to prevent UI freezing.
- **TanStack Query (React Query):** Replacing basic `useEffect` data fetching with React Query to handle complex caching, background refetching, and optimistic UI updates automatically.
# 16. Security

As a financial technology application, security is paramount.

## 16.1 Current Security
- **Authentication:** Passwords are mathematically hashed using `bcrypt` (salt rounds: 10) before hitting the database. JWTs are signed with a strong cryptographic secret.
- **AI Output Sanitization:** The News Engine passes all raw LLM responses through `ComplianceFilter.ts` (Zod parsing + Regex keyword blacklisting) to prevent prompt injection or hallucinated stock recommendations.
- **Database Access:** The frontend has zero direct access to the database. All interactions funnel through the Express API which verifies JWT ownership.

## 16.2 Future Security & Threat Model (Planned)
- **XSS (Cross-Site Scripting):** Currently, JWTs are stored in `localStorage`, making them vulnerable to XSS if a malicious script runs on the page. **Planned Fix:** Migrate tokens to `HttpOnly` cookies.
- **CSRF (Cross-Site Request Forgery):** Once tokens move to cookies, CSRF tokens or strictly validated `Origin` headers will be required.
- **Rate Limiting:** Global rate limiting (e.g., `express-rate-limit`) will be implemented on login and signup routes to prevent brute-force attacks.
- **Encryption at Rest:** Broker API keys (currently stored in plain text in `BrokerConnection` during dev) must be symmetrically encrypted before being written to PostgreSQL.

---

# 17. Deployment

TradeVault is built to be deployed in a standard modern decoupled environment.

## 17.1 Development Environment
- Run `npm run dev` in the root. The `concurrently` package spins up both the Vite frontend (`localhost:5173`) and the Express backend (`localhost:3000`) simultaneously via `tsx`.

## 17.2 Production Build Process
- **Frontend:** Running `npm run build` executes `tsc -b` (strict type checking) followed by `vite build`, outputting optimized static assets to the `dist/` directory.
- **Backend:** The backend is compiled using `tsc` or run directly in production via `tsx` or standard Node.js.

## 17.3 Deployment Architecture (Planned)
- **Frontend (Vercel):** The `/dist` output is ideal for edge delivery via Vercel. 
- **Backend (Render / Railway / AWS):** The Express application will be containerized (Docker) and deployed to a scalable Node.js environment.
- **Database (Neon):** Neon's serverless Postgres allows automatic scaling based on connection pools.
- **CI/CD:** GitHub Actions will run `eslint` and `tsc` on every pull request to ensure type safety before merging to `main`.

---

# 18. Coding Standards

Uniformity is critical for long-term maintainability.

## 18.1 Naming Conventions
- **Components:** `PascalCase.tsx` (e.g., `TradeLedger.tsx`).
- **Hooks:** `camelCase` starting with `use` (e.g., `useDebounce.ts`).
- **Stores:** `camelCase` ending with `Store` (e.g., `tradeStore.ts`).
- **Backend Routes/Services:** `kebab-case` for URLs (`/api/news-engine`), `camelCase.ts` for service files.
- **Database Tables:** `PascalCase` in Prisma, mapping to `snake_case` in PostgreSQL (e.g., `@map("user_watchlist")`).

## 18.2 Architecture Conventions
- **Colocation:** CSS is collocated with components via Tailwind classes.
- **No Prop Drilling:** If a prop has to be passed down more than two levels, it must be lifted to a Zustand store.
- **Absolute Imports:** (Planned config) Using `@/components/` instead of `../../components/` to prevent brittle import paths.
- **Code Style:** Enforced strictly by ESLint. No `any` types allowed unless explicitly interacting with third-party, untyped legacy APIs.

---

# 19. Project Timeline

## 19.1 Past Milestones
- **Q1 2026:** V1 MVP. Created the entire frontend UI, mocked the backend via local storage, and built the static UI for the Lunar AI Coach and Dashboard.
- **Q2 2026:** The News Engine. Engineered the complete backend ingestion, triage, and scoring pipeline using Prisma and Groq/Anthropic.

## 19.2 Current Milestone
- **Transitioning to V2:** Rewiring the massive frontend mock infrastructure to connect seamlessly to the newly built Express API and Neon database.

## 19.3 Future Roadmap
- **Q3 2026:** Live Broker Integrations (OAuth/API Sync).
- **Q4 2026:** Advanced RAG implementation for Lunar AI Coach and Stripe Billing rollout.

---

# 20. Next Development Phases

| Phase | Objective | Priority | Difficulty | Estimated Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Wire Frontend to Backend DB | Critical | Low | Turns the mock app into a real persistence app. |
| **Phase 2** | Move JWT to HttpOnly Cookies | High | Medium | Secures the app against XSS attacks. |
| **Phase 3** | Implement React Query | Medium | High | Replaces brittle `useEffect` fetches with robust caching. |
| **Phase 4** | Broker Webhook Sync | High | Very High | Automates trade journaling, the core value proposition. |
| **Phase 5** | Encrypt Broker API Keys | Critical | Medium | Protects user brokerage accounts from DB leaks. |
# 21. Known Issues

- **Incomplete Backend Wiring:** Much of the frontend still relies on the mock `LocalStorage` data layer. Replacing these with `fetch` calls to `/api/...` is actively in progress.
- **Unencrypted API Keys:** The `BrokerConnection` table currently stores OAuth tokens and API secrets in plain text, which is a major security vulnerability that must be patched before production.
- **RSS Ingestion Brittle:** The News Engine's RSS ingestion occasionally fails if government websites (like PIB or RBI) change their feed formats or throw generic 403s.
- **No WebSocket Implementation:** The frontend currently polls the News Engine `/api/news-engine/feed` endpoint. This must be upgraded to WebSockets for real-time delivery.

---

# 22. Lessons Learned

- **Groq over Anthropic for Triage:** We initially planned to use Anthropic's Claude 3.5 Haiku for Triaging thousands of news articles. However, switching to Groq (`llama-3.3-70b-versatile`) reduced latency from ~2s per article to ~400ms, while reducing costs to nearly zero.
- **Prisma's Power and Rigidity:** Prisma has been phenomenal for generating strict TS types (`@prisma/client`). However, it has taught us that database schema changes must be planned perfectly in advance, as refactoring a core table (like `Trade`) cascades types across the entire frontend.
- **Zustand over Redux:** Dropping Redux in favor of Zustand vastly accelerated development velocity, eliminating hundreds of lines of boilerplate reducers and actions.

---

# 23. Future Vision

- **6 Months:** The platform is a fully functional web app. Users can securely connect their Zerodha/Dhan accounts, and the application automatically syncs their trades nightly, grading them against the Discipline Engine.
- **1 Year:** Release of native iOS/Android applications. The News Engine is fully real-time, delivering push notifications to users' phones the exact second a macroeconomic event breaks that impacts their specific watchlist.
- **3 Years:** Introduction of "TradeVault Execution." Instead of just tracking trades, traders can execute trades directly through the TradeVault UI, allowing the Discipline Engine to physically block a trade if it violates the user's risk rules.
- **5 Years:** The "Lunar AI" coach evolves into a full-fledged quantitative firm in the cloud. It doesn't just review past performance, but identifies profitable algorithmic patterns in a retail trader's data that they couldn't see themselves.

---

# 24. New Developer Guide

If you are a new engineer joining the TradeVault team, follow these steps to get started:

### 24.1 Setup
1. **Clone the repository:** `git clone <repo-url>`
2. **Install dependencies:** `npm install` (Root), then `cd server && npm install`.
3. **Environment Setup:** Copy `server/.env.example` to `server/.env`. Obtain the `DATABASE_URL` for the Neon staging database, and a `GROQ_API_KEY`.
4. **Database Sync:** Run `cd server && npm run db:push` to sync your local Prisma client with the remote schema.

### 24.2 Running the Application
- Run `npm run dev` in the root folder. 
- The frontend will be available at `http://localhost:5173`.
- The backend API will run at `http://localhost:3000`.

### 24.3 Understanding the Flow
- Start by opening `src/App.tsx` and tracing the routing.
- To understand state, look at `src/stores/authStore.ts`.
- To understand the backend, open `server/src/index.ts`, then look at `server/src/routes/news-engine.ts`.
- To understand the AI pipeline, read `server/src/news-engine/processing/TriageWorker.ts`.

---

# 25. Glossary

- **JWT (JSON Web Token):** The string used to securely transmit the user's logged-in state between the frontend and backend.
- **Zustand:** A small, fast, and scalable bearbones state-management solution for React.
- **Prisma:** A next-generation Node.js and TypeScript ORM.
- **RAG (Retrieval-Augmented Generation):** The process of fetching a user's historical trades from the database and passing them to Lunar AI to give the model context before it replies.
- **Triage:** The first phase of the News Engine where an LLM rapidly discards irrelevant or noise-heavy news articles.
- **Scoring:** The second phase of the News Engine where an LLM deeply analyzes a relevant article to determine its sector impact (Positive/Negative/Mixed).
- **SEBI:** Securities and Exchange Board of India. The regulatory body whose rules dictate that TradeVault's AI must never recommend specific stocks.

---

# 26. Appendix

### Useful Commands
- `npm run dev`: Start both frontend and backend concurrently.
- `npm run build`: Compile frontend for production.
- `npx prisma studio`: Open a local GUI to view the Neon PostgreSQL database.
- `npx prisma generate`: Update the TypeScript types after modifying `schema.prisma`.

### Development Checklist before PR
- [ ] Ensure `tsc -b` passes with zero type errors.
- [ ] Ensure `eslint .` throws no warnings.
- [ ] Do not commit `.env` or any hardcoded API keys.
- [ ] If you altered `schema.prisma`, ensure you ran `npx prisma format` and `npx prisma generate`.

### Documentation Sign-off
*This document accurately reflects the TradeVault V2 architecture as of July 2026. Features marked as "Planned" or "In Progress" are explicitly documented as such.*

