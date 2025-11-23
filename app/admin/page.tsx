'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import StatusBadge from '@/components/admin/StatusBadge';
import { mockOrders, getOrderStats } from '@/lib/admin/mockData';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  Eye,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function AdminDashboardPage() {
  const stats = getOrderStats();

  // Get recent orders (last 5)
  const recentOrders = [...mockOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ภาพรวมการจัดการร้านค้า
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Orders"
            value={stats.total}
            icon={ShoppingCart}
            color="blue"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="green"
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            title="New Orders"
            value={stats.newOrders}
            icon={Package}
            color="yellow"
          />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={TrendingUp}
            color="purple"
            trend={{ value: 15.3, isPositive: true }}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/orders"
              className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  View All Orders
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {stats.total} total orders
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-green-900 dark:text-green-200">
                  Manage Products
                </div>
                <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Update inventory
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/analytics"
              className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors group"
            >
              <div>
                <div className="text-sm font-medium text-purple-900 dark:text-purple-200">
                  View Analytics
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Revenue & insights
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View All
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-300">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.items.length} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(order.createdAt), 'dd MMM yyyy', {
                        locale: th,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
