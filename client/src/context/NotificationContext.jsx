'use client';

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getSocket } from "@/lib/socket";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    getNotifications()
      .then((res) => {
        const fetched = res.data.notifications;
        setNotifications(fetched);
        setUnreadCount(fetched.filter((n) => !n.read).length);
      })
      .catch(() => {});

    const socket = getSocket();
    if (!socket) return;

    socket.connect();

    socket.on("notification", (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [user]);

  async function markAsRead(id) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }

  async function markAllAsRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
