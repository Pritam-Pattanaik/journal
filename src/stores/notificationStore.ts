import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, BASE_URL } from '../lib/api';

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
  error: string | null;
  
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
      error: null,

      fetchNotifications: async () => {
        try {
          const data = await api.get<NotificationItem[]>('/notifications');
          set({ notifications: data, error: null });
        } catch (error: any) {
          console.error('[Notifications] Fetch error:', error);
          set({ error: error.message || 'Failed to load notifications' });
        }
      },

      initializeSSE: () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        if (eventSource) {
          eventSource.close();
        }

        // Pass token in URL query since EventSource doesn't support headers directly
        eventSource = new EventSource(`${BASE_URL}/notifications/stream?token=${token}`);

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

            set((state) => {
              // Grouping / De-duplication: Ignore exact same title within 5 minutes
              const isDuplicate = state.notifications.some(n => 
                !n.isRead && 
                n.title === newItem.title && 
                (newItem.timestamp - n.timestamp) < 5 * 60 * 1000
              );

              if (isDuplicate) {
                return state;
              }

              // Keep maximum of 50 notifications to prevent memory bloat
              const updated = [newItem, ...state.notifications].slice(0, 50);
              
              return { notifications: updated, error: null };
            });

            // Auto-dismiss (mark as read) for Information and Success after 8 seconds
            if (newItem.priority === 'Information' || newItem.priority === 'Success') {
              setTimeout(() => {
                get().markAsRead(newItem.id);
              }, 8000);
            }
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
          await api.patch(`/notifications/${id}/read`, {});
        } catch (e) {
          console.error('Failed to mark read', e);
        }
      },

      markAllAsRead: async () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true }))
        }));

        try {
          await api.patch(`/notifications/read-all`, {});
        } catch (e) {
          console.error('Failed to mark all read', e);
        }
      },

      clearAll: async () => {
        set({ notifications: [] });

        try {
          await api.delete(`/notifications`);
        } catch (e) {
          console.error('Failed to clear all', e);
        }
      },

      deleteNotification: async (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));

        try {
          await api.delete(`/notifications/${id}`);
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
