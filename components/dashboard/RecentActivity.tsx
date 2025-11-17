'use client';

import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart,
  UserPlus,
  Package,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface Activity {
  id: number;
  type: 'order' | 'customer' | 'product' | 'low_stock';
  title: string;
  description: string;
  time: string;
  link?: string;
  metadata?: any;
}

async function fetchRecentActivity(): Promise<Activity[]> {
  const response = await fetch('/api/dashboard/recent-activity');
  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }
  const data = await response.json();
  return data.activities || [];
}

const ACTIVITY_CONFIG = {
  order: {
    icon: ShoppingCart,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/20',
  },
  customer: {
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
  },
  product: {
    icon: Package,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/20',
  },
  low_stock: {
    icon: TrendingUp,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/20',
  },
};

export default function RecentActivity() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  if (isLoading) {
    return <SkeletonLoader type="list" count={5} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">ไม่สามารถโหลดกิจกรรมล่าสุดได้</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          กิจกรรมล่าสุด
        </h3>
        <Clock className="h-5 w-5 text-gray-400" />
      </div>

      {!activities || activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          ยังไม่มีกิจกรรม
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 10).map((activity) => {
            const config = ACTIVITY_CONFIG[activity.type];
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
              >
                <div className={`flex-shrink-0 p-2 rounded-lg ${config.bg}`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(activity.time).toLocaleString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {activity.link && (
                  <Link
                    href={activity.link}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
