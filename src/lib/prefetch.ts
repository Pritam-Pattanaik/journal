import { queryClient } from '../main';
import { api } from './api';

const prefetchedRoutes = new Set<string>();

/**
 * Executes intent-driven pointer hover prefetching (onMouseEnter).
 * Simultaneously preloads the Vite code-split bundle chunk and TanStack Query API ledgers
 * into local memory to guarantee 0ms instant route switching.
 */
export function prefetchRoute(path: string) {
  // Prevent excessive duplicate invocations during a single session
  if (prefetchedRoutes.has(path)) return;
  prefetchedRoutes.add(path);

  try {
    switch (path) {
      case '/app':
      case '/app/': {
        import('../pages/Dashboard');
        queryClient.prefetchQuery({
          queryKey: ['dashboard-analytics'],
          queryFn: () => api.get('/analytics/dashboard').catch(() => null),
        });
        break;
      }
      case '/app/trades': {
        import('../pages/Trades');
        queryClient.prefetchQuery({
          queryKey: ['trades-ledger'],
          queryFn: () => api.get('/trades').catch(() => null),
        });
        break;
      }
      case '/app/journal': {
        import('../pages/Journal');
        queryClient.prefetchQuery({
          queryKey: ['journal-entries'],
          queryFn: () => api.get('/journal/entries').catch(() => null),
        });
        break;
      }
      case '/app/analytics': {
        import('../pages/Analytics');
        queryClient.prefetchQuery({
          queryKey: ['expectancy-analytics'],
          queryFn: () => api.get('/analytics/performance').catch(() => null),
        });
        break;
      }
      case '/app/ai-coach': {
        import('../pages/AICoach');
        queryClient.prefetchQuery({
          queryKey: ['ai-insights'],
          queryFn: () => api.get('/ai/insights').catch(() => null),
        });
        break;
      }
      case '/app/strategies': {
        import('../pages/Strategies');
        queryClient.prefetchQuery({
          queryKey: ['strategies-list'],
          queryFn: () => api.get('/strategies').catch(() => null),
        });
        break;
      }
      case '/app/markets': {
        import('../pages/Markets');
        queryClient.prefetchQuery({
          queryKey: ['markets-news'],
          queryFn: () => api.get('/news/latest').catch(() => null),
        });
        break;
      }
      case '/app/settings': {
        import('../pages/Settings');
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.debug('Prefetch optimization gracefully fallback:', error);
  }
}
