"use client";

import { useMemo, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import notificationApi from '@/services/notification.api'
import { useRealtimeStore } from '@/store/useRealtimeStore'

const typeLabel: Record<string, string> = {
  like: 'New Like',
  match: 'New Match',
  view: 'New View',
  message: 'New Message',
}

export default function NotificationPage() {
  const { notifications, unreadCount, setUnreadCount, setNotifications } = useRealtimeStore()
  const [isMarkingRead, setIsMarkingRead] = useState(false)

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications],
  )

  const handleMarkAllRead = async () => {
    if (isMarkingRead || unreadCount === 0) return
    setIsMarkingRead(true)
    try {
      await notificationApi.markAllAsRead()
      setUnreadCount(0)
      setNotifications(sortedNotifications.map((item) => ({ ...item, isRead: true })))
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    } finally {
      setIsMarkingRead(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-8rem)] lg:min-h-screen bg-gray-50 px-4 py-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <button
            onClick={handleMarkAllRead}
            disabled={isMarkingRead || unreadCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:bg-gray-300"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        </div>

        {sortedNotifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            <Bell className="mx-auto mb-3" size={28} />
            No notifications yet
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => (
              <div
                key={`${notification.id}-${notification.createdAt}`}
                className={`rounded-xl border p-4 bg-white ${notification.isRead ? 'border-gray-200' : 'border-blue-300 bg-blue-50/40'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{typeLabel[notification.type] ?? 'Notification'}</p>
                    <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                  </div>
                  {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
