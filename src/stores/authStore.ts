import { create } from 'zustand';
import { api } from '../lib/api';

interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  role: 'USER' | 'SUB_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';
}

interface AuthState {
  user: Profile | null;
  profile: Profile | null; // backwards compatibility alias
  session: { token: string } | null;
  token: string | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: localStorage.getItem('token') ? { token: localStorage.getItem('token')! } : null,
  token: localStorage.getItem('token'),
  loading: true,

  initialize: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const data = await api.get<{ user: Profile }>('/auth/me');
      set({ user: data.user, profile: data.user, loading: false });
    } catch (err) {
      console.error('Session restore failed:', err);
      localStorage.removeItem('token');
      set({ token: null, session: null, user: null, profile: null, loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      const data = await api.post<{ token: string; user: Profile }>('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({ token: data.token, session: { token: data.token }, user: data.user, profile: data.user });
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  signUp: async (email, password, fullName) => {
    try {
      const data = await api.post<{ token: string; user: Profile }>('/auth/signup', { email, password, fullName });
      localStorage.setItem('token', data.token);
      set({ token: data.token, session: { token: data.token }, user: data.user, profile: data.user });
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  signOut: () => {
    localStorage.removeItem('token');
    set({ token: null, session: null, user: null, profile: null });
  },

  updateProfile: async (updates) => {
    try {
      const data = await api.patch<{ user: Profile }>('/auth/profile', updates);
      set({ user: data.user, profile: data.user });
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },
}));
