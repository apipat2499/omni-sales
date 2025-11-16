'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
}

interface WebhookStatsModalProps {
  webhook: Webhook;
  onClose: () => void;
}

export default function WebhookStatsModal({ webhook, onClose }: WebhookStatsModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/webhooks/${webhook.id}/stats`);
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [webhook.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Webhook Statistics - {webhook.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Events
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_events || 0}
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Successful
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.successful_deliveries || 0}
                </p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Failed
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.failed_deliveries || 0}
                </p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Avg Duration
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avg_duration_ms ? `${Math.round(stats.avg_duration_ms)}ms` : 'N/A'}
                </p>
              </div>

              <div className="col-span-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Success Rate
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.success_rate ? `${stats.success_rate}%` : 'N/A'}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${stats.success_rate || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No statistics available</p>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
