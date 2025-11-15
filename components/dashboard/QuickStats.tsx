'use client';

import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface QuickStatsData {
  todayRevenue: number;
  todayOrders: number;
  totalCustomers: number;
  lowStockCount: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
}

async function fetchQuickStats(): Promise<QuickStatsData> {
  const response = await fetch('/api/dashboard/quick-stats');
  if (!response.ok) {
    throw new Error('Failed to fetch quick stats');
  }
  return response.json();
}

export default function QuickStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quick-stats'],
    queryFn: fetchQuickStats,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  if (isLoading) {
    return <SkeletonLoader type="card" count={4} />;
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">ไม่สามารถโหลดข้อมูลได้</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'รายได้วันนี้',
      value: formatCurrency(data.todayRevenue),
      change: data.revenueChange,
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600',
      link: '/analytics',
    },
    {
      title: 'ออเดอร์วันนี้',
      value: data.todayOrders.toString(),
      change: data.ordersChange,
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      link: '/orders',
    },
    {
      title: 'ลูกค้าทั้งหมด',
      value: data.totalCustomers.toLocaleString(),
      change: data.customersChange,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      link: '/customers',
    },
    {
      title: 'สินค้าใกล้หมด',
      value: data.lowStockCount.toString(),
      icon: Package,
      color: data.lowStockCount > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600',
      link: '/products',
      alert: data.lowStockCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const showChange = stat.change !== undefined;
        const isPositive = (stat.change || 0) > 0;
        const isNegative = (stat.change || 0) < 0;

        return (
          <Link
            key={index}
            href={stat.link}
            className={`bg-gradient-to-br ${stat.color} rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-all transform hover:scale-105`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Icon className="h-6 w-6" />
              </div>
              {stat.alert && (
                <div className="p-2 bg-white/20 rounded-full">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              )}
            </div>

            <div className="mb-2">
              <p className="text-sm opacity-90 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>

            {showChange && (
              <div className="flex items-center gap-1 text-sm">
                {isPositive && <TrendingUp className="h-4 w-4" />}
                {isNegative && <TrendingDown className="h-4 w-4" />}
                <span className={`${isPositive ? 'opacity-100' : 'opacity-70'}`}>
                  {isPositive && '+'}
                  {stat.change}% จากเมื่อวาน
                </span>
              </div>
            )}

            <div className="flex items-center gap-1 text-sm mt-3 opacity-80 hover:opacity-100 transition-opacity">
              <span>ดูรายละเอียด</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
