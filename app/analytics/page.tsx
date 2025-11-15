'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AnalyticsDashboard, ProductPerformance } from '@/types';
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(30);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      window.location.href = '/login';
      return;
    }

    fetchAnalytics(userId, daysBack);
  }, [daysBack]);

  const fetchAnalytics = async (userId: string, days: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/analytics/dashboard?userId=${userId}&daysBack=${days}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
          {error || 'Failed to load analytics'}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Revenue',
      value: `฿${dashboard.totalRevenue.toLocaleString('th-TH', {
        maximumFractionDigits: 0,
      })}`,
      change: dashboard.revenueGrowth,
      icon: DollarSign,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Orders',
      value: dashboard.totalOrders.toLocaleString(),
      change: dashboard.ordersGrowth,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      label: 'Unique Customers',
      value: dashboard.uniqueCustomers.toLocaleString(),
      change: dashboard.customersGrowth,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      label: 'Avg Order Value',
      value: `฿${dashboard.averageOrderValue.toLocaleString('th-TH', {
        maximumFractionDigits: 2,
      })}`,
      change: 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold dark:text-white">Analytics</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Last {daysBack} days
            </p>
          </div>

          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setDaysBack(days)}
                className={`rounded-lg px-4 py-2 font-medium transition-all ${
                  daysBack === days
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const isPositive = kpi.change >= 0;

            return (
              <div
                key={kpi.label}
                className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {kpi.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold dark:text-white">
                      {kpi.value}
                    </p>
                    {kpi.change !== 0 && (
                      <p
                        className={`mt-2 text-sm font-medium ${
                          isPositive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isPositive ? '+' : ''}{kpi.change.toFixed(1)}% from last period
                      </p>
                    )}
                  </div>
                  <div className={`${kpi.color} rounded-lg p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Top Products */}
          {dashboard.topProducts && dashboard.topProducts.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold dark:text-white">
                Top Products by Revenue
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dashboard.topProducts.slice(0, 5).map((p: ProductPerformance) => ({
                    name: p.productId,
                    revenue: Number(p.revenue),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Customer Segments */}
          {dashboard.customerSegments && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold dark:text-white">
                Customer Segments
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(dashboard.customerSegments).map(
                      ([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value: value as number,
                      })
                    )}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Channel Performance */}
          {dashboard.topChannels && dashboard.topChannels.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold dark:text-white">
                Channel Performance
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dashboard.topChannels.slice(0, 5).map((c) => ({
                    name: c.channel,
                    revenue: Number(c.revenue),
                    profit: Number(c.profit),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                  <Bar dataKey="profit" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Performance */}
          {dashboard.topCategories && dashboard.topCategories.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold dark:text-white">
                Category Performance
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={dashboard.topCategories.slice(0, 5).map((c) => ({
                    name: c.category,
                    revenue: Number(c.revenue),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Anomalies */}
        {dashboard.anomalies && dashboard.anomalies.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold dark:text-white">
              Anomalies Detected
            </h2>
            <div className="space-y-3">
              {dashboard.anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="flex items-start justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-700"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold dark:text-white">
                      {anomaly.anomalyType}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {anomaly.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      anomaly.severity === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : anomaly.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}
                  >
                    {anomaly.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
