'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, getStatusColor, getChannelColor } from '@/lib/utils';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useOrders } from '@/lib/hooks/useOrders';
import { useAuth } from '@/lib/auth/AuthContext';
import { DemoPill } from '@/components/DemoPill';

export default function RecentOrders() {
  const { orders, loading } = useOrders();
  const recentOrders = orders.slice(0, 5);
  const { supabaseReady } = useAuth();
  const isDemo = !supabaseReady;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">คำสั่งซื้อล่าสุด</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            รายการคำสั่งซื้อล่าสุดในระบบ
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && <DemoPill />}
          <Link
            href="/orders"
            className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400"
          >
            ดูทั้งหมด
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                รหัสออเดอร์
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ลูกค้า
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ช่องทาง
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ยอดรวม
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                วันที่
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && supabaseReady ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="animate-pulse text-gray-400">กำลังโหลดข้อมูล...</div>
                </td>
              </tr>
            ) : recentOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  ยังไม่มีคำสั่งซื้อ
                </td>
              </tr>
            ) : (
              recentOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  #{order.id.toUpperCase()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                  {order.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getChannelColor(order.channel)}`}>
                    {order.channel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(order.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {format(order.createdAt, 'dd MMM yyyy', { locale: th })}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
