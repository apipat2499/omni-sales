'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import { mockAnalytics, getOrderStats } from '@/lib/admin/mockData';
import { formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  Globe,
  Store,
  Phone,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

export default function AdminAnalyticsPage() {
  const stats = getOrderStats();

  // Prepare revenue chart data
  const revenueData = mockAnalytics.revenue.labels.map((label, index) => ({
    month: label,
    revenue: mockAnalytics.revenue.data[index],
  }));

  // Prepare channel data for pie chart
  const channelData = mockAnalytics.ordersByChannel.map((channel) => ({
    name: channel.channel,
    value: channel.count,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ภาพรวมและวิเคราะห์ข้อมูลธุรกิจ
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="green"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Total Orders"
            value={stats.total}
            icon={ShoppingCart}
            color="blue"
            trend={{ value: 8.3, isPositive: true }}
          />
          <StatCard
            title="Total Customers"
            value={mockAnalytics.customerStats.total}
            icon={Users}
            color="purple"
            trend={{ value: 15.2, isPositive: true }}
          />
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(mockAnalytics.customerStats.avgOrderValue)}
            icon={TrendingUp}
            color="yellow"
            trend={{ value: 5.1, isPositive: true }}
          />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Revenue Trend (6 Months)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="month"
                  className="text-gray-600 dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-gray-600 dark:text-gray-400"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by Channel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Orders by Channel
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Channel Stats */}
            <div className="mt-6 space-y-3">
              {mockAnalytics.ordersByChannel.map((channel, index) => {
                const icons = {
                  Online: Globe,
                  Offline: Store,
                  Phone: Phone,
                };
                const Icon = icons[channel.channel as keyof typeof icons] || Package;

                return (
                  <div
                    key={channel.channel}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: COLORS[index] + '20' }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: COLORS[index] }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {channel.channel}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {channel.count} orders
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {channel.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Top Products
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAnalytics.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="name"
                    className="text-gray-600 dark:text-gray-400"
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    className="text-gray-600 dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="sales" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products List */}
            <div className="mt-6 space-y-2">
              {mockAnalytics.topProducts.slice(0, 3).map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {product.sales} sales
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Customer Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Total Customers
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {mockAnalytics.customerStats.total.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                <div className="text-sm font-medium text-green-900 dark:text-green-200">
                  New Customers
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {mockAnalytics.customerStats.new}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                This month
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <div className="text-sm font-medium text-purple-900 dark:text-purple-200">
                  Returning Customers
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {mockAnalytics.customerStats.returning.toLocaleString()}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                {(
                  (mockAnalytics.customerStats.returning /
                    mockAnalytics.customerStats.total) *
                  100
                ).toFixed(1)}
                % retention rate
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
