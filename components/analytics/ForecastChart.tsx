'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ForecastChartProps {
  historical: {
    dates: string[];
    revenue: number[];
    orders: number[];
  };
  forecast: {
    dates: string[];
    revenue: number[];
    orders: number[];
  };
  trends: {
    revenue: string;
    revenueSlope: number;
    orders: string;
    orderSlope: number;
  };
  projections: {
    nextWeekRevenue: number;
    nextMonthRevenue: number;
    nextWeekOrders: number;
    nextMonthOrders: number;
  };
}

export default function ForecastChart({ historical, forecast, trends, projections }: ForecastChartProps) {
  // Combine historical and forecast data
  const combinedData = [
    ...historical.dates.map((date, i) => ({
      date: new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
      actualRevenue: historical.revenue[i],
      forecastRevenue: null,
      type: 'historical',
    })),
    ...forecast.dates.map((date, i) => ({
      date: new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
      actualRevenue: null,
      forecastRevenue: forecast.revenue[i],
      type: 'forecast',
    })),
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (trend === 'decreasing') return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'increasing') return 'text-green-600 dark:text-green-400';
    if (trend === 'decreasing') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Projections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              คาดการณ์สัปดาห์หน้า
            </h4>
            {getTrendIcon(trends.revenue)}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(projections.nextWeekRevenue)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ~{projections.nextWeekOrders} คำสั่งซื้อ
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              คาดการณ์เดือนหน้า
            </h4>
            {getTrendIcon(trends.revenue)}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(projections.nextMonthRevenue)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ~{projections.nextMonthOrders} คำสั่งซื้อ
          </p>
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            {getTrendIcon(trends.revenue)}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">แนวโน้มรายได้</p>
              <p className={`text-lg font-semibold ${getTrendColor(trends.revenue)}`}>
                {trends.revenue === 'increasing' ? 'เพิ่มขึ้น' : trends.revenue === 'decreasing' ? 'ลดลง' : 'คงที่'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            {getTrendIcon(trends.orders)}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">แนวโน้มคำสั่งซื้อ</p>
              <p className={`text-lg font-semibold ${getTrendColor(trends.orders)}`}>
                {trends.orders === 'increasing' ? 'เพิ่มขึ้น' : trends.orders === 'decreasing' ? 'ลดลง' : 'คงที่'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          กราฟคาดการณ์ยอดขาย
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedData}>
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
            />
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              formatter={(value) => {
                if (value === 'actualRevenue') return 'ยอดขายจริง';
                return 'ยอดขายคาดการณ์';
              }}
            />
            <ReferenceLine
              x={historical.dates.length - 1}
              stroke="#6B7280"
              strokeDasharray="3 3"
              label={{ value: 'วันนี้', position: 'top', fill: '#6B7280' }}
            />
            <Line
              type="monotone"
              dataKey="actualRevenue"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecastRevenue"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10B981', r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
