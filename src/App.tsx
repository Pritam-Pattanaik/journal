import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Journal from './pages/Journal';
import AICoach from './pages/AICoach';
import Strategies from './pages/Strategies';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Home from './pages/marketing/Home';
import About from './pages/marketing/About';
import Pricing from './pages/marketing/Pricing';
import MarketingLayout from './components/layout/MarketingLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import { useAuthStore } from './stores/authStore';
import { useTradeStore } from './stores/tradeStore';
import { useBrokerStore } from './stores/brokerStore';

// How often (ms) to silently re-sync in the background while the app is open.
// 5 minutes keeps trades fresh without hammering the broker API.
const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile } = useAuthStore();

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base text-primary font-ui">
      {/* Collapsible Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Navigation Header */}
        <Header />

        {/* Scrollable Page Wrapper */}
        <PageWrapper>
          <Routes>
            <Route path="/" element={profile?.role === 'SUPER_ADMIN' ? <AdminDashboard /> : <Dashboard />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/ai-coach" element={<AICoach />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageWrapper>
      </div>
    </div>
  );
}

export default function App() {
  const initialize = useAuthStore(state => state.initialize);
  const fetchTrades = useTradeStore(state => state.fetchTrades);
  const token = useAuthStore(state => state.token);
  const fetchConnections = useBrokerStore(state => state.fetchConnections);
  const syncAll = useBrokerStore(state => state.syncAll);

  // Prevents duplicate startup syncs (React StrictMode double-mount, fast token changes)
  const startupDoneRef = useRef(false);
  // Holds the periodic sync interval handle so we can clear it on logout
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Clear any running interval when token disappears (logout)
    if (!token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startupDoneRef.current = false;
      return;
    }

    // Prevent double-run on React StrictMode
    if (startupDoneRef.current) return;
    startupDoneRef.current = true;

    const startup = async () => {
      // ── Step 1: Show whatever is already in the DB immediately ──────────────
      // This makes the UI feel instant. User sees cached trades within ~200ms.
      await fetchConnections();
      await fetchTrades();

      // ── Step 2: Fire broker sync in the background (non-blocking) ───────────
      // We do NOT await this. The sync may take 5–30s for a 90-day backfill.
      // When it finishes, syncAll() automatically calls fetchTrades() again,
      // so the Trades page silently updates without any user action.
      const { connections } = useBrokerStore.getState();
      const hasActiveBrokers = connections.some(c => c.isActive);
      if (hasActiveBrokers) {
        syncAll().catch(err => console.warn('[AutoSync] Background sync error:', err));
      }
    };

    startup();

    // ── Step 3: Periodic background sync every 5 minutes ────────────────────
    // Keeps trades fresh throughout the trading day without any user action.
    intervalRef.current = setInterval(async () => {
      const { isSyncing, connections } = useBrokerStore.getState();
      // Skip if a sync is already running or no active brokers
      if (isSyncing || !connections.some(c => c.isActive)) return;
      syncAll().catch(err => console.warn('[PeriodicSync] Error:', err));
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, fetchTrades, fetchConnections, syncAll]);

  return (
    <Routes>
      {/* Public SaaS Pages */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/* Protected Dashboard App */}
      <Route path="/app/*" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
