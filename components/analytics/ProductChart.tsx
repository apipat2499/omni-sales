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
  PieChart,
  Pie,
} from 'recharts';
import type { ProductData } from '@/lib/hooks/useAnalyticsDashboard';
import { Package, TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';

interface ProductChartProps {
  data: ProductData[];
  loading?: boolean;
}

type ViewMode = 'revenue' | 'units' | 'margin';
type SortBy = 'revenue' | 'units' | 'margin' | 'name';
type ChartView = 'bar' | 'table';

export default function ProductChart({ data, loading = false }: ProductChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [sortBy, setSortBy] = useState<SortBy>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState(10);
  const [chartView, setChartView] = useState<ChartView>('bar');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'revenue':
          comparison = a.revenue - b.revenue;
          break;
        case 'units':
          comparison = a.units - b.units;
          break;
        case 'margin':
          comparison = a.margin - b.margin;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered.slice(0, limit);
  }, [data, sortBy, sortOrder, limit, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(data.map((p) => p.category));
    return Array.from(cats);
  }, [data]);

  // Chart data
  const chartData = useMemo(() => {
    return processedData.map((p) => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      fullName: p.name,
      revenue: p.revenue,
      units: p.units,
      margin: p.margin,
      marginPercent: p.marginPercent,
      category: p.category,
      trend: p.trend,
    }));
  }, [processedData]);

  // Get color based on trend
  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Get trend icon
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {data.fullName}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Revenue:</span>
              <span className="font-semibold text-blue-600">
                ฿{data.revenue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Units:</span>
              <span className="font-semibold text-green-600">
                {data.units.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Margin:</span>
              <span className="font-semibold text-orange-600">
                ฿{data.margin.toLocaleString()} ({data.marginPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Category:</span>
              <span className="text-gray-900 dark:text-white">{data.category}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Toggle sort
  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Performance
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Top performing products by revenue, units, and margin
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('revenue')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'revenue'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setViewMode('units')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'units'
                  ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Units
            </button>
            <button
              onClick={() => setViewMode('margin')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                viewMode === 'margin'
                  ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Margin
            </button>
          </div>

          {/* Limit */}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setChartView('bar')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            chartView === 'bar'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          Chart View
        </button>
        <button
          onClick={() => setChartView('table')}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            chartView === 'table'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          Table View
        </button>
      </div>

      {/* Chart or Table */}
      {chartView === 'bar' ? (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {viewMode === 'revenue' && (
                <Bar dataKey="revenue" name="Revenue (฿)" fill="#3b82f6">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTrendColor(entry.trend)} />
                  ))}
                </Bar>
              )}
              {viewMode === 'units' && (
                <Bar dataKey="units" name="Units Sold" fill="#10b981">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTrendColor(entry.trend)} />
                  ))}
                </Bar>
              )}
              {viewMode === 'margin' && (
                <Bar dataKey="margin" name="Margin (฿)" fill="#f59e0b">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getTrendColor(entry.trend)} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white hover:text-blue-600"
                  >
                    Product
                    {sortBy === 'name' && <ArrowUpDown className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('revenue')}
                    className="flex items-center gap-1 ml-auto font-semibold text-gray-900 dark:text-white hover:text-blue-600"
                  >
                    Revenue
                    {sortBy === 'revenue' && <ArrowUpDown className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('units')}
                    className="flex items-center gap-1 ml-auto font-semibold text-gray-900 dark:text-white hover:text-blue-600"
                  >
                    Units
                    {sortBy === 'units' && <ArrowUpDown className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">Avg Price</th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('margin')}
                    className="flex items-center gap-1 ml-auto font-semibold text-gray-900 dark:text-white hover:text-blue-600"
                  >
                    Margin %
                    {sortBy === 'margin' && <ArrowUpDown className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {processedData.map((product, index) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-600">
                    ฿{product.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    {product.units.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                    ฿{product.averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold ${
                        product.marginPercent > 30
                          ? 'text-green-600'
                          : product.marginPercent < 15
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }`}
                    >
                      {product.marginPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <TrendIcon trend={product.trend} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
