import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageWrapper from './components/layout/PageWrapper';
import MarketingLayout from './components/layout/MarketingLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import { PageLoadingFallback } from './components/ui/PageLoadingFallback';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useAutoSync } from './hooks/useAutoSync';
import { AuroraBackground } from './components/ui/AuroraBackground';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AsyncStateBoundary } from './components/ui/AsyncStateBoundary';
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
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const Home = React.lazy(() => import('./pages/marketing/Home'));
const About = React.lazy(() => import('./pages/marketing/About'));
const Pricing = React.lazy(() => import('./pages/marketing/Pricing'));
const Privacy = React.lazy(() => import('./pages/marketing/Privacy'));
const Terms = React.lazy(() => import('./pages/marketing/Terms'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail = React.lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminTrades = React.lazy(() => import('./pages/admin/AdminTrades'));
const AdminBrokers = React.lazy(() => import('./pages/admin/AdminBrokers'));
const AdminAIMonitor = React.lazy(() => import('./pages/admin/AdminAIMonitor'));
const AdminAuditLogs = React.lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminSystemSettings = React.lazy(() => import('./pages/admin/AdminSystemSettings'));
const SystemHealth = React.lazy(() => import('./pages/SystemHealth'));

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
              <AsyncStateBoundary>
                <Suspense fallback={<PageLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={profile?.role === 'SUPER_ADMIN' ? <Navigate to="/app/admin" replace /> : <Dashboard />} />

                  <Route path="/trades" element={<Trades />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/vault" element={<KnowledgeVault />} />
                  <Route path="/goals" element={<Goals />} />
                  <Route path="/markets" element={<Markets />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/ai-coach" element={<AICoach />} />
                  <Route path="/strategies" element={<Strategies />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/system-health" element={<SystemHealth />} />
                  <Route path="/admin/*" element={<Navigate to="/app/admin" replace />} />
                  <Route path="*" element={<Navigate to="/app" replace />} />
                </Routes>
              </Suspense>
              </AsyncStateBoundary>
            </ErrorBoundary>
          </PageWrapper>
        </div>
      </div>
    </AuroraBackground>
  );
}

export default function App() {
  useAutoSync();

  // Ctrl+Shift+D — navigate to developer diagnostics page
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        window.location.href = '/app/system-health';
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public SaaS Pages */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        {/* Auth Pages (Standalone Layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Dashboard App */}
        <Route path="/app/*" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } />
        
        {/* Admin App */}
        <Route path="/app/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="trades" element={<AdminTrades />} />
          <Route path="brokers" element={<AdminBrokers />} />
          <Route path="ai" element={<AdminAIMonitor />} />
          <Route path="audit" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminSystemSettings />} />
          <Route path="*" element={<Navigate to="/app/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
    <Toaster position="bottom-right" richColors expand={false} />
    </>
  );
}
