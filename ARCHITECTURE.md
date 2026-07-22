# Architecture Overview

TradeVault is built using a modern full-stack web application architecture:

## 1. Client-Side (Frontend)
- **Framework:** React 18, Vite 6, TypeScript
- **Styling:** Tailwind CSS 3, Framer Motion 12 for fluid UI animations
- **State Management:** Zustand for global state (auth, trades, journal, strategies, UI)
- **Routing:** React Router v6
- **Data Visualization:** Recharts for charts and analytics

## 2. Server-Side (Backend)
- **Runtime:** Node.js, Express 5
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Prisma 6 ORM for type-safe database access and migrations
- **Authentication:** Custom JWT-based authentication (stored in Bearer tokens), bcrypt for password hashing
- **Deployment:** Vercel (using `@vercel/node` for the backend API and `@vercel/static-build` for the frontend)

## 3. External Integrations
- **AI Providers:** Supports Anthropic Claude, Google Gemini, and Groq via SDKs to provide AI-powered trade insights and behavioral pattern analysis.
- **Brokers:** Integrates with Dhan and AngelOne APIs to automatically sync executed trades into the platform.

## 4. Key Architectural Patterns
- **Database Structure:** A relational structure using PostgreSQL where a `User` has `Trades`, `JournalEntries`, `Strategies`, `BrokerConnections`, and `AiInsights`.
- **Sync Locking:** The backend implements an in-memory lock during broker trade sync to prevent duplicate syncs per user per broker.
- **AI Analysis Flow:** User's trades are fed into a prompt. The LLM performs behavioral analysis and identifies patterns (e.g., revenge trading), which are then upserted into the `coach_memory` table for persistent AI tracking.
- **Admin System:** Role-Based Access Control (RBAC) with `USER`, `SUB_ADMIN`, `ADMIN`, and `SUPER_ADMIN` roles for administrative endpoints.

*(Note: This document replaces the outdated `02_Technical_Architecture.md` and reflects the actual implemented Prisma-based schema and current broker integrations.)*
