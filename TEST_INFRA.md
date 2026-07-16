# TradeVault E2E Test Suite Infrastructure (`TEST_INFRA.md`)

This document outlines the testing infrastructure, design, execution commands, and harness configuration for the TradeVault Super Admin Dashboard E2E test suite.

---

## 1. Testing Strategy: Opaque-Box E2E Testing

The E2E test suite is designed as an **opaque-box (black-box)** validator for the backend REST API layer. 
- **Opaque-Box Principle**: Tests communicate with the backend exclusively via network requests (HTTP). They do not inspect code paths, modify runtime database tables directly, or access internal memory.
- **Verification Criteria**: Responses are verified for status code correctness, body schema alignment (correct property types), statistical accuracy, and expected side-effects (e.g., state changes visible on subsequent requests).
- **Target URL**: The runner targets `http://localhost:3001/api` by default (configurable).

---

## 2. Stateful Mock Server Architecture

To facilitate zero-dependency, local E2E test execution (without requiring a live PostgreSQL DB or Prisma setup), the suite includes a **Stateful Mock Server** (`mock_server.ts`).

### 2.1 Server Features
- **In-Memory Store**: Tracks and mutates mock tables for Users, Trades, Broker Connections, AI Insights, and Audit Logs.
- **Write Mutation Handling**: Requests to `POST`, `PATCH`, and `DELETE` modify the state in memory, allowing E2E tests to verify state-dependent flows (e.g., deleting a user decrements the total user count on the overview).
- **Audit Action Tracking**: Admin mutations (role adjustments, suspensions, user deletions, settings updates) write audit log entries to the in-memory log list automatically.
- **Settings-Driven Behaviors**: System Settings are stateful. For example, setting `enable_ai_coach` to `"false"` disables the user-facing AI analysis routes.
- **Maintenance Lockouts**: When `maintenance_mode` is `"true"`, all standard user APIs return a `503 Service Unavailable`, while Super Admin APIs remain operational.

---

## 3. Test Runner Design (`run_tests.ts`)

The test runner programmatically handles the execution lifecycle of all 82 designed test cases.

### 3.1 Execution Lifecycle
1. **Startup**: Boots the mock server on port `3001` (avoiding local dev port conflict).
2. **Auth Token Collection**: Authenticates as `superadmin@tradevault.in` and `user@tradevault.in` to obtain Super Admin and standard User JWTs.
3. **Execution Phase**:
   - Executes **Tier 1 (Feature Coverage)**: 35 positive path tests.
   - Executes **Tier 2 (Boundary & Corner)**: 35 validation, edge-case, and authorization boundary tests.
   - Executes **Tier 3 (Cross-Feature)**: 7 integration tests checking system-wide interactions.
   - Executes **Tier 4 (Real-World Scenarios)**: 5 complex multi-step admin/user workflows.
4. **Teardown**: Programmatically stops the server.
5. **Reporting**: Outputs a console test execution report and exits with `0` (success) or `1` (failure).

---

## 4. How to Run the Tests

To run the E2E test suite locally using the stateful mock server:

### 4.1 Prerequisites
Make sure dependencies are installed inside the project root:
```bash
npm install
```

### 4.2 Run command
From the project root directory, run the E2E test runner via the npm script:
```bash
npm run test:e2e
```

Or run directly via `npx tsx`:
```bash
npx tsx tests/e2e/run_tests.ts
```

### 4.3 Running against Production Backend (Optional)
To run the E2E tests against a live local server (running on port `3000` with actual database connectivity), set the target port env:
```bash
$env:MOCK_PORT="3000"
npm run test:e2e
```
*(Ensure a seed super admin user `superadmin@tradevault.in` and password `admin123` exist in the database before running).*
