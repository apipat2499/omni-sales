'use client';

import { useState, useMemo } from 'react';
import { useAnalyticsDashboard, type DateRangePreset } from '@/lib/hooks/useAnalyticsDashboard';
import { PerformanceCardsGrid } from './PerformanceCard';
import SalesChart from './SalesChart';
import ProductChart from './ProductChart';
import RevenueChart from './RevenueChart';
import CustomerChart from './CustomerChart';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Download,
  RefreshCw,
  Calendar,
  FileText,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { format, subDays, subMonths, startOfYear } from 'date-fns';

type TabType = 'overview' | 'sales' | 'products' | 'customers' | 'revenue';

export default function AnalyticsDashboard() {
  const {
    metrics,
    salesData,
    productData,
    categoryData,
    customerSegments,
    dateRange,
    compareEnabled,
    isLoading,
    error,
    updateDateRange,
    setPresetDateRange,
    setCompareEnabled,
    exportData,
    generatePDFReport,
    refresh,
  } = useAnalyticsDashboard();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Format date range display
  const dateRangeDisplay = useMemo(() => {
    return `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
  }, [dateRange]);

  // Preset options
  const presetOptions: { label: string; value: DateRangePreset }[] = [
    { label: 'Last 7 days', value: 'last7days' },
    { label: 'Last 30 days', value: 'last30days' },
    { label: 'Last 90 days', value: 'last90days' },
    { label: 'Year to date', value: 'ytd' },
    { label: 'Last 12 months', value: 'last12months' },
    { label: 'Custom', value: 'custom' },
  ];

  // Handle preset change
  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setShowDatePicker(true);
    } else {
      setPresetDateRange(preset);
      setShowDatePicker(false);
    }
  };

  // Tabs configuration
  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: BarChart3,
      description: 'Key metrics and overall performance',
    },
    {
      id: 'sales' as TabType,
      label: 'Sales Analysis',
      icon: TrendingUp,
      description: 'Sales trends and performance',
    },
    {
      id: 'products' as TabType,
      label: 'Products',
      icon: Package,
      description: 'Product performance and rankings',
    },
    {
      id: 'customers' as TabType,
      label: 'Customers',
      icon: Users,
      description: 'Customer segments and lifetime value',
    },
    {
      id: 'revenue' as TabType,
      label: 'Revenue',
      icon: DollarSign,
      description: 'Revenue distribution and breakdown',
    },
  ];

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-800 dark:text-red-200 font-semibold mb-2">
              Error Loading Analytics
            </p>
            <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track performance and gain insights into your business
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Range Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{dateRangeDisplay}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Date Picker Dropdown */}
                {showDatePicker && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Select Period
                      </h3>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {presetOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handlePresetChange(option.value)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            dateRange.preset === option.value
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Compare Toggle */}
              <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={compareEnabled}
                  onChange={(e) => setCompareEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Compare Periods
                </span>
              </label>

              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Export</span>
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-20">
                    <button
                      onClick={() => {
                        exportData('csv');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        exportData('json');
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => {
                        generatePDFReport();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Generate PDF Report
                    </button>
                  </div>
                )}
              </div>

              {/* Refresh */}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Cards */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Key Performance Metrics
              </h2>
              <PerformanceCardsGrid metrics={metrics} loading={isLoading} columns={3} />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalesChart data={salesData} showComparison={compareEnabled} loading={isLoading} />
              <RevenueChart data={categoryData} loading={isLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductChart data={productData} loading={isLoading} />
              <CustomerChart data={customerSegments} loading={isLoading} />
            </div>
          </div>
        )}

        {/* Sales Analysis Tab */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sales Performance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Analyze sales trends, patterns, and performance over time
              </p>
            </div>

            {/* Sales Metrics */}
            <PerformanceCardsGrid
              metrics={metrics.slice(0, 4)}
              loading={isLoading}
              columns={4}
            />

            {/* Sales Chart */}
            <SalesChart data={salesData} showComparison={compareEnabled} loading={isLoading} />

            {/* Additional Sales Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Sales by Day of Week
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    Analysis coming soon...
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Peak Hours
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    Analysis coming soon...
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Growth Rate
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    Analysis coming soon...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Product Performance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Track product sales, rankings, and performance metrics
              </p>
            </div>

            <ProductChart data={productData} loading={isLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={categoryData} loading={isLoading} />

              {/* Top Products Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top 5 Products
                </h3>
                <div className="space-y-3">
                  {productData.slice(0, 5).map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {product.units} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          ฿{product.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {product.marginPercent.toFixed(1)}% margin
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Customer Analytics
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Understand customer behavior, segments, and lifetime value
              </p>
            </div>

            {/* Customer Metrics */}
            <PerformanceCardsGrid
              metrics={[metrics[4], metrics[5]]}
              loading={isLoading}
              columns={2}
            />

            <CustomerChart data={customerSegments} loading={isLoading} />

            {/* Customer Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Customer Acquisition
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      New Customers
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Coming soon
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Acquisition Cost
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Coming soon
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Customer Retention
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Churn Rate
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Coming soon
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Repeat Purchase Rate
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Coming soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Revenue Analysis
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Analyze revenue composition, trends, and forecasts
              </p>
            </div>

            {/* Revenue Metrics */}
            <PerformanceCardsGrid
              metrics={[metrics[0], metrics[2]]}
              loading={isLoading}
              columns={2}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart data={categoryData} loading={isLoading} />
              <SalesChart data={salesData} showComparison={compareEnabled} loading={isLoading} />
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    By Category
                  </p>
                  <div className="space-y-2">
                    {categoryData.slice(0, 3).map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {cat.name}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: cat.color }}>
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    By Payment Method
                  </p>
                  <p className="text-sm text-gray-500">Coming soon...</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    By Channel
                  </p>
                  <p className="text-sm text-gray-500">Coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
