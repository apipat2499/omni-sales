'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ForecastChartProps {
  data: Array<{
    date: string;
    actual?: number;
    forecast?: number;
    lower?: number;
    upper?: number;
  }>;
  productName?: string;
  reorderPoint?: number;
  maxStock?: number;
  minStock?: number;
  height?: number;
}

interface ChartConfig {
  showActual: boolean;
  showForecast: boolean;
  showConfidence: boolean;
  showReorderPoint: boolean;
  showMaxStock: boolean;
  showMinStock: boolean;
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between space-x-4 text-sm">
          <span className="flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}:
          </span>
          <span className="font-medium">{entry.value?.toFixed(0) || '-'}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ForecastChart({
  data,
  productName = 'Product',
  reorderPoint,
  maxStock,
  minStock,
  height = 400,
}: ForecastChartProps) {
  // State for chart configuration
  const [config, setConfig] = useState<ChartConfig>({
    showActual: true,
    showForecast: true,
    showConfidence: true,
    showReorderPoint: true,
    showMaxStock: true,
    showMinStock: false,
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleConfig = (key: keyof ChartConfig) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const stats = useMemo(() => {
    if (data.length === 0) {
      return {
        maxValue: 0,
        minValue: 0,
        avgActual: 0,
        avgForecast: 0,
      };
    }

    const actualValues = data.filter(d => d.actual !== undefined).map(d => d.actual!);
    const forecastValues = data.filter(d => d.forecast !== undefined).map(d => d.forecast!);

    const allValues = [
      ...actualValues,
      ...forecastValues,
      ...(reorderPoint ? [reorderPoint] : []),
      ...(maxStock ? [maxStock] : []),
      ...(minStock ? [minStock] : []),
    ];

    return {
      maxValue: Math.max(...allValues, 0),
      minValue: Math.min(...allValues, 0),
      avgActual: actualValues.length > 0
        ? actualValues.reduce((sum, v) => sum + v, 0) / actualValues.length
        : 0,
      avgForecast: forecastValues.length > 0
        ? forecastValues.reduce((sum, v) => sum + v, 0) / forecastValues.length
        : 0,
    };
  }, [data, reorderPoint, maxStock, minStock]);

  const hasActualData = useMemo(() => {
    return data.some(d => d.actual !== undefined);
  }, [data]);

  const hasForecastData = useMemo(() => {
    return data.some(d => d.forecast !== undefined);
  }, [data]);

  const hasConfidenceData = useMemo(() => {
    return data.some(d => d.lower !== undefined && d.upper !== undefined);
  }, [data]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Demand Forecast - {productName}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Historical data and predicted demand over time
          </p>
        </div>

        {/* Legend Toggle */}
        <div className="flex items-center space-x-4">
          {hasActualData && (
            <button
              onClick={() => toggleConfig('showActual')}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                config.showActual
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              Actual
            </button>
          )}
          {hasForecastData && (
            <button
              onClick={() => toggleConfig('showForecast')}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                config.showForecast
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              Forecast
            </button>
          )}
          {hasConfidenceData && (
            <button
              onClick={() => toggleConfig('showConfidence')}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                config.showConfidence
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              Confidence
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200">
        <div>
          <div className="text-xs text-gray-600 mb-1">Avg Actual</div>
          <div className="text-lg font-semibold text-gray-900">
            {stats.avgActual.toFixed(0)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Avg Forecast</div>
          <div className="text-lg font-semibold text-gray-900">
            {stats.avgForecast.toFixed(0)}
          </div>
        </div>
        {reorderPoint && (
          <div>
            <div className="text-xs text-gray-600 mb-1">Reorder Point</div>
            <div className="text-lg font-semibold text-orange-600">
              {reorderPoint.toFixed(0)}
            </div>
          </div>
        )}
        {maxStock && (
          <div>
            <div className="text-xs text-gray-600 mb-1">Max Stock</div>
            <div className="text-lg font-semibold text-red-600">
              {maxStock.toFixed(0)}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={value => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '14px' }} />

              {/* Confidence Interval (Area) */}
              {config.showConfidence && hasConfidenceData && (
                <Area
                  type="monotone"
                  dataKey="upper"
                  stackId="confidence"
                  stroke="none"
                  fill="#c7d2fe"
                  fillOpacity={0.3}
                  name="Upper Bound"
                />
              )}
              {config.showConfidence && hasConfidenceData && (
                <Area
                  type="monotone"
                  dataKey="lower"
                  stackId="confidence"
                  stroke="none"
                  fill="#c7d2fe"
                  fillOpacity={0.3}
                  name="Lower Bound"
                />
              )}

              {/* Actual Demand Line */}
              {config.showActual && hasActualData && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 3 }}
                  name="Actual Demand"
                  connectNulls={false}
                />
              )}

              {/* Forecast Line */}
              {config.showForecast && hasForecastData && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#10b981', r: 3 }}
                  name="Forecasted Demand"
                  connectNulls={false}
                />
              )}

              {/* Reorder Point Line */}
              {config.showReorderPoint && reorderPoint && (
                <ReferenceLine
                  y={reorderPoint}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: 'Reorder Point',
                    position: 'right',
                    fill: '#f59e0b',
                    fontSize: 12,
                  }}
                />
              )}

              {/* Max Stock Line */}
              {config.showMaxStock && maxStock && (
                <ReferenceLine
                  y={maxStock}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: 'Max Stock',
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 12,
                  }}
                />
              )}

              {/* Min Stock Line */}
              {config.showMinStock && minStock && (
                <ReferenceLine
                  y={minStock}
                  stroke="#6b7280"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  label={{
                    value: 'Min Stock',
                    position: 'right',
                    fill: '#6b7280',
                    fontSize: 12,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for charting
        </div>
      )}

      {/* Stock Level Indicators */}
      <div className="flex items-center justify-center space-x-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-700">Actual Data</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-gray-700">Forecast</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-200 rounded"></div>
          <span className="text-sm text-gray-700">Confidence Interval</span>
        </div>
        {reorderPoint && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-orange-500"></div>
            <span className="text-sm text-gray-700">Reorder Point</span>
          </div>
        )}
        {maxStock && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-sm text-gray-700">Max Stock</span>
          </div>
        )}
      </div>

      {/* Additional Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          {reorderPoint && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showReorderPoint}
                onChange={() => toggleConfig('showReorderPoint')}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <span className="text-sm text-gray-700">Show Reorder Point</span>
            </label>
          )}
          {maxStock && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showMaxStock}
                onChange={() => toggleConfig('showMaxStock')}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm text-gray-700">Show Max Stock</span>
            </label>
          )}
          {minStock && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showMinStock}
                onChange={() => toggleConfig('showMinStock')}
                className="w-4 h-4 text-gray-600 rounded"
              />
              <span className="text-sm text-gray-700">Show Min Stock</span>
            </label>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {data.length} data points
        </div>
      </div>
    </div>
  );
}
