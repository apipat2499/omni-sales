'use client';

/**
 * Performance Dashboard Component
 * Comprehensive performance monitoring dashboard with visualizations
 */

import { useEffect, useState, useMemo } from 'react';
import {
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getHistoricalData,
  getPerformanceSummary,
  analyzePerformance,
  getMetricsByName,
  getMetricsInTimeRange,
  clearMetrics,
  exportMetrics,
  type PerformanceMetric,
  type PerformanceAnalysis,
} from '@/lib/utils/performance-metrics';
import { useMemoryMonitoring } from '@/lib/hooks/usePerformanceMonitoring';

interface TimeRange {
  label: string;
  hours: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last Hour', hours: 1 },
  { label: 'Last 6 Hours', hours: 6 },
  { label: 'Last 24 Hours', hours: 24 },
  { label: 'Last 7 Days', hours: 168 },
];

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
};

export default function PerformanceDashboard() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[2]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { memoryInfo, isHighUsage, isCriticalUsage, forceGarbageCollection } =
    useMemoryMonitoring(5000);

  // Load metrics
  useEffect(() => {
    const data = getHistoricalData();
    const now = Date.now();
    const startTime = now - selectedRange.hours * 60 * 60 * 1000;
    const filtered = getMetricsInTimeRange(data.metrics, startTime, now);
    setMetrics(filtered);
  }, [selectedRange, refreshKey]);

  // Analyze metrics
  const analysis = useMemo(() => {
    return {
      render: analyzePerformance(metrics, 'render'),
      api: analyzePerformance(metrics, 'api'),
      memory: analyzePerformance(metrics, 'memory'),
      all: analyzePerformance(metrics),
    };
  }, [metrics]);

  // Prepare chart data
  const chartData = useMemo(() => {
    // Group by time buckets (10 buckets for the time range)
    const bucketCount = 10;
    const bucketSize = (selectedRange.hours * 60 * 60 * 1000) / bucketCount;
    const now = Date.now();
    const startTime = now - selectedRange.hours * 60 * 60 * 1000;

    const buckets = Array.from({ length: bucketCount }, (_, i) => {
      const bucketStart = startTime + i * bucketSize;
      const bucketEnd = bucketStart + bucketSize;

      const bucketMetrics = metrics.filter(
        (m) => m.timestamp >= bucketStart && m.timestamp < bucketEnd
      );

      const renderMetrics = bucketMetrics.filter((m) => m.type === 'render');
      const apiMetrics = bucketMetrics.filter((m) => m.type === 'api');

      return {
        time: new Date(bucketStart).toLocaleTimeString(),
        renders:
          renderMetrics.length > 0
            ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) /
              renderMetrics.length
            : 0,
        api:
          apiMetrics.length > 0
            ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) /
              apiMetrics.length
            : 0,
        memory: bucketMetrics
          .filter((m) => m.memoryUsage)
          .slice(-1)[0]?.memoryUsage?.percentUsed || 0,
      };
    });

    return buckets;
  }, [metrics, selectedRange]);

  // Get slowest operations
  const slowestOperations = useMemo(() => {
    return [...metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }, [metrics]);

  // Get operation distribution
  const operationDistribution = useMemo(() => {
    const grouped = getMetricsByName(metrics);
    return Array.from(grouped.entries())
      .map(([name, ops]) => ({
        name,
        count: ops.length,
        avgDuration: ops.reduce((sum, m) => sum + m.duration, 0) / ops.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [metrics]);

  // Type distribution
  const typeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    metrics.forEach((m) => {
      types[m.type] = (types[m.type] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  }, [metrics]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleClearMetrics = () => {
    if (confirm('Are you sure you want to clear all performance metrics?')) {
      clearMetrics();
      setRefreshKey((k) => k + 1);
    }
  };

  const handleExport = () => {
    const exported = exportMetrics(metrics);
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = getPerformanceSummary();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Performance Monitoring Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time application performance metrics and analysis
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setSelectedRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedRange.label === range.label
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Export
            </button>
            <button
              onClick={handleClearMetrics}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <SummaryCard
            title="Total Metrics"
            value={summary.total.toLocaleString()}
            subtitle={`${summary.last24h} in last 24h`}
            icon="📊"
            color="blue"
          />
          <SummaryCard
            title="Avg Render Time"
            value={`${analysis.render.avgDuration.toFixed(2)}ms`}
            subtitle={`P95: ${analysis.render.p95.toFixed(2)}ms`}
            icon="⚡"
            color={analysis.render.avgDuration > 16 ? 'warning' : 'success'}
          />
          <SummaryCard
            title="Avg API Time"
            value={`${analysis.api.avgDuration.toFixed(2)}ms`}
            subtitle={`P95: ${analysis.api.p95.toFixed(2)}ms`}
            icon="🌐"
            color={analysis.api.avgDuration > 1000 ? 'warning' : 'success'}
          />
          <SummaryCard
            title="Memory Usage"
            value={`${memoryInfo?.percentUsed.toFixed(1)}%`}
            subtitle={`${((memoryInfo?.usedJSHeapSize || 0) / 1024 / 1024).toFixed(1)}MB / ${((memoryInfo?.jsHeapSizeLimit || 0) / 1024 / 1024).toFixed(1)}MB`}
            icon="💾"
            color={
              isCriticalUsage ? 'danger' : isHighUsage ? 'warning' : 'success'
            }
          />
        </div>

        {/* Performance Trends Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Performance Trends
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.2}
              />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="renders"
                stroke={COLORS.primary}
                name="Render Time (ms)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="api"
                stroke={COLORS.success}
                name="API Time (ms)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Memory Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Memory Trend
              </h2>
              <button
                onClick={forceGarbageCollection}
                className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Force GC
              </button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.2}
                />
                <XAxis
                  dataKey="time"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke={COLORS.purple}
                  name="Memory %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Type Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Metric Distribution
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.type}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Slowest Operations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Slowest Operations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                    Name
                  </th>
                  <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                    Duration
                  </th>
                  <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                    Memory Impact
                  </th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {slowestOperations.map((metric) => (
                  <tr
                    key={metric.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          metric.type === 'render'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : metric.type === 'api'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}
                      >
                        {metric.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                      {metric.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-semibold ${
                          metric.duration > 100
                            ? 'text-red-600 dark:text-red-400'
                            : metric.duration > 16
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {metric.duration.toFixed(2)}ms
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {metric.memoryUsage
                        ? `${((metric.memoryUsage.usedJSHeapSize || 0) / 1024 / 1024).toFixed(1)}MB`
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(metric.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Operations by Volume */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Most Frequent Operations
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={operationDistribution}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.2}
              />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="count" fill={COLORS.primary} name="Call Count" />
              <Bar
                dataKey="avgDuration"
                fill={COLORS.teal}
                name="Avg Duration (ms)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Optimization Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Optimization Recommendations
          </h2>
          <div className="space-y-3">
            {analysis.all.recommendations.length > 0 ? (
              analysis.all.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <span className="text-2xl">💡</span>
                  <p className="text-gray-700 dark:text-gray-300 flex-1">
                    {rec}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <span className="text-2xl">✅</span>
                <p className="text-gray-700 dark:text-gray-300">
                  Performance looks good! No critical issues detected.
                </p>
              </div>
            )}

            {/* Additional system recommendations */}
            {isCriticalUsage && (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <span className="text-2xl">⚠️</span>
                <p className="text-gray-700 dark:text-gray-300">
                  Critical memory usage detected! Consider refreshing the page or
                  closing unused tabs.
                </p>
              </div>
            )}

            {analysis.render.slowOperations.length > 5 && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <span className="text-2xl">🐌</span>
                <p className="text-gray-700 dark:text-gray-300">
                  Multiple slow render operations detected. Consider code
                  splitting or lazy loading for heavy components.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: 'blue' | 'success' | 'warning' | 'danger';
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: SummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success:
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning:
      'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  return (
    <div
      className={`rounded-lg border p-6 ${colorClasses[color]} transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
