'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  CheckCircle,
  Package,
  MessageSquare,
  DollarSign,
  Truck,
  AlertCircle,
  Info,
} from 'lucide-react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface OrderTimelineProps {
  orderId: number;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

async function fetchOrderActivities(orderId: number): Promise<Activity[]> {
  const response = await fetch(`/api/orders/${orderId}/activities`);
  if (!response.ok) {
    throw new Error('Failed to fetch order activities');
  }
  const data = await response.json();
  return data.data || [];
}

const ACTIVITY_ICONS: Record<string, any> = {
  created: Clock,
  status_changed: CheckCircle,
  note_added: MessageSquare,
  payment_received: DollarSign,
  shipped: Truck,
  delivered: Package,
  cancelled: AlertCircle,
  default: Info,
};

const ACTIVITY_COLORS: Record<string, string> = {
  created: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  status_changed: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  note_added: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  payment_received: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  shipped: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  delivered: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  cancelled: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
};

export default function OrderTimeline({ orderId }: OrderTimelineProps) {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['order-activities', orderId],
    queryFn: () => fetchOrderActivities(orderId),
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return <SkeletonLoader type="list" count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">เกิดข้อผิดพลาดในการโหลดประวัติ</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">ยังไม่มีประวัติกิจกรรม</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        ประวัติกิจกรรม
      </h3>

      <div className="space-y-6">
        {activities.map((activity, index) => {
          const Icon = ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.default;
          const colorClass = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.default;

          return (
            <div key={activity.id} className="relative">
              {/* Timeline line */}
              {index < activities.length - 1 && (
                <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colorClass} flex items-center justify-center relative z-10`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.created_at).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
