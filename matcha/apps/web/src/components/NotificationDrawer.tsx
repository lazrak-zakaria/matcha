"use client";

import { useCallback, useEffect } from "react";
import { Bell, CheckCheck, Eye, Heart, MessageCircle, Sparkles, X } from "lucide-react";
import Link from "next/link";
import notificationApi from "@/services/notification.api";
import { useRealtimeStore } from "@/store/useRealtimeStore";

const typeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  like: { label: 'Like', icon: Heart, tone: 'text-pink-600 bg-pink-100' },
  match: { label: 'Match', icon: Sparkles, tone: 'text-emerald-700 bg-emerald-100' },
  view: { label: 'View', icon: Eye, tone: 'text-blue-700 bg-blue-100' },
  message: { label: 'Message', icon: MessageCircle, tone: 'text-violet-700 bg-violet-100' },
};

export default function NotificationDrawer({ isSidebarCollapsed }: { isSidebarCollapsed: boolean }) {
  const {
    isNotificationDrawerOpen,
    setNotificationDrawerOpen,
    notifications,
    unreadCount,
    setUnreadCount,
    setNotifications,
  } = useRealtimeStore();

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;

    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(notifications.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }, [notifications, setNotifications, setUnreadCount, unreadCount]);

  useEffect(() => {
    if (!isNotificationDrawerOpen || unreadCount === 0) return;
    handleMarkAllRead();
  }, [handleMarkAllRead, isNotificationDrawerOpen, unreadCount]);

  const resolveAvatarUrl = (avatar?: string) => {
    if (!avatar) return '';
    if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
    const normalizedPath = avatar.startsWith('/') ? avatar : `/${avatar}`;
    return `${base}${normalizedPath}`;
  };

  return (
    <aside
      className={`fixed left-0 z-40 w-full max-w-md bg-white border-r border-gray-200 shadow-xl transition-transform duration-200 ${
        isNotificationDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      } top-16 bottom-16 lg:top-0 lg:bottom-0 ${isSidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-72'}`}
      aria-hidden={!isNotificationDrawerOpen}
    >
      <div className="border-b p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold text-gray-900">Notifications</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:bg-gray-300"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
            <button
              onClick={() => setNotificationDrawerOpen(false)}
              className="rounded-md border px-2 py-1 text-gray-600 hover:bg-gray-100"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-full overflow-y-auto p-3 pb-24 lg:pb-6">
        {notifications.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            <Bell className="mx-auto mb-3 h-6 w-6" />
            No notifications yet
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const config = typeConfig[notification.type] ?? {
                label: 'Notification',
                icon: Bell,
                tone: 'text-gray-700 bg-gray-100',
              };
              const Icon = config.icon;
              const content = (
                <div
                  className={`rounded-xl border p-3 ${notification.isRead ? 'bg-white border-gray-200' : 'bg-blue-50/40 border-blue-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      {notification.actorAvatar ? (
                        <img
                          src={resolveAvatarUrl(notification.actorAvatar)}
                          alt={notification.actorUsername ?? 'User'}
                          className="h-10 w-10 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center border">
                          {(notification.actorUsername ?? 'U').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 rounded-full p-1 ${config.tone}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {notification.actorUsername ? `${notification.actorUsername} • ` : ''}{config.label}
                        </p>
                        {!notification.isRead && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                      </div>
                      <p className="mt-1 text-sm text-gray-700 break-words">{notification.message}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );

              return (
                notification.actorId ? (
                  <Link
                    key={`${notification.id}-${notification.createdAt}`}
                    href={`/user/${notification.actorId}`}
                    onClick={() => setNotificationDrawerOpen(false)}
                    className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={`${notification.id}-${notification.createdAt}`}>
                    {content}
                  </div>
                )
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
