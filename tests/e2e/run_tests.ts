import { app, seedData, users, trades, brokerConnections, aiInsights } from './mock_server';
import http from 'http';

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}/api`;

let server: http.Server;
let superAdminToken = '';
let userToken = '';
const testResults: { id: string; tier: string; feature: string; description: string; passed: boolean; error?: string }[] = [];

// Helper to run mock server
function startServer(): Promise<void> {
  return new Promise((resolve) => {
    server = app.listen(PORT, async () => {
      console.log(`[Test Runner] Started mock server on port ${PORT}`);
      await seedData();
      resolve();
    });
  });
}

function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log(`[Test Runner] Stopped mock server`);
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Helper to log results
function recordResult(id: string, tier: string, feature: string, description: string, passed: boolean, error?: string) {
  testResults.push({ id, tier, feature, description, passed, error });
  if (passed) {
    console.log(` ✅ ${id} [${tier}] [${feature}] - PASS: ${description}`);
  } else {
    console.error(` ❌ ${id} [${tier}] [${feature}] - FAIL: ${description}. Error: ${error}`);
  }
}

// Main testing logic
async function runAllTests() {
  console.log('\n==================================================');
  console.log('🏁 Starting E2E Test Suite Run (82 Test Cases)');
  console.log('==================================================\n');

  await startServer();

  try {
    // Acquire tokens first
    await acquireTokens();

    // Run Tiers
    await runTier1FeatureCoverage();
    await runTier2BoundaryAndCorner();
    await runTier3CrossFeature();
    await runTier4RealWorldScenarios();

  } catch (err: any) {
    console.error('Fatal test runner error:', err);
  } finally {
    await stopServer();
    printSummary();
  }
}

async function acquireTokens() {
  console.log('🔑 Authenticating and acquiring tokens...');
  
  // Super Admin login
  const saRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@tradevault.in', password: 'admin123' })
  });
  const saJson: any = await saRes.json();
  superAdminToken = saJson.token;

  // Normal User login
  const uRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@tradevault.in', password: 'user123' })
  });
  const uJson: any = await uRes.json();
  userToken = uJson.token;

  console.log('🔑 Tokens acquired successfully!\n');
}

function printSummary() {
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = total - passed;

  console.log('\n==================================================');
  console.log('📊 TEST SUMMARY REPORT');
  console.log('==================================================');
  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:         ${passed} ( ${((passed/total)*100).toFixed(1)}% )`);
  console.log(`Failed:         ${failed}`);
  console.log('==================================================');

  if (failed > 0) {
    console.error('\n🚨 SOME TESTS FAILED!');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 82 TEST CASES PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// TIER 1: FEATURE COVERAGE (35 CASES)
// ──────────────────────────────────────────────────────────────────────────────
async function runTier1FeatureCoverage() {
  console.log('\n--- 📌 Running Tier 1: Feature Coverage (35 cases) ---');

  // === FEATURE 1: OVERVIEW ===
  // TC-T1-OV-01
  try {
    const res = await fetch(`${BASE_URL}/admin/overview?range=7d`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.totalUsers !== undefined && data.netPnl !== undefined && data.recentActivity.length > 0;
    recordResult('TC-T1-OV-01', 'Tier 1', 'Overview', 'Fetch overview stats with range 7d', ok);
  } catch (e: any) { recordResult('TC-T1-OV-01', 'Tier 1', 'Overview', 'Fetch overview stats with range 7d', false, e.message); }

  // TC-T1-OV-02
  try {
    const res = await fetch(`${BASE_URL}/admin/overview?range=30d`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 200;
    recordResult('TC-T1-OV-02', 'Tier 1', 'Overview', 'Fetch overview stats with range 30d', ok);
  } catch (e: any) { recordResult('TC-T1-OV-02', 'Tier 1', 'Overview', 'Fetch overview stats with range 30d', false, e.message); }

  // TC-T1-OV-03
  try {
    const res = await fetch(`${BASE_URL}/admin/overview?range=90d`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 200;
    recordResult('TC-T1-OV-03', 'Tier 1', 'Overview', 'Fetch overview stats with range 90d', ok);
  } catch (e: any) { recordResult('TC-T1-OV-03', 'Tier 1', 'Overview', 'Fetch overview stats with range 90d', false, e.message); }

  // TC-T1-OV-04
  try {
    const res = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.totalTrades !== undefined;
    recordResult('TC-T1-OV-04', 'Tier 1', 'Overview', 'Fetch overview stats without range (default 7d)', ok);
  } catch (e: any) { recordResult('TC-T1-OV-04', 'Tier 1', 'Overview', 'Fetch overview stats without range (default 7d)', false, e.message); }

  // TC-T1-OV-05
  try {
    const res = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.recentActivity) && data.recentActivity[0].type !== undefined;
    recordResult('TC-T1-OV-05', 'Tier 1', 'Overview', 'Validate recent activity feed structure', ok);
  } catch (e: any) { recordResult('TC-T1-OV-05', 'Tier 1', 'Overview', 'Validate recent activity feed structure', false, e.message); }


  // === FEATURE 2: USERS ===
  // TC-T1-US-01
  try {
    const res = await fetch(`${BASE_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.users) && data.total !== undefined;
    recordResult('TC-T1-US-01', 'Tier 1', 'Users', 'Fetch user list with default pagination', ok);
  } catch (e: any) { recordResult('TC-T1-US-01', 'Tier 1', 'Users', 'Fetch user list with default pagination', false, e.message); }

  // TC-T1-US-02
  try {
    const normalUserId = users.find(u => u.role === 'USER' && !u.isSuspended)?.id || '';
    const res = await fetch(`${BASE_URL}/admin/users/${normalUserId}`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.email === 'user@tradevault.in' && Array.isArray(data.trades);
    recordResult('TC-T1-US-02', 'Tier 1', 'Users', 'Fetch detailed user profile', ok);
  } catch (e: any) { recordResult('TC-T1-US-02', 'Tier 1', 'Users', 'Fetch detailed user profile', false, e.message); }

  // TC-T1-US-03
  try {
    const userToPromote = users.find(u => u.email === 'suspended@tradevault.in')?.id || '';
    const res = await fetch(`${BASE_URL}/admin/users/${userToPromote}/role`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' })
    });
    const data: any = await res.json();
    const ok = res.status === 200 && data.success === true && data.user.role === 'ADMIN';
    recordResult('TC-T1-US-03', 'Tier 1', 'Users', 'Update user role to ADMIN', ok);
  } catch (e: any) { recordResult('TC-T1-US-03', 'Tier 1', 'Users', 'Update user role to ADMIN', false, e.message); }

  // TC-T1-US-04
  try {
    const userToSuspend = users.find(u => u.email === 'user@tradevault.in')?.id || '';
    const res = await fetch(`${BASE_URL}/admin/users/${userToSuspend}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: true })
    });
    const data: any = await res.json();
    const ok = res.status === 200 && data.success === true && data.user.isSuspended === true;
    recordResult('TC-T1-US-04', 'Tier 1', 'Users', 'Suspend a user account', ok);
  } catch (e: any) { recordResult('TC-T1-US-04', 'Tier 1', 'Users', 'Suspend a user account', false, e.message); }

  // TC-T1-US-05
  try {
    // Create temporary user to delete
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'delete-me@tradevault.in', password: 'password123', fullName: 'Delete Me' })
    });
    const signupJson: any = await signupRes.json();
    const tempId = signupJson.user.id;

    const delRes = await fetch(`${BASE_URL}/admin/users/${tempId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const delJson: any = await delRes.json();
    const ok = delRes.status === 200 && delJson.success === true;
    recordResult('TC-T1-US-05', 'Tier 1', 'Users', 'Delete a user account', ok);
  } catch (e: any) { recordResult('TC-T1-US-05', 'Tier 1', 'Users', 'Delete a user account', false, e.message); }


  // === FEATURE 3: TRADES ===
  // TC-T1-TR-01
  try {
    const res = await fetch(`${BASE_URL}/admin/trades`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.trades) && data.stats !== undefined;
    recordResult('TC-T1-TR-01', 'Tier 1', 'Trades', 'Fetch trades list with default pagination', ok);
  } catch (e: any) { recordResult('TC-T1-TR-01', 'Tier 1', 'Trades', 'Fetch trades list with default pagination', false, e.message); }

  // TC-T1-TR-02
  try {
    const userId = users.find(u => u.email === 'user@tradevault.in')?.id || '';
    const res = await fetch(`${BASE_URL}/admin/trades?user=${userId}`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.trades.every((t: any) => t.userId === userId);
    recordResult('TC-T1-TR-02', 'Tier 1', 'Trades', 'Filter trades by user ID', ok);
  } catch (e: any) { recordResult('TC-T1-TR-02', 'Tier 1', 'Trades', 'Filter trades by user ID', false, e.message); }

  // TC-T1-TR-03
  try {
    const res = await fetch(`${BASE_URL}/admin/trades?startDate=2026-07-01&endDate=2026-07-20`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.trades.length > 0;
    recordResult('TC-T1-TR-03', 'Tier 1', 'Trades', 'Filter trades by date range', ok);
  } catch (e: any) { recordResult('TC-T1-TR-03', 'Tier 1', 'Trades', 'Filter trades by date range', false, e.message); }

  // TC-T1-TR-04
  try {
    const res = await fetch(`${BASE_URL}/admin/trades?market=NSE&instrumentType=EQ&symbol=SBIN`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.trades.every((t: any) => t.symbol === 'SBIN' && t.market === 'NSE');
    recordResult('TC-T1-TR-04', 'Tier 1', 'Trades', 'Filter trades by market, type, and symbol', ok);
  } catch (e: any) { recordResult('TC-T1-TR-04', 'Tier 1', 'Trades', 'Filter trades by market, type, and symbol', false, e.message); }

  // TC-T1-TR-05
  try {
    const res = await fetch(`${BASE_URL}/admin/trades?pnlMin=100&pnlMax=2000`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.trades.every((t: any) => t.netPnl >= 100 && t.netPnl <= 2000);
    recordResult('TC-T1-TR-05', 'Tier 1', 'Trades', 'Filter trades by PnL range', ok);
  } catch (e: any) { recordResult('TC-T1-TR-05', 'Tier 1', 'Trades', 'Filter trades by PnL range', false, e.message); }


  // === FEATURE 4: BROKERS ===
  // TC-T1-BR-01
  try {
    const res = await fetch(`${BASE_URL}/admin/brokers`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.connections) && data.stats !== undefined;
    recordResult('TC-T1-BR-01', 'Tier 1', 'Brokers', 'Fetch all broker connections and stats', ok);
  } catch (e: any) { recordResult('TC-T1-BR-01', 'Tier 1', 'Brokers', 'Fetch all broker connections and stats', false, e.message); }

  // TC-T1-BR-02
  try {
    // Unsuspend user first to allow sync
    const uid = users.find(u => u.email === 'user@tradevault.in')?.id || '';
    await fetch(`${BASE_URL}/admin/users/${uid}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: false })
    });

    const connId = brokerConnections.find(bc => bc.broker === 'dhan')?.id || '';
    const res = await fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const data: any = await res.json();
    const ok = res.status === 200 && data.success === true && data.syncedCount === 1;
    recordResult('TC-T1-BR-02', 'Tier 1', 'Brokers', 'Trigger manual sync for connection', ok);
  } catch (e: any) { recordResult('TC-T1-BR-02', 'Tier 1', 'Brokers', 'Trigger manual sync for connection', false, e.message); }

  // TC-T1-BR-03
  try {
    const connId = brokerConnections[0].id;
    const res = await fetch(`${BASE_URL}/admin/brokers/${connId}/logs`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data) && data[0].event !== undefined;
    recordResult('TC-T1-BR-03', 'Tier 1', 'Brokers', 'Retrieve connection sync logs', ok);
  } catch (e: any) { recordResult('TC-T1-BR-03', 'Tier 1', 'Brokers', 'Retrieve connection sync logs', false, e.message); }

  // TC-T1-BR-04
  try {
    const connId = brokerConnections.find(bc => bc.broker === 'angelone')?.id || '';
    const res = await fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const _data: any = await res.json();
    // Suspended owner of connection 2 will block sync in mock, so unsupend owner first
    const ownerId = brokerConnections.find(bc => bc.broker === 'angelone')?.userId || '';
    await fetch(`${BASE_URL}/admin/users/${ownerId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: false })
    });

    const retryRes = await fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const retryData: any = await retryRes.json();
    const ok = retryRes.status === 200 && retryData.success === true;
    recordResult('TC-T1-BR-04', 'Tier 1', 'Brokers', 'Trigger sync on AngelOne connection', ok);
  } catch (e: any) { recordResult('TC-T1-BR-04', 'Tier 1', 'Brokers', 'Trigger sync on AngelOne connection', false, e.message); }

  // TC-T1-BR-05
  try {
    const res = await fetch(`${BASE_URL}/admin/brokers`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const conn = data.connections[0];
    const ok = res.status === 200 && conn.id !== undefined && conn.userEmail !== undefined && conn.isActive !== undefined;
    recordResult('TC-T1-BR-05', 'Tier 1', 'Brokers', 'Validate broker connection object structure', ok);
  } catch (e: any) { recordResult('TC-T1-BR-05', 'Tier 1', 'Brokers', 'Validate broker connection object structure', false, e.message); }


  // === FEATURE 5: AI COACH ===
  // TC-T1-AI-01
  try {
    const res = await fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.totalInsights !== undefined && Array.isArray(data.recentAnalysisRuns);
    recordResult('TC-T1-AI-01', 'Tier 1', 'AI Coach', 'Fetch AI Coach monitoring statistics', ok);
  } catch (e: any) { recordResult('TC-T1-AI-01', 'Tier 1', 'AI Coach', 'Fetch AI Coach monitoring statistics', false, e.message); }

  // TC-T1-AI-02
  try {
    const res = await fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.insightsPerUser) && data.insightsPerUser[0].userEmail !== undefined;
    recordResult('TC-T1-AI-02', 'Tier 1', 'AI Coach', 'Verify insightsPerUser structure', ok);
  } catch (e: any) { recordResult('TC-T1-AI-02', 'Tier 1', 'AI Coach', 'Verify insightsPerUser structure', false, e.message); }

  // TC-T1-AI-03
  try {
    const res = await fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.recentAnalysisRuns) && data.recentAnalysisRuns[0].userEmail !== undefined;
    recordResult('TC-T1-AI-03', 'Tier 1', 'AI Coach', 'Verify recentAnalysisRuns list', ok);
  } catch (e: any) { recordResult('TC-T1-AI-03', 'Tier 1', 'AI Coach', 'Verify recentAnalysisRuns list', false, e.message); }

  // TC-T1-AI-04
  try {
    const res = await fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.insightTypeBreakdown) && data.insightTypeBreakdown[0].type !== undefined;
    recordResult('TC-T1-AI-04', 'Tier 1', 'AI Coach', 'Verify insightTypeBreakdown groupings', ok);
  } catch (e: any) { recordResult('TC-T1-AI-04', 'Tier 1', 'AI Coach', 'Verify insightTypeBreakdown groupings', false, e.message); }

  // TC-T1-AI-05
  try {
    const res = await fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.usageTimeline) && data.usageTimeline[0].date !== undefined;
    recordResult('TC-T1-AI-05', 'Tier 1', 'AI Coach', 'Verify usageTimeline chronology', ok);
  } catch (e: any) { recordResult('TC-T1-AI-05', 'Tier 1', 'AI Coach', 'Verify usageTimeline chronology', false, e.message); }


  // === FEATURE 6: AUDIT LOGS ===
  // TC-T1-AU-01
  try {
    const res = await fetch(`${BASE_URL}/admin/audit`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.logs) && data.total !== undefined;
    recordResult('TC-T1-AU-01', 'Tier 1', 'Audit Logs', 'Fetch audit logs list with default params', ok);
  } catch (e: any) { recordResult('TC-T1-AU-01', 'Tier 1', 'Audit Logs', 'Fetch audit logs list with default params', false, e.message); }

  // TC-T1-AU-02
  try {
    const res = await fetch(`${BASE_URL}/admin/audit?action=ROLE_CHANGE`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.logs.every((l: any) => l.action === 'ROLE_CHANGE');
    recordResult('TC-T1-AU-02', 'Tier 1', 'Audit Logs', 'Filter audit logs by action type', ok);
  } catch (e: any) { recordResult('TC-T1-AU-02', 'Tier 1', 'Audit Logs', 'Filter audit logs by action type', false, e.message); }

  // TC-T1-AU-03
  try {
    const res = await fetch(`${BASE_URL}/admin/audit?search=superadmin`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.logs.every((l: any) => l.adminEmail.includes('superadmin') || l.details.includes('superadmin'));
    recordResult('TC-T1-AU-03', 'Tier 1', 'Audit Logs', 'Filter audit logs by search term', ok);
  } catch (e: any) { recordResult('TC-T1-AU-03', 'Tier 1', 'Audit Logs', 'Filter audit logs by search term', false, e.message); }

  // TC-T1-AU-04
  try {
    const res = await fetch(`${BASE_URL}/admin/audit?startDate=2026-07-01&endDate=2026-07-20`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.logs.length > 0;
    recordResult('TC-T1-AU-04', 'Tier 1', 'Audit Logs', 'Filter audit logs by date range', ok);
  } catch (e: any) { recordResult('TC-T1-AU-04', 'Tier 1', 'Audit Logs', 'Filter audit logs by date range', false, e.message); }

  // TC-T1-AU-05
  try {
    const res = await fetch(`${BASE_URL}/admin/audit?page=1&limit=2`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.logs.length <= 2 && data.pages !== undefined;
    recordResult('TC-T1-AU-05', 'Tier 1', 'Audit Logs', 'Fetch audit logs with specific limit and page', ok);
  } catch (e: any) { recordResult('TC-T1-AU-05', 'Tier 1', 'Audit Logs', 'Fetch audit logs with specific limit and page', false, e.message); }


  // === FEATURE 7: SETTINGS ===
  // TC-T1-SE-01
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && Array.isArray(data.settings);
    recordResult('TC-T1-SE-01', 'Tier 1', 'Settings', 'Fetch system settings', ok);
  } catch (e: any) { recordResult('TC-T1-SE-01', 'Tier 1', 'Settings', 'Fetch system settings', false, e.message); }

  // TC-T1-SE-02
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach', value: 'false' })
    });
    const data: any = await res.json();
    const ok = res.status === 200 && data.success === true;
    recordResult('TC-T1-SE-02', 'Tier 1', 'Settings', 'Update setting enable_ai_coach to false', ok);
  } catch (e: any) { recordResult('TC-T1-SE-02', 'Tier 1', 'Settings', 'Update setting enable_ai_coach to false', false, e.message); }

  // TC-T1-SE-03
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_broker_sync', value: 'false' })
    });
    const ok = res.status === 200;
    recordResult('TC-T1-SE-03', 'Tier 1', 'Settings', 'Update setting enable_broker_sync to false', ok);
  } catch (e: any) { recordResult('TC-T1-SE-03', 'Tier 1', 'Settings', 'Update setting enable_broker_sync to false', false, e.message); }

  // TC-T1-SE-04
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'maintenance_mode', value: 'true' })
    });
    const ok = res.status === 200;
    recordResult('TC-T1-SE-04', 'Tier 1', 'Settings', 'Update setting maintenance_mode to true', ok);
  } catch (e: any) { recordResult('TC-T1-SE-04', 'Tier 1', 'Settings', 'Update setting maintenance_mode to true', false, e.message); }

  // TC-T1-SE-05
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'system_announcement', value: 'System Upgrade Scheduled' })
    });
    const ok = res.status === 200;
    recordResult('TC-T1-SE-05', 'Tier 1', 'Settings', 'Update system_announcement', ok);
  } catch (e: any) { recordResult('TC-T1-SE-05', 'Tier 1', 'Settings', 'Update system_announcement', false, e.message); }
}

// ──────────────────────────────────────────────────────────────────────────────
// TIER 2: BOUNDARY & CORNER (35 CASES)
// ──────────────────────────────────────────────────────────────────────────────
async function runTier2BoundaryAndCorner() {
  console.log('\n--- 📌 Running Tier 2: Boundary & Corner (35 cases) ---');

  // Restore settings to default values for further testing
  await fetch(`${BASE_URL}/admin/settings`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'maintenance_mode', value: 'false' })
  });
  await fetch(`${BASE_URL}/admin/settings`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'enable_ai_coach', value: 'true' })
  });
  await fetch(`${BASE_URL}/admin/settings`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'enable_broker_sync', value: 'true' })
  });

  // === FEATURE 1: OVERVIEW ===
  // TC-T2-OV-01
  try {
    const res = await fetch(`${BASE_URL}/admin/overview?range=365d`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 400;
    recordResult('TC-T2-OV-01', 'Tier 2', 'Overview', 'Fetch overview stats with invalid range range=365d', ok);
  } catch (e: any) { recordResult('TC-T2-OV-01', 'Tier 2', 'Overview', 'Fetch overview stats with invalid range range=365d', false, e.message); }

  // TC-T2-OV-02
  try {
    const res = await fetch(`${BASE_URL}/admin/overview`);
    const ok = res.status === 401;
    recordResult('TC-T2-OV-02', 'Tier 2', 'Overview', 'Fetch overview stats without Auth Token', ok);
  } catch (e: any) { recordResult('TC-T2-OV-02', 'Tier 2', 'Overview', 'Fetch overview stats without Auth Token', false, e.message); }

  // TC-T2-OV-03
  try {
    const res = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const ok = res.status === 403;
    recordResult('TC-T2-OV-03', 'Tier 2', 'Overview', 'Fetch overview stats with USER token (RBAC boundary)', ok);
  } catch (e: any) { recordResult('TC-T2-OV-03', 'Tier 2', 'Overview', 'Fetch overview stats with USER token (RBAC boundary)', false, e.message); }

  // TC-T2-OV-04
  try {
    const res = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': 'Bearer invalid_jwt_string' } });
    const ok = res.status === 401;
    recordResult('TC-T2-OV-04', 'Tier 2', 'Overview', 'Fetch overview stats with malformed JWT token', ok);
  } catch (e: any) { recordResult('TC-T2-OV-04', 'Tier 2', 'Overview', 'Fetch overview stats with malformed JWT token', false, e.message); }

  // TC-T2-OV-05
  try {
    // Back up original state
    const originalTrades = [...trades];
    const originalUsers = [...users];
    // Empty state
    trades.splice(0, trades.length);
    users.splice(0, users.length);
    // Add temp admin to users so we can call the endpoint
    const tempAdmin: any = originalUsers.find(u => u.role === 'SUPER_ADMIN');
    users.push(tempAdmin);

    const res = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.totalTrades === 0 && data.netPnl === 0;

    // Restore state
    trades.push(...originalTrades);
    users.splice(0, users.length);
    users.push(...originalUsers);

    recordResult('TC-T2-OV-05', 'Tier 2', 'Overview', 'Fetch overview stats with empty database', ok);
  } catch (e: any) { recordResult('TC-T2-OV-05', 'Tier 2', 'Overview', 'Fetch overview stats with empty database', false, e.message); }


  // === FEATURE 2: USERS ===
  // TC-T2-US-01
  try {
    const res = await fetch(`${BASE_URL}/admin/users?page=-1&limit=abc`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 400;
    recordResult('TC-T2-US-01', 'Tier 2', 'Users', 'Fetch users with negative page or non-numeric limit', ok);
  } catch (e: any) { recordResult('TC-T2-US-01', 'Tier 2', 'Users', 'Fetch users with negative page or non-numeric limit', false, e.message); }

  // TC-T2-US-02
  try {
    const res = await fetch(`${BASE_URL}/admin/users/non-existent-uuid`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 404;
    recordResult('TC-T2-US-02', 'Tier 2', 'Users', 'Fetch detailed profile for non-existent user ID', ok);
  } catch (e: any) { recordResult('TC-T2-US-02', 'Tier 2', 'Users', 'Fetch detailed profile for non-existent user ID', false, e.message); }

  // TC-T2-US-03
  try {
    const userId = users[1].id;
    const res = await fetch(`${BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'SUPER_USER' })
    });
    const ok = res.status === 400;
    recordResult('TC-T2-US-03', 'Tier 2', 'Users', 'Update user role with invalid role string', ok);
  } catch (e: any) { recordResult('TC-T2-US-03', 'Tier 2', 'Users', 'Update user role with invalid role string', false, e.message); }

  // TC-T2-US-04
  try {
    const adminId = users.find(u => u.role === 'SUPER_ADMIN')?.id || '';
    const res = await fetch(`${BASE_URL}/admin/users/${adminId}/role`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'USER' })
    });
    const ok = res.status === 400;
    recordResult('TC-T2-US-04', 'Tier 2', 'Users', 'Demoting currently logged-in Super Admin (self-lockout corner case)', ok);
  } catch (e: any) { recordResult('TC-T2-US-04', 'Tier 2', 'Users', 'Demoting currently logged-in Super Admin (self-lockout corner case)', false, e.message); }

  // TC-T2-US-05
  try {
    const res = await fetch(`${BASE_URL}/admin/users/non-existent-uuid`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const ok = res.status === 404;
    recordResult('TC-T2-US-05', 'Tier 2', 'Users', 'Delete non-existent user ID', ok);
  } catch (e: any) { recordResult('TC-T2-US-05', 'Tier 2', 'Users', 'Delete non-existent user ID', false, e.message); }


  // === FEATURE 3: TRADES ===
  // TC-T2-TR-01
  try {
    const res = await fetch(`${BASE_URL}/admin/trades?pnlMin=5000&pnlMax=1000`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 400;
    recordResult('TC-T2-TR-01', 'Tier 2', 'Trades', 'Filter trades with invalid pnlMin > pnlMax', ok);
  } catch (e: any) { recordResult('TC-T2-TR-01', 'Tier 2', 'Trades', 'Filter trades with invalid pnlMin > pnlMax', false, e.message); }

  // TC-T2-TR-02
  try {
    const res = await fetch(`${BASE_URL}/admin/trades?startDate=invalid-date-string`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 400;
    recordResult('TC-T2-TR-02', 'Tier 2', 'Trades', 'Filter trades with malformed startDate parameter', ok);
  } catch (e: any) { recordResult('TC-T2-TR-02', 'Tier 2', 'Trades', 'Filter trades with malformed startDate parameter', false, e.message); }

  // TC-T2-TR-03
  try {
    const res = await fetch(`${BASE_URL}/admin/trades`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const ok = res.status === 403;
    recordResult('TC-T2-TR-03', 'Tier 2', 'Trades', 'Fetch trades list with USER token (RBAC boundary)', ok);
  } catch (e: any) { recordResult('TC-T2-TR-03', 'Tier 2', 'Trades', 'Fetch trades list with USER token (RBAC boundary)', false, e.message); }

  // TC-T2-TR-04
  try {
    const res = await fetch(`${BASE_URL}/admin/trades`);
    const ok = res.status === 401;
    recordResult('TC-T2-TR-04', 'Tier 2', 'Trades', 'Fetch trades list without Auth token', ok);
  } catch (e: any) { recordResult('TC-T2-TR-04', 'Tier 2', 'Trades', 'Fetch trades list without Auth token', false, e.message); }

  // TC-T2-TR-05
  try {
    const res = await fetch(`${BASE_URL}/admin/trades?symbol=NONEXISTENT_SYMBOL`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.trades.length === 0 && data.stats.totalTrades === 0;
    recordResult('TC-T2-TR-05', 'Tier 2', 'Trades', 'Filter trades yielding zero results', ok);
  } catch (e: any) { recordResult('TC-T2-TR-05', 'Tier 2', 'Trades', 'Filter trades yielding zero results', false, e.message); }


  // === FEATURE 4: BROKERS ===
  // TC-T2-BR-01
  try {
    const res = await fetch(`${BASE_URL}/admin/brokers/bc-nonexistent/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const ok = res.status === 404;
    recordResult('TC-T2-BR-01', 'Tier 2', 'Brokers', 'Trigger manual sync for non-existent connection ID', ok);
  } catch (e: any) { recordResult('TC-T2-BR-01', 'Tier 2', 'Brokers', 'Trigger manual sync for non-existent connection ID', false, e.message); }

  // TC-T2-BR-02
  try {
    const res = await fetch(`${BASE_URL}/admin/brokers/bc-nonexistent/logs`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 404;
    recordResult('TC-T2-BR-02', 'Tier 2', 'Brokers', 'Retrieve sync logs for non-existent connection ID', ok);
  } catch (e: any) { recordResult('TC-T2-BR-02', 'Tier 2', 'Brokers', 'Retrieve sync logs for non-existent connection ID', false, e.message); }

  // TC-T2-BR-03
  try {
    // Inject broker connection with missing key
    const conn: any = {
      id: 'bc-corrupt',
      userId: users[1].id,
      userEmail: users[1].email,
      broker: 'dhan',
      clientId: 'cli-1',
      apiKey: null, // missing apiKey
      isActive: true,
      lastSyncedAt: null,
      syncHealth: 'PENDING',
      createdAt: new Date().toISOString()
    };
    brokerConnections.push(conn);

    const res = await fetch(`${BASE_URL}/admin/brokers/bc-corrupt/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const ok = res.status === 400;
    
    // Clean up
    brokerConnections.splice(brokerConnections.findIndex(bc => bc.id === 'bc-corrupt'), 1);

    recordResult('TC-T2-BR-03', 'Tier 2', 'Brokers', 'Trigger sync when broker config lacks apiKey', ok);
  } catch (e: any) { recordResult('TC-T2-BR-03', 'Tier 2', 'Brokers', 'Trigger sync when broker config lacks apiKey', false, e.message); }

  // TC-T2-BR-04
  try {
    // Inject inactive broker connection
    const conn: any = {
      id: 'bc-inactive',
      userId: users[1].id,
      userEmail: users[1].email,
      broker: 'dhan',
      clientId: 'cli-1',
      apiKey: 'key',
      isActive: false, // inactive
      lastSyncedAt: null,
      syncHealth: 'PENDING',
      createdAt: new Date().toISOString()
    };
    brokerConnections.push(conn);

    const res = await fetch(`${BASE_URL}/admin/brokers/bc-inactive/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const ok = res.status === 400;

    // Clean up
    brokerConnections.splice(brokerConnections.findIndex(bc => bc.id === 'bc-inactive'), 1);

    recordResult('TC-T2-BR-04', 'Tier 2', 'Brokers', 'Trigger sync when connection isActive is false', ok);
  } catch (e: any) { recordResult('TC-T2-BR-04', 'Tier 2', 'Brokers', 'Trigger sync when connection isActive is false', false, e.message); }

  // TC-T2-BR-05
  try {
    const connId = brokerConnections[0].id;
    // Execute two concurrent sync fetches
    const [p1, p2] = await Promise.all([
      fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, { method: 'POST', headers: { 'Authorization': `Bearer ${superAdminToken}` } }),
      fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, { method: 'POST', headers: { 'Authorization': `Bearer ${superAdminToken}` } })
    ]);
    const d1: any = await p1.json();
    const d2: any = await p2.json();

    // One of them should have succeeded, or if fast sequential simulation is active, check one has alreadySyncing flag
    const ok = (d1.alreadySyncing === true || d2.alreadySyncing === true);
    recordResult('TC-T2-BR-05', 'Tier 2', 'Brokers', 'Trigger concurrent sync requests on same connection (sync locking)', ok);
  } catch (e: any) { recordResult('TC-T2-BR-05', 'Tier 2', 'Brokers', 'Trigger concurrent sync requests on same connection (sync locking)', false, e.message); }


  // === FEATURE 5: AI COACH ===
  // TC-T2-AI-01
  try {
    const res = await fetch(`${BASE_URL}/admin/ai`);
    const ok = res.status === 401;
    recordResult('TC-T2-AI-01', 'Tier 2', 'AI Coach', 'Fetch AI stats without Auth token', ok);
  } catch (e: any) { recordResult('TC-T2-AI-01', 'Tier 2', 'AI Coach', 'Fetch AI stats without Auth token', false, e.message); }

  // TC-T2-AI-02
  try {
    const res = await fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const ok = res.status === 403;
    recordResult('TC-T2-AI-02', 'Tier 2', 'AI Coach', 'Fetch AI stats with USER token (RBAC boundary)', ok);
  } catch (e: any) { recordResult('TC-T2-AI-02', 'Tier 2', 'AI Coach', 'Fetch AI stats with USER token (RBAC boundary)', false, e.message); }

  // TC-T2-AI-03
  try {
    // Back up AI insights
    const originalAI = [...aiInsights];
    aiInsights.splice(0, aiInsights.length);

    const res = await fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.totalInsights === 0 && data.insightsPerUser.length === 0;

    // Restore
    aiInsights.push(...originalAI);

    recordResult('TC-T2-AI-03', 'Tier 2', 'AI Coach', 'Fetch AI stats with empty database', ok);
  } catch (e: any) { recordResult('TC-T2-AI-03', 'Tier 2', 'AI Coach', 'Fetch AI stats with empty database', false, e.message); }

  // TC-T2-AI-04
  try {
    // Inject corrupt insight
    const badInsight: any = { id: 'ai-bad', userId: 'u-user-2222', userEmail: 'user@tradevault.in', content: 'hello', type: null };
    aiInsights.push(badInsight);

    const res = await fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.insightTypeBreakdown.some((b: any) => b.type === 'unknown');

    // Clean up
    aiInsights.splice(aiInsights.findIndex(ai => ai.id === 'ai-bad'), 1);

    recordResult('TC-T2-AI-04', 'Tier 2', 'AI Coach', 'Gracefully handle AI insights with null types', ok);
  } catch (e: any) { recordResult('TC-T2-AI-04', 'Tier 2', 'AI Coach', 'Gracefully handle AI insights with null types', false, e.message); }

  // TC-T2-AI-05
  try {
    // High-frequency queries
    const runs = Array.from({ length: 5 }, () => fetch(`${BASE_URL}/admin/ai`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } }));
    const results = await Promise.all(runs);
    const ok = results.every(res => res.status === 200);
    recordResult('TC-T2-AI-05', 'Tier 2', 'AI Coach', 'Verify AI stats query under concurrent load', ok);
  } catch (e: any) { recordResult('TC-T2-AI-05', 'Tier 2', 'AI Coach', 'Verify AI stats query under concurrent load', false, e.message); }


  // === FEATURE 6: AUDIT LOGS ===
  // TC-T2-AU-01
  try {
    const res = await fetch(`${BASE_URL}/admin/audit?startDate=2026-07-20&endDate=2026-07-01`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 400;
    recordResult('TC-T2-AU-01', 'Tier 2', 'Audit Logs', 'Filter audit logs with startDate > endDate', ok);
  } catch (e: any) { recordResult('TC-T2-AU-01', 'Tier 2', 'Audit Logs', 'Filter audit logs with startDate > endDate', false, e.message); }

  // TC-T2-AU-02
  try {
    const res = await fetch(`${BASE_URL}/admin/audit`);
    const ok = res.status === 401;
    recordResult('TC-T2-AU-02', 'Tier 2', 'Audit Logs', 'Fetch audit logs without Auth token', ok);
  } catch (e: any) { recordResult('TC-T2-AU-02', 'Tier 2', 'Audit Logs', 'Fetch audit logs without Auth token', false, e.message); }

  // TC-T2-AU-03
  try {
    const res = await fetch(`${BASE_URL}/admin/audit`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const ok = res.status === 403;
    recordResult('TC-T2-AU-03', 'Tier 2', 'Audit Logs', 'Fetch audit logs with USER token (RBAC boundary)', ok);
  } catch (e: any) { recordResult('TC-T2-AU-03', 'Tier 2', 'Audit Logs', 'Fetch audit logs with USER token (RBAC boundary)', false, e.message); }

  // TC-T2-AU-04
  try {
    const xssPayload = "<script>alert('xss')</script>";
    const res = await fetch(`${BASE_URL}/admin/audit?search=${encodeURIComponent(xssPayload)}`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const ok = res.status === 200; // should execute safely and return 200 with empty list
    recordResult('TC-T2-AU-04', 'Tier 2', 'Audit Logs', 'Verify search handles XSS inputs safely', ok);
  } catch (e: any) { recordResult('TC-T2-AU-04', 'Tier 2', 'Audit Logs', 'Verify search handles XSS inputs safely', false, e.message); }

  // TC-T2-AU-05
  try {
    const res = await fetch(`${BASE_URL}/admin/audit?page=99999`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const data: any = await res.json();
    const ok = res.status === 200 && data.logs.length === 0;
    recordResult('TC-T2-AU-05', 'Tier 2', 'Audit Logs', 'Fetch out of bound page number', ok);
  } catch (e: any) { recordResult('TC-T2-AU-05', 'Tier 2', 'Audit Logs', 'Fetch out of bound page number', false, e.message); }


  // === FEATURE 7: SYSTEM SETTINGS ===
  // TC-T2-SE-01
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach' }) // missing value
    });
    const ok = res.status === 400;
    recordResult('TC-T2-SE-01', 'Tier 2', 'Settings', 'Update settings with missing value field', ok);
  } catch (e: any) { recordResult('TC-T2-SE-01', 'Tier 2', 'Settings', 'Update settings with missing value field', false, e.message); }

  // TC-T2-SE-02
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'unknown_key_name', value: 'true' })
    });
    const ok = res.status === 400;
    recordResult('TC-T2-SE-02', 'Tier 2', 'Settings', 'Update setting with invalid key name', ok);
  } catch (e: any) { recordResult('TC-T2-SE-02', 'Tier 2', 'Settings', 'Update setting with invalid key name', false, e.message); }

  // TC-T2-SE-03
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const ok = res.status === 403;
    recordResult('TC-T2-SE-03', 'Tier 2', 'Settings', 'Fetch settings with USER token', ok);
  } catch (e: any) { recordResult('TC-T2-SE-03', 'Tier 2', 'Settings', 'Fetch settings with USER token', false, e.message); }

  // TC-T2-SE-04
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach', value: 'false' })
    });
    const ok = res.status === 403;
    recordResult('TC-T2-SE-04', 'Tier 2', 'Settings', 'Update setting with USER token', ok);
  } catch (e: any) { recordResult('TC-T2-SE-04', 'Tier 2', 'Settings', 'Update setting with USER token', false, e.message); }

  // TC-T2-SE-05
  try {
    const longString = 'a'.repeat(2005);
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'system_announcement', value: longString })
    });
    const ok = res.status === 400;
    recordResult('TC-T2-SE-05', 'Tier 2', 'Settings', 'Update announcement setting exceeding max length (>2000 chars)', ok);
  } catch (e: any) { recordResult('TC-T2-SE-05', 'Tier 2', 'Settings', 'Update announcement setting exceeding max length (>2000 chars)', false, e.message); }
}

// ──────────────────────────────────────────────────────────────────────────────
// TIER 3: CROSS-FEATURE (7 CASES)
// ──────────────────────────────────────────────────────────────────────────────
async function runTier3CrossFeature() {
  console.log('\n--- 📌 Running Tier 3: Cross-Feature (7 cases) ---');

  // TC-T3-CF-01: Settings & AI Coach
  try {
    // 1. Disable AI Coach in settings
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach', value: 'false' })
    });

    // 2. Try to analyze trades as a user
    const res = await fetch(`${BASE_URL}/insights/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const ok = res.status === 403; // should be blocked

    // Restore setting
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach', value: 'true' })
    });

    recordResult('TC-T3-CF-01', 'Tier 3', 'Cross-Feature', 'Settings & AI Coach: Disable AI Coach flag blocks analysis API', ok);
  } catch (e: any) { recordResult('TC-T3-CF-01', 'Tier 3', 'Cross-Feature', 'Settings & AI Coach: Disable AI Coach flag blocks analysis API', false, e.message); }

  // TC-T3-CF-02: Settings & Broker Sync
  try {
    // 1. Disable broker sync in settings
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_broker_sync', value: 'false' })
    });

    // 2. Try to trigger sync
    const connId = brokerConnections[0].id;
    const res = await fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const ok = res.status === 403; // should be blocked

    // Restore setting
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_broker_sync', value: 'true' })
    });

    recordResult('TC-T3-CF-02', 'Tier 3', 'Cross-Feature', 'Settings & Broker: Disable broker sync flag blocks manual sync', ok);
  } catch (e: any) { recordResult('TC-T3-CF-02', 'Tier 3', 'Cross-Feature', 'Settings & Broker: Disable broker sync flag blocks manual sync', false, e.message); }

  // TC-T3-CF-03: Users & Broker Connections & Trades
  try {
    // 1. Suspend the user
    const userId = users.find(u => u.email === 'user@tradevault.in')?.id || '';
    await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: true })
    });

    // 2. Attempt sync on their broker connection
    const connId = brokerConnections.find(bc => bc.userId === userId)?.id || '';
    const res = await fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const ok = res.status === 403; // block manual sync for suspended user accounts

    // Restore user status
    await fetch(`${BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: false })
    });

    recordResult('TC-T3-CF-03', 'Tier 3', 'Cross-Feature', 'Users & Brokers: Suspend user prevents broker connection syncs', ok);
  } catch (e: any) { recordResult('TC-T3-CF-03', 'Tier 3', 'Cross-Feature', 'Users & Brokers: Suspend user prevents broker connection syncs', false, e.message); }

  // TC-T3-CF-04: Users & Audit Logs
  try {
    const targetId = users.find(u => u.email === 'user@tradevault.in')?.id || '';
    
    // 1. Trigger role change
    await fetch(`${BASE_URL}/admin/users/${targetId}/role`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' })
    });

    // 2. Check audit log
    const auditRes = await fetch(`${BASE_URL}/admin/audit?action=ROLE_CHANGE`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const auditData: any = await auditRes.json();
    
    const newestLog = auditData.logs[0];
    const ok = newestLog && newestLog.action === 'ROLE_CHANGE' && newestLog.targetId === targetId && newestLog.details.includes('ADMIN');

    // Restore
    await fetch(`${BASE_URL}/admin/users/${targetId}/role`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'USER' })
    });

    recordResult('TC-T3-CF-04', 'Tier 3', 'Cross-Feature', 'Users & Audit Logs: Changing a user role writes to audit log', ok);
  } catch (e: any) { recordResult('TC-T3-CF-04', 'Tier 3', 'Cross-Feature', 'Users & Audit Logs: Changing a user role writes to audit log', false, e.message); }

  // TC-T3-CF-05: Users & Overview
  try {
    // 1. Signup a temp user
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'temp-count@tradevault.in', password: 'password123', fullName: 'Temp User' })
    });
    const signupJson: any = await signupRes.json();
    const tempId = signupJson.user.id;

    // Get overview before deletion
    const overviewBefore = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const beforeData: any = await overviewBefore.json();

    // 2. Delete user
    await fetch(`${BASE_URL}/admin/users/${tempId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });

    // Get overview after deletion
    const overviewAfter = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const afterData: any = await overviewAfter.json();

    const ok = afterData.totalUsers === beforeData.totalUsers - 1;

    recordResult('TC-T3-CF-05', 'Tier 3', 'Cross-Feature', 'Users & Overview: Deleting a user decrements totalUsers count in overview', ok);
  } catch (e: any) { recordResult('TC-T3-CF-05', 'Tier 3', 'Cross-Feature', 'Users & Overview: Deleting a user decrements totalUsers count in overview', false, e.message); }

  // TC-T3-CF-06: Trades & Overview
  try {
    // 1. Get overview stats before adding trade
    const before = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const beforeData: any = await before.json();

    // 2. Add trade
    await fetch(`${BASE_URL}/trades`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'TATASTEEL', market: 'NSE', instrumentType: 'EQ', netPnl: '500', quantity: '10' })
    });

    // 3. Get overview stats after adding trade
    const after = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const afterData: any = await after.json();

    const ok = afterData.totalTrades === beforeData.totalTrades + 1 && afterData.netPnl === beforeData.netPnl + 500;

    recordResult('TC-T3-CF-06', 'Tier 3', 'Cross-Feature', 'Trades & Overview: Posting user trade increments trade count and net PnL', ok);
  } catch (e: any) { recordResult('TC-T3-CF-06', 'Tier 3', 'Cross-Feature', 'Trades & Overview: Posting user trade increments trade count and net PnL', false, e.message); }

  // TC-T3-CF-07: AI Coach & Overview
  try {
    // 1. Get overview stats before triggering AI
    const before = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const beforeData: any = await before.json();

    // 2. Trigger AI analysis run
    await fetch(`${BASE_URL}/insights/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    // 3. Get overview stats after triggering AI
    const after = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const afterData: any = await after.json();

    const ok = afterData.aiInsightsCount === beforeData.aiInsightsCount + 1;

    recordResult('TC-T3-CF-07', 'Tier 3', 'Cross-Feature', 'AI Coach & Overview: Generating AI insight increments aiInsightsCount in overview', ok);
  } catch (e: any) { recordResult('TC-T3-CF-07', 'Tier 3', 'Cross-Feature', 'AI Coach & Overview: Generating AI insight increments aiInsightsCount in overview', false, e.message); }
}

// ──────────────────────────────────────────────────────────────────────────────
// TIER 4: REAL-WORLD SCENARIOS (5 CASES)
// ──────────────────────────────────────────────────────────────────────────────
async function runTier4RealWorldScenarios() {
  console.log('\n--- 📌 Running Tier 4: Real-World Scenarios (5 cases) ---');

  // === TC-T4-RW-01: User Suspension & Access Enforcement Flow ===
  try {
    const targetUserId = users.find(u => u.email === 'user@tradevault.in')?.id || '';
    
    // Step 1: Admin views stats and lists users
    const r1 = await fetch(`${BASE_URL}/admin/overview`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const r2 = await fetch(`${BASE_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });

    // Step 2: Admin suspends the user
    const r3 = await fetch(`${BASE_URL}/admin/users/${targetUserId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: true })
    });

    // Step 3: Verify audit log shows SUSPEND action
    const r4 = await fetch(`${BASE_URL}/admin/audit`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const r4Data: any = await r4.json();
    const hasLog = r4Data.logs.some((l: any) => l.action === 'STATUS_CHANGE' && l.targetId === targetUserId && l.details.includes('Suspended'));

    // Step 4: User tries to authenticate or access /trades, should fail
    const r5 = await fetch(`${BASE_URL}/trades`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const blocked = r5.status === 403;

    // Step 5: Admin reactivates the user
    await fetch(`${BASE_URL}/admin/users/${targetUserId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isSuspended: false })
    });

    // Step 6: User can access trades again
    const r6 = await fetch(`${BASE_URL}/trades`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const restored = r6.status === 200;

    const ok = r1.status === 200 && r2.status === 200 && r3.status === 200 && hasLog && blocked && restored;
    recordResult('TC-T4-RW-01', 'Tier 4', 'Real-World', 'User suspension, audit logging, API rejection, and reactivation workflow', ok);
  } catch (e: any) { recordResult('TC-T4-RW-01', 'Tier 4', 'Real-World', 'User suspension, audit logging, API rejection, and reactivation workflow', false, e.message); }


  // === TC-T4-RW-02: Settings Update & Maintenance Mode Flow ===
  try {
    // Step 1: Admin updates announcement and maintenance mode to true
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'system_announcement', value: 'Scheduled Maintenance' })
    });
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'maintenance_mode', value: 'true' })
    });

    // Step 2: User attempts access, gets 503 Service Unavailable
    const r1 = await fetch(`${BASE_URL}/trades`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const is503 = r1.status === 503;

    // Step 3: Admin logs in (should be allowed even under maintenance) and disables maintenance mode
    const r2 = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'maintenance_mode', value: 'false' })
    });

    // Step 4: User accesses system again, successfully retrieving data
    const r3 = await fetch(`${BASE_URL}/trades`, { headers: { 'Authorization': `Bearer ${userToken}` } });
    const is200 = r3.status === 200;

    const ok = is503 && r2.status === 200 && is200;
    recordResult('TC-T4-RW-02', 'Tier 4', 'Real-World', 'Settings updates, maintenance mode lockouts, and admin bypass overrides', ok);
  } catch (e: any) { recordResult('TC-T4-RW-02', 'Tier 4', 'Real-World', 'Settings updates, maintenance mode lockouts, and admin bypass overrides', false, e.message); }


  // === TC-T4-RW-03: Broker Token Expiry & Sync Override Lifecycle ===
  try {
    // Simulate connection failure by changing status to active but incorrect key/token
    const connIdx = brokerConnections.findIndex(bc => bc.broker === 'dhan');
    const originalKey = brokerConnections[connIdx].apiKey;
    brokerConnections[connIdx].apiKey = null; // simulate invalid key / needs reauth

    // Step 1: Admin reads broker stats, sees lastSyncFailures count
    const r1 = await fetch(`${BASE_URL}/admin/brokers`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    
    // Step 2: Admin triggers sync, fails due to missing key
    const connId = brokerConnections[connIdx].id;
    const r2 = await fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, { method: 'POST', headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const is400 = r2.status === 400;

    // Step 3: User updates token via user endpoint patch
    const r3 = await fetch(`${BASE_URL}/brokers/dhan/token`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: 'new-valid-token' })
    });

    // Step 4: Admin retries the manual sync, which now succeeds
    const r4 = await fetch(`${BASE_URL}/admin/brokers/${connId}/sync`, { method: 'POST', headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const r4Data: any = await r4.json();
    const success = r4.status === 200 && r4Data.success === true && r4Data.syncedCount === 1;

    // Restore
    brokerConnections[connIdx].apiKey = originalKey;

    const ok = r1.status === 200 && is400 && r3.status === 200 && success;
    recordResult('TC-T4-RW-03', 'Tier 4', 'Real-World', 'Broker sync token expiry, failure analysis, token patching, and manual override sync', ok);
  } catch (e: any) { recordResult('TC-T4-RW-03', 'Tier 4', 'Real-World', 'Broker sync token expiry, failure analysis, token patching, and manual override sync', false, e.message); }


  // === TC-T4-RW-04: User Deletion Cascading & Audit Trails ===
  try {
    // Step 1: Create a temporary user
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cascade@tradevault.in', password: 'password123', fullName: 'Cascade User' })
    });
    const signupJson: any = await signupRes.json();
    const tempId = signupJson.user.id;
    const tempToken = signupJson.token;

    // Step 2: Post trade and broker connection for temp user
    await fetch(`${BASE_URL}/trades`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tempToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'INFY', market: 'NSE', instrumentType: 'EQ', netPnl: '100' })
    });
    brokerConnections.push({
      id: 'bc-cascade-temp',
      userId: tempId,
      userEmail: 'cascade@tradevault.in',
      broker: 'dhan',
      clientId: 'cli-temp',
      apiKey: 'key-temp',
      isActive: true,
      lastSyncedAt: null,
      syncHealth: 'SUCCESS',
      createdAt: new Date().toISOString()
    });

    // Step 3: Admin deletes user
    const delRes = await fetch(`${BASE_URL}/admin/users/${tempId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });

    // Step 4: Verify cascade deletes: trades and connections are gone
    const tradesRes = await fetch(`${BASE_URL}/admin/trades?user=${tempId}`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const tradesData: any = await tradesRes.json();
    const hasConnection = brokerConnections.some(bc => bc.userId === tempId);

    // Step 5: Verify audit log shows USER_DELETE
    const auditRes = await fetch(`${BASE_URL}/admin/audit?action=USER_DELETE`, { headers: { 'Authorization': `Bearer ${superAdminToken}` } });
    const auditData: any = await auditRes.json();
    const logged = auditData.logs.some((l: any) => l.targetId === tempId);

    const ok = delRes.status === 200 && tradesData.trades.length === 0 && !hasConnection && logged;
    recordResult('TC-T4-RW-04', 'Tier 4', 'Real-World', 'User deletion, cascading cleanup of trades/broker connections, and audit logging', ok);
  } catch (e: any) { recordResult('TC-T4-RW-04', 'Tier 4', 'Real-World', 'User deletion, cascading cleanup of trades/broker connections, and audit logging', false, e.message); }


  // === TC-T4-RW-05: Admin Promotion, Authorization, and Demotion Lifecycle ===
  try {
    // Step 1: Create a user
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'promo@tradevault.in', password: 'password123', fullName: 'Promo User' })
    });
    const signupJson: any = await signupRes.json();
    const tempId = signupJson.user.id;
    let tempToken = signupJson.token;

    // Step 2: User tries setting update, gets 403
    const r1 = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tempToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach', value: 'false' })
    });
    const is403Before = r1.status === 403;

    // Step 3: Super Admin promotes user to SUPER_ADMIN
    await fetch(`${BASE_URL}/admin/users/${tempId}/role`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'SUPER_ADMIN' })
    });

    // Re-login to get token with updated role claims
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'promo@tradevault.in', password: 'password123' })
    });
    const loginJson: any = await loginRes.json();
    tempToken = loginJson.token;

    // Step 4: Promoted user successfully updates setting
    const r2 = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tempToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach', value: 'false' })
    });
    const is200Setting = r2.status === 200;

    // Step 5: Super Admin demotes user back to USER
    await fetch(`${BASE_URL}/admin/users/${tempId}/role`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'USER' })
    });

    // Re-login to update role claims
    const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'promo@tradevault.in', password: 'password123' })
    });
    const loginJson2: any = await loginRes2.json();
    tempToken = loginJson2.token;

    // Step 6: User gets 403 again
    const r3 = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tempToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach', value: 'true' })
    });
    const is403After = r3.status === 403;

    // Clean up promoted user
    await fetch(`${BASE_URL}/admin/users/${tempId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });

    // Restore setting
    await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${superAdminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'enable_ai_coach', value: 'true' })
    });

    const ok = is403Before && is200Setting && is403After;
    recordResult('TC-T4-RW-05', 'Tier 4', 'Real-World', 'Admin promotion, authorization escalation, setting adjustment, and demotion access revocation lifecycle', ok);
  } catch (e: any) { recordResult('TC-T4-RW-05', 'Tier 4', 'Real-World', 'Admin promotion, authorization escalation, setting adjustment, and demotion access revocation lifecycle', false, e.message); }
}

// RUN
runAllTests();
