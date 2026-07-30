import React, { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import AdminSidebar from './AdminSidebar';
import Header from './Header';
import PageWrapper from './PageWrapper';
import { AuroraBackground } from '../ui/AuroraBackground';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { PageLoadingFallback } from '../ui/PageLoadingFallback';
import { cn } from '../../lib/cn';

export default function AdminLayout() {
  const { profile, loading } = useAuthStore();
  const { desktopSidebarExpanded } = useUIStore();

  if (loading) {
    return <PageLoadingFallback />;
  }

  if (!profile || profile.role !== 'SUPER_ADMIN') {
    return <Navigate to="/app" replace />;
  }

  return (
    <AuroraBackground className="h-screen w-screen overflow-hidden bg-canvas">
      <div className="relative h-full w-full flex">
        <AdminSidebar />
        
        <div 
          className={cn(
            "flex flex-col flex-1 h-full overflow-hidden transition-all duration-250 ease-in-out w-full",
            desktopSidebarExpanded ? "lg:ml-[240px]" : "lg:ml-[68px]"
          )}
        >
          <Header />

          <PageWrapper>
            <ErrorBoundary>
              <Suspense fallback={<PageLoadingFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </PageWrapper>
        </div>
      </div>
    </AuroraBackground>
  );
}
