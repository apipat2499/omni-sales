'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/RouteGuard';
import { formatCurrency } from '@/lib/utils';
import { useOrdersSWR } from '@/lib/hooks/useOrdersSWR';
import { useProductsSWR } from '@/lib/hooks/useProductsSWR';
import { useCustomers } from '@/lib/hooks/useCustomers';
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
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Download,
  Loader2,
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { bulkExportToCSV } from '@/lib/utils/bulk-operations';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const { orders, loading: ordersLoading } = useOrdersSWR();
  const { products, loading: productsLoading } = useProductsSWR();
  const { customers, loading: customersLoading } = useCustomers();

  const [dateRange, setDateRange] = useState(30);
  const loading = ordersLoading || productsLoading || customersLoading;

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const startDate = startOfDay(subDays(new Date(), dateRange));
    return orders.filter((order) => new Date(order.createdAt) >= startDate);
  }, [orders, dateRange]);

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    // Previous period comparison
    const previousStartDate = startOfDay(subDays(new Date(), dateRange * 2));
    const previousEndDate = startOfDay(subDays(new Date(), dateRange));
    const previousOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= previousStartDate && orderDate < previousEndDate;
    });
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders: filteredOrders.length,
      avgOrderValue,
      totalCustomers: customers.length,
      revenueGrowth,
    };
  }, [filteredOrders, orders, customers, dateRange]);

  // Sales by date
  const salesByDate = useMemo(() => {
    const dateMap = new Map<string, number>();
    filteredOrders.forEach((order) => {
      const date = format(new Date(order.createdAt), 'yyyy-MM-dd');
      dateMap.set(date, (dateMap.get(date) || 0) + order.total);
    });

    const result = [];
    for (let i = dateRange - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      result.push({
        date: format(subDays(new Date(), i), 'dd MMM', { locale: th }),
        revenue: dateMap.get(date) || 0,
      });
    }
    return result;
  }, [filteredOrders, dateRange]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const statusCount = new Map<string, number>();
    filteredOrders.forEach((order) => {
      statusCount.set(order.status, (statusCount.get(order.status) || 0) + 1);
    });
    return Array.from(statusCount.entries()).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [filteredOrders]);

  // Sales by channel
  const salesByChannel = useMemo(() => {
    const channelRevenue = new Map<string, number>();
    filteredOrders.forEach((order) => {
      channelRevenue.set(order.channel, (channelRevenue.get(order.channel) || 0) + order.total);
    });
    return Array.from(channelRevenue.entries()).map(([channel, revenue]) => ({
      name: channel.charAt(0).toUpperCase() + channel.slice(1),
      revenue,
    }));
  }, [filteredOrders]);

  // Top products
  const topProducts = useMemo(() => {
    const productSales = new Map<string, { count: number; revenue: number }>();
    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productSales.get(item.product) || { count: 0, revenue: 0 };
        productSales.set(item.product, {
          count: current.count + item.quantity,
          revenue: current.revenue + item.price * item.quantity,
        });
      });
    });
    return Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // Payment methods
  const paymentMethods = useMemo(() => {
    const methodCount = new Map<string, number>();
    filteredOrders.forEach((order) => {
      methodCount.set(order.paymentMethod, (methodCount.get(order.paymentMethod) || 0) + 1);
    });
    return Array.from(methodCount.entries()).map(([method, count]) => ({
      name: method.replace('_', ' ').toUpperCase(),
      value: count,
    }));
  }, [filteredOrders]);

  // Export
  const handleExport = () => {
    const exportData = filteredOrders.map((order) => ({
      orderId: order.id,
      date: format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      customer: order.customerName,
      status: order.status,
      channel: order.channel,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      itemsCount: order.items.length,
    }));

    bulkExportToCSV(exportData, 'analytics-report', [
      { key: 'orderId', label: 'Order ID' },
      { key: 'date', label: 'Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'status', label: 'Status' },
      { key: 'channel', label: 'Channel' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'tax', label: 'Tax' },
      { key: 'shipping', label: 'Shipping' },
      { key: 'total', label: 'Total' },
      { key: 'itemsCount', label: 'Items Count' },
    ]);
  };

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                ภาพรวมและสถิติการขาย
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(kpis.totalRevenue)}
                  </p>
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                      kpis.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    <TrendingUp className="h-3 w-3" />
                    {kpis.revenueGrowth >= 0 ? '+' : ''}
                    {kpis.revenueGrowth.toFixed(1)}% vs previous period
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {kpis.totalOrders}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last {dateRange} days
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(kpis.avgOrderValue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per order</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {kpis.totalCustomers}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue Trend
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Orders by Status
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top 5 Products
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? formatCurrency(value) : value
                    }
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sales by Channel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sales by Channel
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByChannel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Methods Distribution
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {paymentMethods.map((method, index) => (
                <div key={method.name} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{method.name}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{method.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {((method.value / filteredOrders.length) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
