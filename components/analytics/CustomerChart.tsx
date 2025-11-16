'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Treemap,
  PieChart,
  Pie,
} from 'recharts';
import type { CustomerSegment } from '@/lib/hooks/useAnalyticsDashboard';
import { Users, TrendingUp, Award, RefreshCw } from 'lucide-react';

interface CustomerChartProps {
  data: CustomerSegment[];
  loading?: boolean;
}

type ViewMode = 'treemap' | 'bar' | 'pie';

export default function CustomerChart({ data, loading = false }: CustomerChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('bar');

  // Calculate totals
  const totals = useMemo(() => {
    const totalCustomers = data.reduce((sum, seg) => sum + seg.count, 0);
    const totalValue = data.reduce((sum, seg) => sum + seg.value, 0);
    const avgCLV = totalCustomers > 0 ? totalValue / totalCustomers : 0;
    const avgRetention =
      data.length > 0
        ? data.reduce((sum, seg) => sum + seg.retention, 0) / data.length
        : 0;

    return {
      totalCustomers,
      totalValue,
      avgCLV,
      avgRetention,
    };
  }, [data]);

  // Treemap data
  const treemapData = useMemo(() => {
    return data.map((segment) => ({
      name: segment.name,
      size: segment.value,
      count: segment.count,
      clv: segment.clv,
      retention: segment.retention,
      color: segment.color || '#3b82f6',
    }));
  }, [data]);

  // Custom treemap content
  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, size, count, color } = props;

    if (width < 80 || height < 60) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: '#fff',
            strokeWidth: 2,
          }}
        />
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="#fff"
          fontSize={14}
          fontWeight="bold"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 8}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
        >
          {count} customers
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 24}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
        >
          ฿{size.toLocaleString()}
        </text>
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {data.name}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Customers:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {data.count?.toLocaleString() || data.size?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
              <span className="font-semibold text-blue-600">
                ฿{(data.value || data.size)?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">CLV:</span>
              <span className="font-semibold text-green-600">
                ฿{data.clv?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Retention:</span>
              <span className="font-semibold text-orange-600">
                {data.retention?.toFixed(1)}%
              </span>
            </div>
          </div>
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
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mb-4" />
          <p>No customer data available</p>
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
            <Users className="w-5 h-5" />
            Customer Segments
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Customer segmentation and lifetime value analysis
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'bar'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setViewMode('pie')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'pie'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Pie Chart
            </button>
            <button
              onClick={() => setViewMode('treemap')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'treemap'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Treemap
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-600 dark:text-blue-400">Total Customers</p>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {totals.totalCustomers.toLocaleString()}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-xs text-green-600 dark:text-green-400">Total Value</p>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            ฿{totals.totalValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <p className="text-xs text-orange-600 dark:text-orange-400">Avg CLV</p>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            ฿{totals.avgCLV.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <p className="text-xs text-purple-600 dark:text-purple-400">Avg Retention</p>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {totals.avgRetention.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="count" name="Customers" fill="#3b82f6" />
              <Bar dataKey="value" name="Total Value (฿)" fill="#10b981" />
            </BarChart>
          ) : viewMode === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.count}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          ) : (
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8884d8"
              content={<CustomTreemapContent />}
            />
          )}
        </ResponsiveContainer>
      </div>

      {/* Segment Details */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Segment Breakdown
        </h3>
        <div className="space-y-4">
          {data.map((segment, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {segment.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {segment.count.toLocaleString()} customers
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Total Value
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ฿{segment.value.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    CLV
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ฿{segment.clv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Retention
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {segment.retention.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress bar for value percentage */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(segment.value / totals.totalValue) * 100}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {((segment.value / totals.totalValue) * 100).toFixed(1)}% of total value
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Key Insights
        </h3>
        <div className="space-y-2 text-sm">
          {data.length > 0 && (
            <>
              <p className="text-gray-600 dark:text-gray-400">
                • Your highest value segment is <strong>{data[0]?.name}</strong> with{' '}
                <strong>{data[0]?.count}</strong> customers generating{' '}
                <strong>฿{data[0]?.value.toLocaleString()}</strong>
              </p>
              {data[0]?.retention > 70 && (
                <p className="text-green-600 dark:text-green-400">
                  • High retention rate of <strong>{data[0]?.retention.toFixed(1)}%</strong> in{' '}
                  {data[0]?.name} segment indicates strong customer loyalty
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400">
                • Average customer lifetime value is{' '}
                <strong>฿{totals.avgCLV.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
