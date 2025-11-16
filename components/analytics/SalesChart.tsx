'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { SalesDayData } from '@/lib/hooks/useAnalyticsDashboard';
import { Calendar, TrendingUp, BarChart3, Activity } from 'lucide-react';

interface SalesChartProps {
  data: SalesDayData[];
  showComparison?: boolean;
  loading?: boolean;
}

type ChartType = 'area' | 'line' | 'bar';
type TimeGrouping = 'daily' | 'weekly' | 'monthly';

export default function SalesChart({
  data,
  showComparison = false,
  loading = false,
}: SalesChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>('daily');
  const [showOrders, setShowOrders] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showItems, setShowItems] = useState(false);

  // Group data by time period
  const groupedData = useMemo(() => {
    if (timeGrouping === 'daily') return data;

    // For weekly/monthly grouping
    const grouped = new Map<string, SalesDayData>();

    data.forEach((item) => {
      const date = parseISO(item.date);
      let key: string;

      if (timeGrouping === 'weekly') {
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = format(weekStart, 'yyyy-MM-dd');
      } else {
        // Group by month
        key = format(date, 'yyyy-MM');
      }

      if (!grouped.has(key)) {
        grouped.set(key, {
          date: key,
          revenue: 0,
          orders: 0,
          items: 0,
          previousYearRevenue: 0,
        });
      }

      const group = grouped.get(key)!;
      group.revenue += item.revenue;
      group.orders += item.orders;
      group.items += item.items;
      if (item.previousYearRevenue) {
        group.previousYearRevenue = (group.previousYearRevenue || 0) + item.previousYearRevenue;
      }
    });

    return Array.from(grouped.values());
  }, [data, timeGrouping]);

  // Format chart data with formatted dates
  const chartData = useMemo(() => {
    return groupedData.map((item) => {
      let formattedDate: string;

      if (timeGrouping === 'monthly') {
        formattedDate = format(parseISO(item.date + '-01'), 'MMM yyyy');
      } else {
        formattedDate = format(parseISO(item.date), 'MMM dd');
      }

      return {
        ...item,
        formattedDate,
      };
    });
  }, [groupedData, timeGrouping]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = groupedData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = groupedData.reduce((sum, d) => sum + d.orders, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const peakDay = groupedData.reduce(
      (max, d) => (d.revenue > max.revenue ? d : max),
      groupedData[0] || { revenue: 0, date: '' }
    );

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      peakDay,
    };
  }, [groupedData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-semibold">
                {entry.name.includes('Revenue') || entry.name.includes('รายได้')
                  ? `฿${entry.value.toLocaleString()}`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sales Trend Analysis
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Revenue and order trends over time
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Chart Type */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setChartType('area')}
              className={`p-2 rounded transition-colors ${
                chartType === 'area'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Area Chart"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded transition-colors ${
                chartType === 'line'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Line Chart"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded transition-colors ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Time Grouping */}
          <select
            value={timeGrouping}
            onChange={(e) => setTimeGrouping(e.target.value as TimeGrouping)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
            ฿{stats.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Total Orders</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-100">
            {stats.totalOrders.toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Avg Order Value</p>
          <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
            ฿{stats.avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Peak Day</p>
          <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
            {stats.peakDay ? format(parseISO(stats.peakDay.date), 'MMM dd') : 'N/A'}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            ฿{stats.peakDay?.revenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Legend Controls */}
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showRevenue}
            onChange={(e) => setShowRevenue(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Revenue</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showOrders}
            onChange={(e) => setShowOrders(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Orders</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showItems}
            onChange={(e) => setShowItems(e.target.checked)}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-gray-700 dark:text-gray-300">Items</span>
        </label>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="formattedDate"
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showRevenue && (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              )}
              {showOrders && (
                <Area
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorOrders)"
                  yAxisId="right"
                />
              )}
              {showItems && (
                <Area
                  type="monotone"
                  dataKey="items"
                  name="Items"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#colorItems)"
                  yAxisId="right"
                />
              )}
              {showComparison && (
                <Area
                  type="monotone"
                  dataKey="previousYearRevenue"
                  name="Previous Year"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                />
              )}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="formattedDate"
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showRevenue && (
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}
              {showOrders && (
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                  yAxisId="right"
                />
              )}
              {showItems && (
                <Line
                  type="monotone"
                  dataKey="items"
                  name="Items"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  activeDot={{ r: 6 }}
                  yAxisId="right"
                />
              )}
              {showComparison && (
                <Line
                  type="monotone"
                  dataKey="previousYearRevenue"
                  name="Previous Year"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
              )}
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="formattedDate"
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showRevenue && <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" />}
              {showOrders && <Bar dataKey="orders" name="Orders" fill="#10b981" yAxisId="right" />}
              {showItems && <Bar dataKey="items" name="Items" fill="#f59e0b" yAxisId="right" />}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
