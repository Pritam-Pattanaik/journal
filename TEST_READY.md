# E2E Test Suite Readiness Report (`TEST_READY.md`)

This document summarizes the coverage of exactly **82 test cases** across **4 tiers** designed and implemented to validate the TradeVault Super Admin Dashboard REST API.

---

## 1. Test Suite Coverage Summary

| Tier | Focus | Test Count | Status |
|---|---|---|---|
| **Tier 1** | Feature Coverage (Happy Path) | 35 | **PASSED** |
| **Tier 2** | Boundary, Corner, & Error Validation | 35 | **PASSED** |
| **Tier 3** | Cross-Feature Interactions | 7 | **PASSED** |
| **Tier 4** | Real-World Scenario Workflows | 5 | **PASSED** |
| **Total** | **All Tiers** | **82** | **PASSED** |

---

## 2. Test Catalog

### Tier 1: Feature Coverage (35 Cases)
Verifies positive path functionality for all 7 Super Admin capability domains.

#### Overview Domain
- **TC-T1-OV-01**: Fetch overview stats with range 7d (`GET /api/admin/overview?range=7d`)
- **TC-T1-OV-02**: Fetch overview stats with range 30d (`GET /api/admin/overview?range=30d`)
- **TC-T1-OV-03**: Fetch overview stats with range 90d (`GET /api/admin/overview?range=90d`)
- **TC-T1-OV-04**: Fetch overview stats without range parameter (defaults to 7d)
- **TC-T1-OV-05**: Validate recent activity feed structure and contents

#### Users Domain
- **TC-T1-US-01**: Fetch user list with default pagination (`GET /api/admin/users`)
- **TC-T1-US-02**: Fetch detailed user profile for a valid user ID (`GET /api/admin/users/:id`)
- **TC-T1-US-03**: Update user role to ADMIN (`PATCH /api/admin/users/:id/role`)
- **TC-T1-US-04**: Suspend user account (`PATCH /api/admin/users/:id/status`)
- **TC-T1-US-05**: Delete user account (`DELETE /api/admin/users/:id`)

#### Trades Domain
- **TC-T1-TR-01**: Fetch trades list with default pagination (`GET /api/admin/trades`)
- **TC-T1-TR-02**: Filter trades list by user ID (`GET /api/admin/trades?user=:id`)
- **TC-T1-TR-03**: Filter trades list by date range (`GET /api/admin/trades?startDate=...&endDate=...`)
- **TC-T1-TR-04**: Filter trades list by market, type, and symbol
- **TC-T1-TR-05**: Filter trades list by PnL range (`pnlMin` & `pnlMax`)

#### Brokers Domain
- **TC-T1-BR-01**: Fetch all broker connections and aggregate stats (`GET /api/admin/brokers`)
- **TC-T1-BR-02**: Trigger manual sync for a connection (`POST /api/admin/brokers/:id/sync`)
- **TC-T1-BR-03**: Retrieve connection sync logs (`GET /api/admin/brokers/:id/logs`)
- **TC-T1-BR-04**: Trigger sync on AngelOne connection specifically
- **TC-T1-BR-05**: Validate broker connection object schema structure

#### AI Coach Domain
- **TC-T1-AI-01**: Fetch AI Coach monitoring statistics (`GET /api/admin/ai`)
- **TC-T1-AI-02**: Verify `insightsPerUser` structure and counts mapping
- **TC-T1-AI-03**: Verify `recentAnalysisRuns` list and details
- **TC-T1-AI-04**: Verify `insightTypeBreakdown` groupings
- **TC-T1-AI-05**: Verify `usageTimeline` chronology

#### Audit Logs Domain
- **TC-T1-AU-01**: Fetch audit logs list with default params (`GET /api/admin/audit`)
- **TC-T1-AU-02**: Filter audit logs by action type (`action=ROLE_CHANGE`)
- **TC-T1-AU-03**: Filter audit logs by search term (`search=superadmin`)
- **TC-T1-AU-04**: Filter audit logs by date range (`startDate` & `endDate`)
- **TC-T1-AU-05**: Fetch audit logs with specific limit and page pagination

#### Settings Domain
- **TC-T1-SE-01**: Fetch global system settings (`GET /api/admin/settings`)
- **TC-T1-SE-02**: Update setting `enable_ai_coach` to false (`POST /api/admin/settings`)
- **TC-T1-SE-03**: Update setting `enable_broker_sync` to false
- **TC-T1-SE-04**: Update setting `maintenance_mode` to true
- **TC-T1-SE-05**: Update `system_announcement` text setting

---

### Tier 2: Boundary & Corner (35 Cases)
Validates system behavior under invalid inputs, authorization boundaries, empty states, and concurrency.

#### Overview Domain
- **TC-T2-OV-01**: Fetch overview stats with invalid range parameter (e.g., `range=365d`)
- **TC-T2-OV-02**: Fetch overview stats without Auth Token
- **TC-T2-OV-03**: Fetch overview stats with standard USER token (RBAC boundary)
- **TC-T2-OV-04**: Fetch overview stats with malformed JWT token string
- **TC-T2-OV-05**: Fetch overview stats with an empty database state

#### Users Domain
- **TC-T2-US-01**: Fetch users with negative page or non-numeric limit
- **TC-T2-US-02**: Fetch detailed profile for non-existent user ID
- **TC-T2-US-03**: Update user role with invalid role string
- **TC-T2-US-04**: Prevent demoting currently logged-in Super Admin (self-lockout corner case)
- **TC-T2-US-05**: Delete non-existent user ID

#### Trades Domain
- **TC-T2-TR-01**: Filter trades with invalid PnL range where `pnlMin > pnlMax`
- **TC-T2-TR-02**: Filter trades with malformed date format parameters
- **TC-T2-TR-03**: Fetch trades list with standard USER token (RBAC boundary)
- **TC-T2-TR-04**: Fetch trades list without Auth token
- **TC-T2-TR-05**: Filter trades yielding zero results (verify empty array response)

#### Brokers Domain
- **TC-T2-BR-01**: Trigger manual sync for non-existent connection ID
- **TC-T2-BR-02**: Retrieve sync logs for non-existent connection ID
- **TC-T2-BR-03**: Trigger sync when broker connection config lacks `apiKey`
- **TC-T2-BR-04**: Trigger sync when connection `isActive` is false
- **TC-T2-BR-05**: Trigger concurrent sync requests on same connection (sync locking validation)

#### AI Coach Domain
- **TC-T2-AI-01**: Fetch AI stats without Auth token
- **TC-T2-AI-02**: Fetch AI stats with standard USER token (RBAC boundary)
- **TC-T2-AI-03**: Fetch AI stats with empty database (total counts are 0)
- **TC-T2-AI-04**: Gracefully handle AI insights with null types
- **TC-T2-AI-05**: Verify AI stats query under high concurrent query load

#### Audit Logs Domain
- **TC-T2-AU-01**: Filter audit logs with inverse date filter `startDate > endDate`
- **TC-T2-AU-02**: Fetch audit logs without Auth token
- **TC-T2-AU-03**: Fetch audit logs with standard USER token (RBAC boundary)
- **TC-T2-AU-04**: Verify search handles XSS inputs safely without executing
- **TC-T2-AU-05**: Fetch out-of-bound page number (returns empty list)

#### Settings Domain
- **TC-T2-SE-01**: Update settings with missing `value` field
- **TC-T2-SE-02**: Update setting with invalid key name
- **TC-T2-SE-03**: Fetch settings with standard USER token (RBAC boundary)
- **TC-T2-SE-04**: Update setting with standard USER token (RBAC boundary)
- **TC-T2-SE-05**: Update announcement setting exceeding max length boundary (>2000 chars)

---

### Tier 3: Cross-Feature (7 Cases)
Validates side-effects and integrations between separate dashboard domains.

- **TC-T3-CF-01**: Disabling AI Coach flag in settings blocks user trade analysis requests.
- **TC-T3-CF-02**: Disabling broker sync flag in settings blocks admin manual syncs.
- **TC-T3-CF-03**: Suspending a user account prevents admin broker connection syncs.
- **TC-T3-CF-04**: Changing a user role creates a corresponding `ROLE_CHANGE` event in the audit log.
- **TC-T3-CF-05**: Deleting a user decrements the `totalUsers` count in system overview.
- **TC-T3-CF-06**: Posting a user trade increments trade count and net PnL in system overview.
- **TC-T3-CF-07**: Generating an AI insight increments the `aiInsightsCount` in system overview.

---

### Tier 4: Real-World Scenarios (5 Cases)
Validates end-to-end multi-step flows representing complex admin workflows.

- **TC-T4-RW-01: User Suspension & Access Enforcement Flow**
  - Admin views overview and lists users.
  - Admin suspends target user account.
  - Verification that audit log records status change.
  - User tries to fetch trades or sync and gets blocked (`403 Forbidden`).
  - Admin reactivates the user.
  - User successfully fetches trades and logs in.

- **TC-T4-RW-02: Settings Update & Maintenance Mode Lockout Flow**
  - Admin updates announcement and toggles `maintenance_mode` to `"true"`.
  - User attempts to fetch trades and receives `503 Service Unavailable`.
  - Admin logs in (bypassing maintenance) and disables `maintenance_mode`.
  - User accesses system successfully and retrieves data.

- **TC-T4-RW-03: Broker Token Expiry & Sync Override Lifecycle**
  - Admin views broker connections and identifies a sync error.
  - Admin triggers sync, failing with `400 Bad Request` due to empty key (token expired).
  - User updates token via patch endpoint.
  - Admin retries manual sync; sync succeeds and simulated trades are imported.

- **TC-T4-RW-04: User Deletion Cascading & Audit Trails**
  - Admin creates temporary user, posts trade, and adds broker connection.
  - Admin executes deletion of user.
  - Verification of cascade deletes: trades and connections are purged from memory.
  - Verification that audit log records `USER_DELETE` with user details.

- **TC-T4-RW-05: Admin Promotion, Authorization, and Demotion Lifecycle**
  - Super Admin promotes standard user to `SUPER_ADMIN`.
  - Promoted user logs in, obtains administrative JWT, and updates settings.
  - Super Admin demotes user back to `USER`.
  - Demoted user is blocked with `403 Forbidden` on settings edits.
