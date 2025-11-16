import { useState, useCallback, useEffect } from 'react';
import {
  getAllNotifications,
  getUnreadNotifications,
  getNotificationsByCategory,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
  clearAllNotifications,
  getNotificationPreferences,
  saveNotificationPreferences,
  shouldShowNotification,
  getUnreadCount,
  cleanupExpiredNotifications,
  Notification,
  NotificationPreferences,
  type NotificationCategory,
} from '@/lib/utils/notifications';

/**
 * Hook for managing notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(
    getNotificationPreferences()
  );

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();

    // Cleanup expired notifications periodically
    const interval = setInterval(() => {
      cleanupExpiredNotifications();
      loadNotifications();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = useCallback(() => {
    const all = getAllNotifications();
    setNotifications(all);
    setUnreadCount(getUnreadCount());
  }, []);

  const createNotification = useCallback(
    (notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
      try {
        if (!shouldShowNotification({ ...notif, id: '', read: false, createdAt: new Date() })) {
          return null;
        }

        const created = addNotification(notif);
        loadNotifications();
        return created;
      } catch (err) {
        console.error('Failed to create notification:', err);
        return null;
      }
    },
    [loadNotifications]
  );

  const markRead = useCallback(
    (id: string) => {
      try {
        const result = markAsRead(id);
        if (result) {
          loadNotifications();
        }
        return result;
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        return null;
      }
    },
    [loadNotifications]
  );

  const markAllRead = useCallback(() => {
    try {
      markAllAsRead();
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [loadNotifications]);

  const deleteNotif = useCallback(
    (id: string) => {
      try {
        const success = deleteNotification(id);
        if (success) {
          loadNotifications();
        }
        return success;
      } catch (err) {
        console.error('Failed to delete notification:', err);
        return false;
      }
    },
    [loadNotifications]
  );

  const deleteMultiple = useCallback(
    (ids: string[]) => {
      try {
        deleteNotifications(ids);
        loadNotifications();
      } catch (err) {
        console.error('Failed to delete notifications:', err);
      }
    },
    [loadNotifications]
  );

  const clearAll = useCallback(() => {
    try {
      clearAllNotifications();
      loadNotifications();
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, [loadNotifications]);

  const updatePreferences = useCallback((prefs: NotificationPreferences) => {
    try {
      saveNotificationPreferences(prefs);
      setPreferencesState(prefs);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  }, []);

  const getByCategory = useCallback((category: NotificationCategory) => {
    return getNotificationsByCategory(category);
  }, []);

  return {
    // Data
    notifications,
    unreadCount,
    unreadNotifications: getUnreadNotifications(),
    preferences,

    // Actions
    createNotification,
    markRead,
    markAllRead,
    deleteNotif,
    deleteMultiple,
    clearAll,
    updatePreferences,
    getByCategory,

    // Utility
    refresh: loadNotifications,
  };
}

/**
 * Hook for notification center display
 */
export function useNotificationCenter(maxNotifications: number = 5) {
  const { notifications, markRead, deleteNotif } = useNotifications();

  const displayNotifications = notifications
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, maxNotifications);

  return {
    notifications: displayNotifications,
    total: notifications.length,
    markRead,
    deleteNotif,
  };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    getNotificationPreferences()
  );

  const updateCategory = useCallback((category: NotificationCategory, enabled: boolean) => {
    const updated = {
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: enabled,
      },
    };
    saveNotificationPreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  const updateMinPriority = useCallback((priority: 'low' | 'medium' | 'high' | 'critical') => {
    const updated = { ...preferences, minPriority: priority };
    saveNotificationPreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  const updateSoundEnabled = useCallback((enabled: boolean) => {
    const updated = { ...preferences, enableSound: enabled };
    saveNotificationPreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  const updateBrowserNotifications = useCallback((enabled: boolean) => {
    const updated = { ...preferences, enableBrowserNotification: enabled };
    saveNotificationPreferences(updated);
    setPreferences(updated);
  }, [preferences]);

  const updateQuietHours = useCallback(
    (enabled: boolean, start?: string, end?: string) => {
      const updated = {
        ...preferences,
        quietHours: {
          enabled,
          start: start || preferences.quietHours?.start || '22:00',
          end: end || preferences.quietHours?.end || '08:00',
        },
      };
      saveNotificationPreferences(updated);
      setPreferences(updated);
    },
    [preferences]
  );

  return {
    preferences,
    updateCategory,
    updateMinPriority,
    updateSoundEnabled,
    updateBrowserNotifications,
    updateQuietHours,
  };
}

/**
 * Hook for notification toasts
 */
export function useNotificationToast(duration: number = 5000) {
  const [toasts, setToasts] = useState<Array<Notification & { toastId: string }>>([]);

  const addToast = useCallback(
    (notif: Notification) => {
      const toastId = `toast_${Date.now()}`;
      const toast = { ...notif, toastId };

      setToasts((prev) => [...prev, toast]);

      // Auto-remove after duration
      setTimeout(() => {
        removeToast(toastId);
      }, duration);

      return toastId;
    },
    [duration]
  );

  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const removeAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    removeAll,
  };
}
