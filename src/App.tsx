import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import MarketingLayout from './components/layout/MarketingLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import { PageLoadingFallback } from './components/ui/PageLoadingFallback';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useAutoSync } from './hooks/useAutoSync';
import { AuroraBackground } from './components/ui/AuroraBackground';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { cn } from './lib/cn';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Trades = React.lazy(() => import('./pages/Trades'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const KnowledgeVault = React.lazy(() => import('./pages/KnowledgeVault'));
const Goals = React.lazy(() => import('./pages/Goals'));
const Journal = React.lazy(() => import('./pages/Journal'));
const Markets = React.lazy(() => import('./pages/Markets'));
const AICoach = React.lazy(() => import('./pages/AICoach'));
const Strategies = React.lazy(() => import('./pages/Strategies'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Signup = React.lazy(() => import('./pages/auth/Signup'));
const Home = React.lazy(() => import('./pages/marketing/Home'));
const About = React.lazy(() => import('./pages/marketing/About'));
const Pricing = React.lazy(() => import('./pages/marketing/Pricing'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail = React.lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminTrades = React.lazy(() => import('./pages/admin/AdminTrades'));
const AdminBrokers = React.lazy(() => import('./pages/admin/AdminBrokers'));
const AdminAIMonitor = React.lazy(() => import('./pages/admin/AdminAIMonitor'));
const AdminAuditLogs = React.lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminSystemSettings = React.lazy(() => import('./pages/admin/AdminSystemSettings'));

function MainLayout() {
  const { profile } = useAuthStore();
  const { desktopSidebarExpanded } = useUIStore();
  return (
    <AuroraBackground className="h-screen w-screen overflow-hidden bg-canvas">
      <div className="relative h-full w-full flex">
        {/* Absolute Positioning for the Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div 
          className={cn(
            "flex flex-col flex-1 h-full overflow-hidden transition-all duration-250 ease-in-out w-full",
            desktopSidebarExpanded ? "lg:ml-[240px]" : "lg:ml-[68px]"
          )}
        >
          {/* Navigation Header */}
          <Header />

          {/* Scrollable Page Wrapper */}
          <PageWrapper>
            <ErrorBoundary>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route path="/" element={profile?.role === 'SUPER_ADMIN' ? <AdminOverview /> : <Dashboard />} />

                  <Route path="/trades" element={<Trades />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/vault" element={<KnowledgeVault />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/markets" element={<Markets />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/ai-coach" element={<AICoach />} />
                  <Route path="/strategies" element={<Strategies />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/admin/users" element={
                    <AdminRoute>
                      <AdminUsers />
                    </AdminRoute>
                  } />
                  <Route path="/admin/users/:id" element={
                    <AdminRoute>
                      <AdminUserDetail />
                    </AdminRoute>
                  } />
                  <Route path="/admin/trades" element={
                    <AdminRoute>
                      <AdminTrades />
                    </AdminRoute>
                  } />
                  <Route path="/admin/brokers" element={
                    <AdminRoute>
                      <AdminBrokers />
                    </AdminRoute>
                  } />
                  <Route path="/admin/ai" element={
                    <AdminRoute>
                      <AdminAIMonitor />
                    </AdminRoute>
                  } />
                  <Route path="/admin/audit" element={
                    <AdminRoute>
                      <AdminAuditLogs />
                    </AdminRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <AdminRoute>
                      <AdminSystemSettings />
                    </AdminRoute>
                  } />
                  <Route path="*" element={<Navigate to="/app" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </PageWrapper>
        </div>
      </div>
    </AuroraBackground>
  );
}

export default function App() {
  useAutoSync();

  return (
    <>
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public SaaS Pages */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
        </Route>

        {/* Auth Pages (Standalone Layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Dashboard App */}
        <Route path="/app/*" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
    <Toaster position="bottom-right" richColors expand={false} />
    </>
  );
}
