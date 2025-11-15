'use client';

import { useNotifications } from '@/lib/hooks/useNotifications';
import { Bell, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export default function RecentNotifications() {
  const { notifications, loading } = useNotifications(false, 5);

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'order_created':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'order_shipped':
      case 'order_delivered':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          การแจ้งเตือนล่าสุด
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">ไม่มีการแจ้งเตือนใหม่</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${getSeverityColor(notification.severity)} ${
                !notification.isRead ? 'ring-2 ring-blue-500/50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
