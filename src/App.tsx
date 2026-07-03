import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch trades whenever user logs in (token changes to a real value)
  useEffect(() => {
    if (token) {
      fetchTrades();
    }
  }, [token, fetchTrades]);

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
