import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationCategory = 'Trading' | 'Risk' | 'Market' | 'AI' | 'Reports';
export type NotificationPriority = 'Critical' | 'Warning' | 'Success' | 'Information';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

export type NotificationFilter = 'All' | NotificationCategory | 'Unread';

interface NotificationState {
  notifications: NotificationItem[];
  filter: NotificationFilter;
  isPanelOpen: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  isConnected: boolean; // For SSE state
  
  // Actions
  fetchNotifications: () => Promise<void>;
  initializeSSE: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setFilter: (filter: NotificationFilter) => void;
  setPanelOpen: (isOpen: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
}

// Global SSE connection instance so it's not duplicated
let eventSource: EventSource | null = null;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      filter: 'All',
      isPanelOpen: false,
      soundEnabled: true,
      soundVolume: 0.5,
      isConnected: false,

      fetchNotifications: async () => {
        try {
          const res = await fetch('/api/notifications', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          set({ notifications: data });
        } catch (error) {
          console.error('[Notifications] Fetch error:', error);
        }
      },

      initializeSSE: () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (eventSource) {
          eventSource.close();
        }

        // Pass token in URL query since EventSource doesn't support headers directly
        eventSource = new EventSource(`/api/notifications/stream?token=${token}`);

        eventSource.onopen = () => {
          console.log('[Notifications] SSE Connected');
          set({ isConnected: true });
        };

        eventSource.onerror = (err) => {
          console.error('[Notifications] SSE Error:', err);
          set({ isConnected: false });
          // EventSource will automatically try to reconnect
        };

        // Listen for new notifications
        eventSource.addEventListener('new_notification', (e) => {
          try {
            const parsed = JSON.parse(e.data);
            const newItem: NotificationItem = {
              id: parsed.id,
              title: parsed.title,
              description: parsed.description,
              timestamp: new Date(parsed.createdAt).getTime(),
              category: parsed.category,
              priority: parsed.priority,
              isRead: parsed.isRead,
              actionLabel: parsed.actionLabel,
              actionUrl: parsed.actionUrl,
            };

            set((state) => ({
              notifications: [newItem, ...state.notifications]
            }));
          } catch (error) {
            console.error('[Notifications] Failed to parse SSE event:', error);
          }
        });
      },

      markAsRead: async (id) => {
        // Optimistic UI update
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, isRead: true } : n
          )
        }));

        try {
          await fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        } catch (e) {
          console.error('Failed to mark read', e);
        }
      },

      markAllAsRead: async () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true }))
        }));

        try {
          await fetch(`/api/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        } catch (e) {
          console.error('Failed to mark all read', e);
        }
      },

      clearAll: async () => {
        set({ notifications: [] });

        try {
          await fetch(`/api/notifications`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        } catch (e) {
          console.error('Failed to clear all', e);
        }
      },

      deleteNotification: async (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));

        try {
          await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
        } catch (e) {
          console.error('Failed to delete', e);
        }
      },

      setFilter: (filter) => set({ filter }),
      
      setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
      
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      
      setSoundVolume: (volume) => set({ soundVolume: volume }),

    }),
    {
      name: 'tradevault-notifications-settings',
      partialize: (state) => ({ 
        soundEnabled: state.soundEnabled, 
        soundVolume: state.soundVolume 
      }), // ONLY persist settings, data comes from DB
    }
  )
);
