import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean; // Mobile drawer
  desktopSidebarExpanded: boolean; // Desktop width toggle
  theme: 'dark' | 'light';
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setDesktopSidebarExpanded: (isExpanded: boolean) => void;
  toggleDesktopSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => {
  const savedTheme = (localStorage.getItem('tv-theme') as 'dark' | 'light') || 'dark';
  const savedSidebar = localStorage.getItem('tv-sidebar-expanded');
  const initialSidebarExpanded = savedSidebar !== null ? savedSidebar === 'true' : true;

  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  return {
    sidebarOpen: false, // hidden on mobile by default
    desktopSidebarExpanded: initialSidebarExpanded,
    theme: savedTheme,
    setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setDesktopSidebarExpanded: (isExpanded) => {
      localStorage.setItem('tv-sidebar-expanded', String(isExpanded));
      set({ desktopSidebarExpanded: isExpanded });
    },
    toggleDesktopSidebar: () => set((state) => {
      const newVal = !state.desktopSidebarExpanded;
      localStorage.setItem('tv-sidebar-expanded', String(newVal));
      return { desktopSidebarExpanded: newVal };
    }),
    setTheme: (theme) => {
      localStorage.setItem('tv-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      set({ theme });
    },
    toggleTheme: () =>
      set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('tv-theme', newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
      }),
  };
});
