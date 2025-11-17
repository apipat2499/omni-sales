'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import DateRangePicker, { DateRange } from '@/components/ui/DateRangePicker';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

async function fetchSalesReport(from: Date | null, to: Date | null) {
  const params = new URLSearchParams();
  if (from) params.set('from', from.toISOString());
  if (to) params.set('to', to.toISOString());

  const response = await fetch(`/api/reports/sales?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sales report');
  }
  return response.json();
}

export default function SalesReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-report', dateRange],
    queryFn: () => fetchSalesReport(dateRange.from, dateRange.to),
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const handleExportCSV = () => {
    if (!data) return;

    const csvContent = [
      ['Sales Report'],
      [`Period: ${dateRange.from?.toLocaleDateString()} - ${dateRange.to?.toLocaleDateString()}`],
      [],
      ['Summary'],
      ['Total Revenue', data.summary.totalRevenue],
      ['Total Orders', data.summary.totalOrders],
      ['Total Customers', data.summary.totalCustomers],
      ['Average Order Value', data.summary.averageOrderValue],
      [],
      ['Daily Breakdown'],
      ['Date', 'Revenue', 'Orders', 'Customers'],
      ...data.dailyData.map((d: any) => [d.date, d.revenue, d.orders, d.customers]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales-report-${Date.now()}.csv`;
    link.click();
  };

  if (isLoading) {
    return <SkeletonLoader type="card" count={3} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">เกิดข้อผิดพลาดในการโหลดรายงาน</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">รายงานยอดขาย</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            วิเคราะห์ยอดขายและประสิทธิภาพ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <p className="text-sm opacity-90">รายได้รวม</p>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(data.summary.totalRevenue)}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <p className="text-sm opacity-90">คำสั่งซื้อทั้งหมด</p>
              </div>
              <p className="text-3xl font-bold">{data.summary.totalOrders.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
                <p className="text-sm opacity-90">ลูกค้า</p>
              </div>
              <p className="text-3xl font-bold">{data.summary.totalCustomers.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <p className="text-sm opacity-90">มูลค่าเฉลี่ย/ออเดอร์</p>
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(data.summary.averageOrderValue)}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                รายได้รายวัน
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
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
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    name="รายได้"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Orders Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                คำสั่งซื้อรายวัน
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#F9FAFB',
                    }}
                  />
                  <Bar dataKey="orders" fill="#10B981" radius={[8, 8, 0, 0]} name="คำสั่งซื้อ" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
