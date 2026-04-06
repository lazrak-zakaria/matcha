import { create } from 'zustand'
import type { AppNotification } from '@/services/notification.api'

interface RealtimeState {
  unreadCount: number
  notifications: AppNotification[]
  socketConnected: boolean
  isNotificationDrawerOpen: boolean
  setUnreadCount: (count: number) => void
  setNotifications: (items: AppNotification[]) => void
  receiveNotification: (item: AppNotification) => void
  setSocketConnected: (connected: boolean) => void
  setNotificationDrawerOpen: (open: boolean) => void
  resetRealtimeState: () => void
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  unreadCount: 0,
  notifications: [],
  socketConnected: false,
  isNotificationDrawerOpen: false,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  setNotifications: (items) => set({ notifications: items }),
  receiveNotification: (item) =>
    set((state) => {
      const existingIndex = state.notifications.findIndex((current) => current.id === item.id)

      if (existingIndex >= 0) {
        const existing = state.notifications[existingIndex]
        const updated: AppNotification = {
          ...existing,
          ...item,
          isRead: false,
        }
        const next = [
          updated,
          ...state.notifications.slice(0, existingIndex),
          ...state.notifications.slice(existingIndex + 1),
        ]

        return {
          notifications: next,
          unreadCount: existing.isRead ? state.unreadCount + 1 : state.unreadCount,
        }
      }

      return {
        notifications: [{ ...item, isRead: false }, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }
    }),
  setSocketConnected: (connected) => set({ socketConnected: connected }),
  setNotificationDrawerOpen: (open) => set({ isNotificationDrawerOpen: open }),
  resetRealtimeState: () =>
    set({
      unreadCount: 0,
      notifications: [],
      socketConnected: false,
      isNotificationDrawerOpen: false,
    }),
}))
