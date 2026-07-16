# Project: TradeVault Super Admin Dashboard

## Architecture
TradeVault consists of a Vite React SPA frontend communicating via REST APIs with a Node/Express.js backend, which interacts with PostgreSQL via Prisma ORM.

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA Client (Vite)                  │
│       Zustand / TanStack Query ↔ Recharts UI Components     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS (JWT + requireRoles(['SUPER_ADMIN']))
┌──────────────────────────────▼──────────────────────────────┐
│                    Express.js REST APIs                     │
│        Controllers ↔ Middleware ↔ Prisma Client             │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL (Neon database)                  │
│    Models: User, Trade, AuditLog, SystemSetting, etc.       │
└─────────────────────────────────────────────────────────────┘
```

### Module Boundaries
- **Backend API Layer**: `server/src/index.ts` contains the routes and controllers. Middleware `requireRoles(['SUPER_ADMIN'])` guards access.
- **Database Model Layer**: `server/prisma/schema.prisma` contains the schema models.
- **Frontend Pages/Views**: `src/pages/` containing pages:
  - `src/pages/AdminDashboard.tsx` (to be updated/decomposed)
  - New sub-pages or sections for Overview, Users, Trades, Brokers, AI Monitor, Audit Logs, Settings.
- **Frontend Navigation Layout**: `src/components/layout/Sidebar.tsx` and `src/App.tsx` routes.

## Code Layout
- `server/prisma/schema.prisma`: Database Schema definition.
- `server/src/index.ts`: Backend routes, controllers, and middlewares.
- `src/components/layout/Sidebar.tsx`: Sidebar navigation component.
- `src/pages/`: Page components for each admin view.
- `src/lib/api.ts`: API request/client handler.
- `src/App.tsx`: Routing and entry configuration.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| **E2E Track** | | | | |
| E1 | E2E Test Suite | Design E2E test cases, harness and runner; write tests for Tiers 1-4; publish `TEST_READY.md` | None | PLANNED |
| **Impl Track** | | | | |
| M1 | Database Schema | Update `schema.prisma` with `AuditLog` and `SystemSetting`, run migrations, generate client, and seed initial admin data | None | PLANNED |
| M2 | Backend API Endpoints | Implement all Super Admin endpoints in `server/src/index.ts` (Overview stats, Users, Trades, Brokers, AI coach, Audit logs, Settings) | M1 | PLANNED |
| M3 | Navigation & Sidebar | Add sidebar navigation links and setup routing in `src/App.tsx` and `src/components/layout/Sidebar.tsx` | None | PLANNED |
| M4 | Overview & Settings UI | Create Home/Overview panel and Settings management page (features flags, announcements) | M2, M3 | PLANNED |
| M5 | User & Trade Explorer UI | Create User detail drill-down pages, pagination table, Trade Monitoring filters and aggregate stats | M2, M3 | PLANNED |
| M6 | AI Coach & Audit UI | Create AI coach monitoring usage charts and Audit log list | M2, M3 | PLANNED |
| M7 | E2E Integration & Polish | Wire up front-end, pass all E2E tests, execute Tier 5 Adversarial Coverage Hardening | E1, M4, M5, M6 | PLANNED |

## Interface Contracts

### Super Admin Authorization
All Super Admin backend endpoints must include:
- `Authorization: Bearer <token>` (managed by `authenticate` middleware)
- Role validation checking for `SUPER_ADMIN` (managed by `requireRoles(['SUPER_ADMIN'])`)

### REST API Endpoints

#### 1. System Overview Dashboard
- `GET /api/admin/overview`
  - Query parameters: `range` (7d, 30d, 90d)
  - Response:
    ```json
    {
      "totalUsers": 120,
      "userGrowth": 15.5,
      "totalTrades": 3500,
      "netPnl": 450000.50,
      "activeBrokerConnections": 80,
      "aiInsightsCount": 420,
      "userGrowthSeries": [{"date": "2026-07-01", "count": 105}, ...],
      "tradeVolumeSeries": [{"date": "2026-07-01", "volume": 120}, ...],
      "pnlSeries": [{"date": "2026-07-01", "pnl": 15000.20}, ...],
      "recentActivity": [
        { "id": "1", "type": "SIGNUP", "user": "John Doe", "timestamp": "2026-07-16T10:00:00Z" },
        { "id": "2", "type": "TRADE", "user": "Jane Smith", "symbol": "RELIANCE", "pnl": 500, "timestamp": "2026-07-16T09:45:00Z" },
        { "id": "3", "type": "AI_RUN", "user": "Bob Johnson", "timestamp": "2026-07-16T08:30:00Z" }
      ]
    }
    ```

#### 2. User Management
- `GET /api/admin/users`
  - Query parameters: `page`, `limit`, `search`, `role`, `sortBy`, `sortOrder`
  - Response:
    ```json
    {
      "users": [
        { "id": "uuid", "fullName": "John Doe", "email": "john@example.com", "role": "USER", "createdAt": "2026-06-01T00:00:00Z", "totalTrades": 45, "netPnl": 12500.50, "isSuspended": false }
      ],
      "total": 1,
      "pages": 1
    }
    ```
- `GET /api/admin/users/:id`
  - Response: Detailed profile including user info, strategies, recent trades, journal entries, broker connections, AI insights.
- `PATCH /api/admin/users/:id/role`
  - Request: `{ "role": "ADMIN" }`
  - Response: `{ "success": true, "user": { "id": "...", "role": "ADMIN" } }`
- `PATCH /api/admin/users/:id/status`
  - Request: `{ "isSuspended": true }`
  - Response: `{ "success": true, "user": { "id": "...", "isSuspended": true } }`
- `DELETE /api/admin/users/:id`
  - Response: `{ "success": true }`

#### 3. Trade Monitoring
- `GET /api/admin/trades`
  - Query parameters: `page`, `limit`, `user`, `startDate`, `endDate`, `market`, `instrumentType`, `symbol`, `status`, `pnlMin`, `pnlMax`
  - Response:
    ```json
    {
      "trades": [
        { "id": "uuid", "userId": "uuid", "userEmail": "john@example.com", "symbol": "SBIN", "market": "NSE", "instrumentType": "EQ", "direction": "LONG", "pnl": 1200, "charges": 50, "netPnl": 1150, "status": "WIN", "date": "2026-07-16T00:00:00Z" }
      ],
      "stats": { "totalTrades": 3500, "winRate": 56.5, "netPnl": 450000.50, "avgPnl": 128.57, "totalVolume": 150000 },
      "marketDistribution": [ { "market": "NSE", "count": 2200 }, ... ],
      "instrumentDistribution": [ { "type": "EQ", "count": 1800 }, ... ],
      "pnlHistogram": [ { "range": "0-1000", "count": 450 }, ... ],
      "total": 3500,
      "pages": 350
    }
    ```

#### 4. Broker Connection Management
- `GET /api/admin/brokers`
  - Response:
    ```json
    {
      "connections": [
        { "id": "uuid", "userEmail": "john@example.com", "broker": "zerodha", "isActive": true, "lastSyncedAt": "2026-07-16T05:30:00Z", "syncHealth": "SUCCESS" }
      ],
      "stats": { "total": 85, "activePercent": 94.1, "lastSyncFailures": 5 }
    }
    ```
- `POST /api/admin/brokers/:id/sync`
  - Trigger manual sync for connection ID
  - Response: `{ "success": true, "syncedCount": 12 }`
- `GET /api/admin/brokers/:id/logs`
  - Get sync health/error logs
  - Response: `[ { "timestamp": "...", "event": "SYNC_FAILED", "error": "Invalid access token" } ]`

#### 5. AI Coach & Insights Monitoring
- `GET /api/admin/ai`
  - Response:
    ```json
    {
      "totalInsights": 420,
      "recentAnalysisRuns": [
        { "id": "uuid", "userEmail": "john@example.com", "type": "deep_analysis", "createdAt": "2026-07-16T08:30:00Z" }
      ],
      "insightsPerUser": [
        { "userEmail": "john@example.com", "count": 15 }
      ],
      "insightTypeBreakdown": [
        { "type": "deep_analysis", "count": 200 },
        { "type": "trade_feedback", "count": 220 }
      ],
      "usageTimeline": [
        { "date": "2026-07-16", "count": 12 }
      ]
    }
    ```

#### 6. Audit Logs
- `GET /api/admin/audit`
  - Query parameters: `page`, `limit`, `action`, `startDate`, `endDate`, `search`
  - Response:
    ```json
    {
      "logs": [
        { "id": "uuid", "timestamp": "2026-07-16T10:00:00Z", "adminEmail": "admin@tradevault.in", "action": "ROLE_CHANGE", "targetType": "USER", "targetId": "uuid", "details": "Changed role of user john@example.com to ADMIN" }
      ],
      "total": 120,
      "pages": 12
    }
    ```

#### 7. System Settings
- `GET /api/admin/settings`
  - Response:
    ```json
    {
      "settings": [
        { "key": "enable_ai_coach", "value": "true" },
        { "key": "enable_broker_sync", "value": "true" },
        { "key": "maintenance_mode", "value": "false" },
        { "key": "system_announcement", "value": "Welcome to TradeVault!" }
      ]
    }
    ```
- `POST /api/admin/settings`
  - Request: `{ "key": "enable_ai_coach", "value": "false" }`
  - Response: `{ "success": true }`
