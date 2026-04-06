import { apiService } from './api.interact'

export interface AppNotification {
  id: number
  type: 'like' | 'match' | 'view' | 'message' | string
  message: string
  isRead: boolean
  createdAt: string
  actorId?: number
  actorUsername?: string
  actorAvatar?: string
}

export interface NotificationResponse {
  data: AppNotification[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
  }
}

const notificationApi = {
  getMyNotifications: async (page = 1, limit = 20): Promise<NotificationResponse> => {
    return await apiService.getCall(`/notifications?page=${page}&limit=${limit}`)
  },

  markAllAsRead: async () => {
    return await apiService.postCall('/notifications/read-all', {})
  },
}

export default notificationApi
