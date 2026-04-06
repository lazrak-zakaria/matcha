"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import notificationApi from "@/services/notification.api";
import { useAuthStore } from "@/store/useAuthStore";
import { useRealtimeStore } from "@/store/useRealtimeStore";
import { setActiveRealtimeSocket } from "@/lib/realtimeSocket";

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const { setUnreadCount, setSocketConnected, setNotifications, receiveNotification } = useRealtimeStore();

  useEffect(() => {
    if (!token) return;

    const socketBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002").replace(/\/api\/?$/, "");

    let mounted = true;
    let socket: Socket | null = null;

    const refreshNotifications = async () => {
      try {
        const response = await notificationApi.getMyNotifications(1, 20);
        if (mounted) {
          setUnreadCount(response.unreadCount ?? 0);
          setNotifications(response.data ?? []);
        }
      } catch (error) {
        console.error("Failed to refresh notifications:", error);
      }
    };

    socket = io(socketBaseUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["websocket"],
    });
    setActiveRealtimeSocket(socket);

    socket.on("connect", () => {
      setSocketConnected(true);
      refreshNotifications();
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    // Global notifications for likes/matches/messages/views.
    socket.on("notification", (payload) => {
      receiveNotification({
        id: Number(payload?.id ?? Date.now()),
        type: payload?.type ?? 'notification',
        message: payload?.message ?? 'New notification',
        isRead: false,
        createdAt: payload?.createdAt ?? new Date().toISOString(),
        actorId: payload?.actorId,
        actorUsername: payload?.actorUsername,
        actorAvatar: payload?.actorAvatar,
      })
    });

    // Defensive refresh if chat event is received.
    socket.on("message_received", () => {
      refreshNotifications();
    });

    socket.on("connect_error", (error) => {
      console.error("Realtime socket connect error:", error.message);
      setSocketConnected(false);
    });

    refreshNotifications();

    return () => {
      mounted = false;
      setSocketConnected(false);
      socket?.disconnect();
      setActiveRealtimeSocket(null);
    };
  }, [token, setSocketConnected, setUnreadCount, setNotifications, receiveNotification]);

  return <>{children}</>;
}
