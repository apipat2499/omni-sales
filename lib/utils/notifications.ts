/**
 * Notification system utilities
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'order' | 'stock' | 'system';
export type NotificationCategory = 'order' | 'stock' | 'system' | 'alert' | 'schedule';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Notification object
 */
export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  relatedId?: string; // Order ID, product ID, etc.
  relatedType?: string; // 'order', 'product', etc.
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  action?: {
    label: string;
    handler: () => void | Promise<void>;
  };
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  enableNotifications: boolean;
  enableSound: boolean;
  enableBrowserNotification: boolean;
  categories: Record<NotificationCategory, boolean>;
  minPriority: NotificationPriority;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
}

/**
 * Get all notifications
 */
export function getAllNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem('notifications');
    if (!stored) return [];

    const notifications = JSON.parse(stored) as Notification[];
    return notifications
      .map((n) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
      }))
      .filter((n) => !n.expiresAt || n.expiresAt > new Date());
  } catch {
    return [];
  }
}

/**
 * Get unread notifications
 */
export function getUnreadNotifications(): Notification[] {
  return getAllNotifications().filter((n) => !n.read);
}

/**
 * Get notifications by category
 */
export function getNotificationsByCategory(category: NotificationCategory): Notification[] {
  return getAllNotifications().filter((n) => n.category === category);
}

/**
 * Get notifications by type
 */
export function getNotificationsByType(type: NotificationType): Notification[] {
  return getAllNotifications().filter((n) => n.type === type);
}

/**
 * Get notifications by priority
 */
export function getNotificationsByPriority(priority: NotificationPriority): Notification[] {
  return getAllNotifications().filter((n) => n.priority === priority);
}

/**
 * Create a new notification
 */
export function createNotification(
  notif: Omit<Notification, 'id' | 'read' | 'createdAt'>
): Notification {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    ...notif,
    id,
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Add notification
 */
export function addNotification(
  notif: Omit<Notification, 'id' | 'read' | 'createdAt'>
): Notification {
  const notification = createNotification(notif);
  saveNotification(notification);

  // Play sound if enabled and not in quiet hours
  const prefs = getNotificationPreferences();
  if (prefs.enableSound && !isInQuietHours(prefs)) {
    playNotificationSound();
  }

  // Show browser notification if enabled
  if (prefs.enableBrowserNotification && 'Notification' in window) {
    showBrowserNotification(notification);
  }

  return notification;
}

/**
 * Save notification
 */
export function saveNotification(notif: Notification): void {
  const notifications = getAllNotifications();
  const index = notifications.findIndex((n) => n.id === notif.id);

  if (index >= 0) {
    notifications[index] = notif;
  } else {
    notifications.push(notif);
  }

  // Keep last 500 notifications
  if (notifications.length > 500) {
    notifications.shift();
  }

  localStorage.setItem('notifications', JSON.stringify(notifications));
}

/**
 * Mark notification as read
 */
export function markAsRead(id: string): Notification | null {
  const notif = getNotificationById(id);
  if (!notif) return null;

  const updated = { ...notif, read: true };
  saveNotification(updated);
  return updated;
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead(): void {
  const notifications = getAllNotifications();
  notifications.forEach((n) => {
    n.read = true;
    saveNotification(n);
  });
}

/**
 * Delete notification
 */
export function deleteNotification(id: string): boolean {
  const notifications = getAllNotifications();
  const filtered = notifications.filter((n) => n.id !== id);

  if (filtered.length === notifications.length) {
    return false;
  }

  localStorage.setItem('notifications', JSON.stringify(filtered));
  return true;
}

/**
 * Delete multiple notifications
 */
export function deleteNotifications(ids: string[]): void {
  const notifications = getAllNotifications();
  const filtered = notifications.filter((n) => !ids.includes(n.id));
  localStorage.setItem('notifications', JSON.stringify(filtered));
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  localStorage.removeItem('notifications');
}

/**
 * Get notification by ID
 */
export function getNotificationById(id: string): Notification | null {
  const notifications = getAllNotifications();
  return notifications.find((n) => n.id === id) || null;
}

/**
 * Get notification preferences
 */
export function getNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem('notification_preferences');
    return (
      JSON.parse(stored || '{}') || {
        enableNotifications: true,
        enableSound: true,
        enableBrowserNotification: true,
        categories: {
          order: true,
          stock: true,
          system: true,
          alert: true,
          schedule: true,
        },
        minPriority: 'low',
      }
    );
  } catch {
    return {
      enableNotifications: true,
      enableSound: true,
      enableBrowserNotification: true,
      categories: {
        order: true,
        stock: true,
        system: true,
        alert: true,
        schedule: true,
      },
      minPriority: 'low',
    };
  }
}

/**
 * Save notification preferences
 */
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  localStorage.setItem('notification_preferences', JSON.stringify(prefs));
}

/**
 * Check if notification should be shown based on preferences
 */
export function shouldShowNotification(notif: Notification): boolean {
  const prefs = getNotificationPreferences();

  if (!prefs.enableNotifications) return false;
  if (!prefs.categories[notif.category]) return false;
  if (getPriorityValue(notif.priority) < getPriorityValue(prefs.minPriority)) return false;
  if (isInQuietHours(prefs)) return false;

  return true;
}

/**
 * Check if current time is in quiet hours
 */
export function isInQuietHours(prefs: NotificationPreferences): boolean {
  if (!prefs.quietHours?.enabled) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
  const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);
  const [currentHour, currentMin] = currentTime.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  const current = currentHour * 60 + currentMin;

  // Handle case where quiet hours span midnight
  if (startTime > endTime) {
    return current >= startTime || current < endTime;
  }

  return current >= startTime && current < endTime;
}

/**
 * Play notification sound
 */
export function playNotificationSound(): void {
  try {
    // Use a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch {
    // Fallback: do nothing if Web Audio API is not available
  }
}

/**
 * Show browser notification
 */
export function showBrowserNotification(notif: Notification): void {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(notif.title, {
      body: notif.message,
      tag: notif.id,
      icon: '/favicon.ico',
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

/**
 * Get priority value for sorting
 */
function getPriorityValue(priority: NotificationPriority): number {
  const priorities: Record<NotificationPriority, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return priorities[priority];
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
  return getUnreadNotifications().length;
}

/**
 * Get unread count by category
 */
export function getUnreadCountByCategory(category: NotificationCategory): number {
  return getNotificationsByCategory(category).filter((n) => !n.read).length;
}

/**
 * Create notification templates
 */
export const notificationTemplates = {
  orderCreated: (orderId: string): Omit<Notification, 'id' | 'read' | 'createdAt'> => ({
    type: 'order',
    category: 'order',
    priority: 'medium',
    title: 'ออเดอร์ใหม่',
    message: `ออเดอร์ ${orderId} ได้รับการสร้าง`,
    relatedId: orderId,
    relatedType: 'order',
  }),

  orderCompleted: (orderId: string): Omit<Notification, 'id' | 'read' | 'createdAt'> => ({
    type: 'success',
    category: 'order',
    priority: 'medium',
    title: 'ออเดอร์เสร็จสิ้น',
    message: `ออเดอร์ ${orderId} เสร็จสิ้นแล้ว`,
    relatedId: orderId,
    relatedType: 'order',
  }),

  stockLow: (productName: string, quantity: number): Omit<Notification, 'id' | 'read' | 'createdAt'> => ({
    type: 'warning',
    category: 'stock',
    priority: 'high',
    title: 'สต๊อกต่ำ',
    message: `${productName} มีสต๊อกเหลือ ${quantity} หน่วย`,
    relatedType: 'product',
  }),

  outOfStock: (productName: string): Omit<Notification, 'id' | 'read' | 'createdAt'> => ({
    type: 'error',
    category: 'stock',
    priority: 'critical',
    title: 'หมดสต๊อก',
    message: `${productName} หมดสต๊อก`,
    relatedType: 'product',
  }),

  scheduleExecuted: (scheduleName: string): Omit<Notification, 'id' | 'read' | 'createdAt'> => ({
    type: 'info',
    category: 'schedule',
    priority: 'low',
    title: 'ตารางอีเวนต์ดำเนิน',
    message: `ตารางอีเวนต์ "${scheduleName}" ดำเนินการแล้ว`,
    relatedType: 'schedule',
  }),

  systemAlert: (message: string): Omit<Notification, 'id' | 'read' | 'createdAt'> => ({
    type: 'info',
    category: 'system',
    priority: 'medium',
    title: 'การแจ้งเตือนระบบ',
    message,
    relatedType: 'system',
  }),
};

/**
 * Clean up expired notifications
 */
export function cleanupExpiredNotifications(): void {
  const notifications = getAllNotifications();
  const now = new Date();
  const filtered = notifications.filter((n) => !n.expiresAt || n.expiresAt > now);

  if (filtered.length < notifications.length) {
    localStorage.setItem('notifications', JSON.stringify(filtered));
  }
}
