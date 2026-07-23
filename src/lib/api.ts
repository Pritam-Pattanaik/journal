/**
 * Centralized API client for TradeVault backend.
 * Automatically attaches JWT token from localStorage.
 */

// Determine the API base URL with a bulletproof production guard.
// 1. If VITE_API_URL env var is explicitly set, always use it.
// 2. In production builds (import.meta.env.PROD === true), use relative '/api'.
// 3. As a runtime safety net: if the page is NOT served from localhost/127.0.0.1,
//    force '/api' regardless of build flags — this prevents localhost from EVER
//    leaking into a deployed environment even if the build is misconfigured.
// 4. Only in local development (localhost), use the local backend server.
function resolveBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return '/api';
  }
  // Runtime guard: if we're somehow NOT in PROD mode but also NOT on localhost,
  // we're in a deployed environment with a bad build — use relative /api.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return '/api';
    }
  }
  return 'http://localhost:3000/api';
}

export const BASE_URL = resolveBaseUrl();

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-requested-with': 'XMLHttpRequest', // Anti-CSRF header
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
