'use client';

import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

export interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  previousValue: number;
  percentChange: number;
  sparklineData: number[];
  isPositive: boolean; // True = higher is better
  format?: 'number' | 'currency' | 'percentage';
  precision?: number;
}

interface PerformanceCardProps {
  metric: PerformanceMetric;
  loading?: boolean;
  className?: string;
}

export default function PerformanceCard({
  metric,
  loading = false,
  className = '',
}: PerformanceCardProps) {
  const {
    label,
    value,
    unit,
    previousValue,
    percentChange,
    sparklineData,
    isPositive,
    format = 'number',
    precision = 0,
  } = metric;

  // Format value based on type
  const formattedValue = useMemo(() => {
    if (format === 'currency') {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(value);
    }

    if (format === 'percentage') {
      return `${value.toFixed(precision)}%`;
    }

    // Number format
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(precision);
  }, [value, format, precision]);

  const formattedPreviousValue = useMemo(() => {
    if (format === 'currency') {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(previousValue);
    }

    if (format === 'percentage') {
      return `${previousValue.toFixed(precision)}%`;
    }

    return previousValue.toLocaleString();
  }, [previousValue, format, precision]);

  // Determine if change is good or bad
  const isGoodChange = useMemo(() => {
    if (percentChange === 0) return null;
    if (isPositive) {
      return percentChange > 0;
    }
    return percentChange < 0;
  }, [percentChange, isPositive]);

  // Get trend icon
  const TrendIcon = useMemo(() => {
    if (percentChange === 0) return Minus;
    return percentChange > 0 ? ArrowUp : ArrowDown;
  }, [percentChange]);

  // Get color classes based on change
  const changeColorClass = useMemo(() => {
    if (isGoodChange === null) return 'text-gray-500 dark:text-gray-400';
    return isGoodChange
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  }, [isGoodChange]);

  const bgColorClass = useMemo(() => {
    if (isGoodChange === null) return 'bg-gray-50 dark:bg-gray-800';
    return isGoodChange
      ? 'bg-green-50 dark:bg-green-900/20'
      : 'bg-red-50 dark:bg-red-900/20';
  }, [isGoodChange]);

  const sparklineColor = useMemo(() => {
    if (isGoodChange === null) return '#6b7280';
    return isGoodChange ? '#10b981' : '#ef4444';
  }, [isGoodChange]);

  // Transform sparkline data for Recharts
  const chartData = useMemo(() => {
    return sparklineData.map((value, index) => ({
      index,
      value,
    }));
  }, [sparklineData]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-md ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </h3>
        {isGoodChange !== null && (
          <div className={`p-1 rounded ${bgColorClass}`}>
            {isGoodChange ? (
              <TrendingUp className={`w-4 h-4 ${changeColorClass}`} />
            ) : (
              <TrendingDown className={`w-4 h-4 ${changeColorClass}`} />
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {formattedValue}
          </span>
          {unit && format !== 'currency' && format !== 'percentage' && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex items-center gap-1 text-sm font-medium ${changeColorClass}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{Math.abs(percentChange).toFixed(1)}%</span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          vs {formattedPreviousValue}
        </div>
      </div>

      {/* Sparkline */}
      {sparklineData.length > 0 && (
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={sparklineColor}
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trend description */}
      {sparklineData.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {isGoodChange === true && 'Trending up'}
          {isGoodChange === false && 'Trending down'}
          {isGoodChange === null && 'No change'}
        </div>
      )}
    </div>
  );
}

// Export a group of performance cards
interface PerformanceCardsGridProps {
  metrics: PerformanceMetric[];
  loading?: boolean;
  columns?: 2 | 3 | 4 | 6;
}

export function PerformanceCardsGrid({
  metrics,
  loading = false,
  columns = 3,
}: PerformanceCardsGridProps) {
  const gridColsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns];

  return (
    <div className={`grid ${gridColsClass} gap-6`}>
      {loading
        ? Array.from({ length: columns }).map((_, i) => (
            <PerformanceCard
              key={i}
              metric={{
                label: '',
                value: 0,
                unit: '',
                previousValue: 0,
                percentChange: 0,
                sparklineData: [],
                isPositive: true,
              }}
              loading={true}
            />
          ))
        : metrics.map((metric, index) => (
            <PerformanceCard key={index} metric={metric} />
          ))}
    </div>
  );
}

// Utility function to create a metric
export function createMetric(
  label: string,
  value: number,
  previousValue: number,
  sparklineData: number[] = [],
  options: {
    unit?: string;
    isPositive?: boolean;
    format?: 'number' | 'currency' | 'percentage';
    precision?: number;
  } = {}
): PerformanceMetric {
  const {
    unit = '',
    isPositive = true,
    format = 'number',
    precision = 0,
  } = options;

  const percentChange =
    previousValue === 0
      ? value > 0
        ? 100
        : 0
      : ((value - previousValue) / previousValue) * 100;

  return {
    label,
    value,
    unit,
    previousValue,
    percentChange,
    sparklineData,
    isPositive,
    format,
    precision,
  };
}
