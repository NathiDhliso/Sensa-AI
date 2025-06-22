import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  currentView: string;
  notifications: Notification[];
  loading: Record<string, boolean>;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (key: string, loading: boolean) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  currentView: 'dashboard',
  notifications: [],
  loading: {},

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
  
  addNotification: (notification) => {
    const id = `notification_${Date.now()}`;
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  setLoading: (key, loading) => set((state) => ({
    loading: { ...state.loading, [key]: loading }
  })),
  
  clearNotifications: () => set({ notifications: [] }),
}));