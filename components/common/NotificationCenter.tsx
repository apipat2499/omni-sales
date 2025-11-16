'use client';

import { useState } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useNotificationCenter, useNotificationPreferences } from '@/lib/hooks/useNotifications';
import { useI18n } from '@/lib/hooks/useI18n';
import type { Notification } from '@/lib/utils/notifications';

/**
 * Notification center with dropdown
 */
export default function NotificationCenter() {
  const i18n = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { notifications, total, markRead, deleteNotif } = useNotificationCenter(10);

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title={i18n.t('notifications.title')}
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold dark:text-white">{i18n.t('notifications.title')}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {showSettings ? (
            <NotificationSettings onClose={() => setShowSettings(false)} />
          ) : (
            <>
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{i18n.t('notifications.noNotifications')}</p>
                </div>
              ) : (
                <>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onRead={() => markRead(notif.id)}
                        onDelete={() => deleteNotif(notif.id)}
                      />
                    ))}
                  </div>

                  {total > 10 && (
                    <div className="p-3 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                      +{total - 10} more notification(s)
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual notification item
 */
function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div
      className={`p-3 border-b border-gray-100 dark:border-gray-700 ${getBackgroundColor()} hover:opacity-80 transition-opacity`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold dark:text-white">{notification.title}</h4>
            <button
              onClick={onDelete}
              className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(notification.createdAt)}
            </span>

            {!notification.read && (
              <button
                onClick={onRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification settings panel
 */
function NotificationSettings({ onClose }: { onClose: () => void }) {
  const i18n = useI18n();
  const {
    preferences,
    updateCategory,
    updateMinPriority,
    updateSoundEnabled,
    updateBrowserNotifications,
    updateQuietHours,
  } = useNotificationPreferences();

  const categories: Array<{
    key: 'order' | 'stock' | 'system' | 'alert' | 'schedule';
    label: string;
  }> = [
    { key: 'order', label: 'Orders' },
    { key: 'stock', label: 'Stock' },
    { key: 'system', label: 'System' },
    { key: 'alert', label: 'Alerts' },
    { key: 'schedule', label: 'Schedules' },
  ];

  return (
    <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
      <h4 className="font-semibold dark:text-white text-sm">{i18n.t('notifications.settings')}</h4>

      {/* Sound */}
      <div className="flex items-center justify-between">
        <label className="text-sm dark:text-white">{i18n.t('notifications.sound')}</label>
        <input
          type="checkbox"
          checked={preferences.enableSound}
          onChange={(e) => updateSoundEnabled(e.target.checked)}
          className="h-4 w-4 rounded cursor-pointer"
        />
      </div>

      {/* Browser Notifications */}
      <div className="flex items-center justify-between">
        <label className="text-sm dark:text-white">Browser Notifications</label>
        <input
          type="checkbox"
          checked={preferences.enableBrowserNotification}
          onChange={(e) => updateBrowserNotifications(e.target.checked)}
          className="h-4 w-4 rounded cursor-pointer"
        />
      </div>

      {/* Categories */}
      <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Categories</p>
        {categories.map((cat) => (
          <div key={cat.key} className="flex items-center justify-between">
            <label className="text-sm dark:text-white">{cat.label}</label>
            <input
              type="checkbox"
              checked={preferences.categories[cat.key]}
              onChange={(e) => updateCategory(cat.key, e.target.checked)}
              className="h-4 w-4 rounded cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* Min Priority */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
          Minimum Priority
        </label>
        <select
          value={preferences.minPriority}
          onChange={(e) =>
            updateMinPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')
          }
          className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white w-full"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Quiet Hours */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium dark:text-white">Quiet Hours</label>
          <input
            type="checkbox"
            checked={preferences.quietHours?.enabled || false}
            onChange={(e) => updateQuietHours(e.target.checked)}
            className="h-4 w-4 rounded cursor-pointer"
          />
        </div>

        {preferences.quietHours?.enabled && (
          <div className="flex gap-2">
            <input
              type="time"
              value={preferences.quietHours.start}
              onChange={(e) =>
                updateQuietHours(true, e.target.value, preferences.quietHours?.end)
              }
              className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            />
            <input
              type="time"
              value={preferences.quietHours.end}
              onChange={(e) =>
                updateQuietHours(true, preferences.quietHours?.start, e.target.value)
              }
              className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
      >
        Done
      </button>
    </div>
  );
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}
