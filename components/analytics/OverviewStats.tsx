'use client';

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface OverviewStatsProps {
  data: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    productCount: number;
    customerCount: number;
    revenueGrowth: number;
    orderGrowth: number;
  };
}

export default function OverviewStats({ data }: OverviewStatsProps) {
  const stats = [
    {
      name: 'รายได้รวม',
      value: formatCurrency(data.totalRevenue),
      change: data.revenueGrowth,
      icon: DollarSign,
      color: 'blue',
    },
    {
      name: 'คำสั่งซื้อ',
      value: data.totalOrders.toLocaleString('th-TH'),
      change: data.orderGrowth,
      icon: ShoppingCart,
      color: 'green',
    },
    {
      name: 'มูลค่าเฉลี่ย/คำสั่งซื้อ',
      value: formatCurrency(data.averageOrderValue),
      change: 0,
      icon: TrendingUp,
      color: 'purple',
    },
    {
      name: 'ลูกค้าทั้งหมด',
      value: data.customerCount.toLocaleString('th-TH'),
      change: 0,
      icon: Users,
      color: 'amber',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                {stat.change !== 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.change > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.change > 0 ? '+' : ''}
                      {stat.change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">vs ช่วงก่อน</span>
                  </div>
                )}
              </div>
              <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
