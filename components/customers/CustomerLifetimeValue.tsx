'use client';

import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Activity,
  Target,
} from 'lucide-react';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomerLifetimeValueProps {
  customerId: number;
}

async function fetchCLV(customerId: number) {
  const response = await fetch(`/api/customers/${customerId}/lifetime-value`);
  if (!response.ok) {
    throw new Error('Failed to fetch CLV data');
  }
  return response.json();
}

export default function CustomerLifetimeValue({ customerId }: CustomerLifetimeValueProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-clv', customerId],
    queryFn: () => fetchCLV(customerId),
    staleTime: 60 * 1000, // 1 minute
  });

  if (isLoading) {
    return <SkeletonLoader type="card" count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">เกิดข้อผิดพลาดในการโหลดข้อมูล CLV</p>
      </div>
    );
  }

  const clv = data.clv;
  const orders = data.orders || [];

  // Prepare chart data
  const chartData = orders.map((order: any) => ({
    date: new Date(order.date).toLocaleDateString('th-TH', {
      month: 'short',
      day: 'numeric',
    }),
    revenue: order.cumulativeRevenue,
  }));

  return (
    <div className="space-y-6">
      {/* CLV Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
            <p className="text-sm opacity-90">รายได้รวมทั้งหมด</p>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(clv.totalRevenue)}</p>
        </div>

        {/* Predicted CLV */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Target className="h-6 w-6" />
            </div>
            <p className="text-sm opacity-90">CLV คาดการณ์ (2 ปี)</p>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(clv.predictedLifetimeValue)}</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-sm opacity-90">มูลค่าเฉลี่ยต่อออเดอร์</p>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(clv.averageOrderValue)}</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">คำสั่งซื้อทั้งหมด</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {clv.totalOrders}
          </p>
        </div>

        {/* Order Frequency */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">ความถี่ (ต่อเดือน)</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {clv.orderFrequency.toFixed(1)}
          </p>
        </div>

        {/* Days Active */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">เป็นลูกค้ามา</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {clv.daysSinceFirstOrder} วัน
          </p>
        </div>
      </div>

      {/* Revenue Growth Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            การเติบโตของรายได้สะสม
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F9FAFB',
                }}
                formatter={(value: any) => formatCurrency(value)}
                labelFormatter={(label) => `วันที่: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                name="รายได้สะสม"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ข้อมูลเชิงลึก
            </h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>
                • ลูกค้าเป็นสมาชิกมา {clv.daysSinceFirstOrder} วัน (
                {(clv.daysSinceFirstOrder / 30).toFixed(1)} เดือน)
              </li>
              <li>
                • ซื้อเฉลี่ย {clv.orderFrequency.toFixed(2)} ครั้งต่อเดือน
              </li>
              <li>
                • มูลค่าเฉลี่ยต่อคำสั่งซื้อ {formatCurrency(clv.averageOrderValue)}
              </li>
              {clv.predictedLifetimeValue > clv.totalRevenue && (
                <li className="font-medium">
                  • คาดว่าจะสร้างรายได้เพิ่มอีก{' '}
                  {formatCurrency(clv.predictedLifetimeValue - clv.totalRevenue)} ในอีก 2 ปีข้างหน้า
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
