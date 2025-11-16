'use client';

/**
 * KPI Card Component
 *
 * Displays a key performance indicator with trend information,
 * sparkline chart, and comparison to previous period.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: number; // Percentage change
  previousValue?: string | number;
  icon?: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  loading?: boolean;
  sparklineData?: number[];
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export default function KPICard({
  title,
  value,
  trend,
  previousValue,
  icon,
  format = 'number',
  loading = false,
  sparklineData,
  color = 'blue'
}: KPICardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="w-4 h-4" />;
    return trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-gray-500';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getColorClasses = () => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      red: 'bg-red-50 border-red-200 text-red-900',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900'
    };
    return colors[color];
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-6 shadow-sm transition-all hover:shadow-md ${getColorClasses()}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
        </div>
        {icon && <div className="opacity-50">{icon}</div>}
      </div>

      <div className="mb-2">
        <p className="text-3xl font-bold">{formatValue(value)}</p>
      </div>

      <div className="flex items-center justify-between">
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {Math.abs(trend).toFixed(1)}%
            </span>
          </div>
        )}

        {previousValue !== undefined && (
          <p className="text-xs opacity-60">
            vs {formatValue(previousValue)}
          </p>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4">
          <Sparkline data={sparklineData} color={color} />
        </div>
      )}
    </div>
  );
}

/**
 * Simple Sparkline Chart Component
 */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range > 0 ? ((max - value) / range) * 100 : 50;
    return `${x},${y}`;
  }).join(' ');

  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    purple: '#8b5cf6'
  };

  return (
    <svg
      className="w-full h-12"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke={colorMap[color]}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
