'use client';

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, CreditCard } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { useDashboardStats } from '@/lib/hooks/useDashboard';
import { useAuth } from '@/lib/auth/AuthContext';
import { DemoPill } from '@/components/DemoPill';
import { useUserPlan } from '@/lib/hooks/useUserPlan';
import { UpsellBanner } from './UpsellBanner';

export default function StatsCards() {
  const { stats, loading, error } = useDashboardStats(30);
  const { supabaseReady } = useAuth();
  const isDemo = !supabaseReady;
  const { tier, usage } = useUserPlan();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-700 dark:text-red-300">
          {error || 'ไม่สามารถโหลดข้อมูลสถิติได้'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isDemo && <DemoPill />}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="รายได้รวม"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueGrowth}
          icon={<DollarSign className="h-6 w-6" />}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          title="คำสั่งซื้อ"
          value={formatNumber(stats.totalOrders)}
          change={stats.ordersGrowth}
          icon={<ShoppingCart className="h-6 w-6" />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="ลูกค้า"
          value={formatNumber(stats.totalCustomers)}
          change={stats.customersGrowth}
          icon={<Users className="h-6 w-6" />}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="ยอดเฉลี่ย/ออเดอร์"
          value={formatCurrency(stats.averageOrderValue)}
          change={stats.revenueGrowth - stats.ordersGrowth}
          icon={<CreditCard className="h-6 w-6" />}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>
      {tier === 'free' && usage.orderPercent >= 0.8 && (
        <UpsellBanner usage={usage} />
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-500" />
            )}
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
              }`}
            >
              {formatPercent(change)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">เทียบเดือนที่แล้ว</span>
          </div>
        </div>
        <div className={`${iconBg} ${iconColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
