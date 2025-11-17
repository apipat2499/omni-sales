'use client';

import {
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ScatterChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

/**
 * Stacked area chart for comparing metrics over time
 */
export function StackedAreaChart({ data, dataKeys }: {
  data: any[];
  dataKeys: Array<{ key: string; name: string; color: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          {dataKeys.map((dk) => (
            <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={dk.color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={dk.color} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
        <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
        <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: 'none',
            borderRadius: '8px',
            color: '#F9FAFB',
          }}
        />
        <Legend />
        {dataKeys.map((dk) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            stackId="1"
            stroke={dk.color}
            fill={`url(#gradient-${dk.key})`}
            name={dk.name}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Radar chart for multi-dimensional comparisons
 */
export function RadarMetricsChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="metric" stroke="#6B7280" style={{ fontSize: '12px' }} />
        <PolarRadiusAxis stroke="#6B7280" />
        <Radar
          name="คะแนน"
          dataKey="value"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.6}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: 'none',
            borderRadius: '8px',
            color: '#F9FAFB',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/**
 * Scatter plot for correlation analysis
 */
export function ScatterPlot({ data }: {
  data: Array<{ x: number; y: number; name?: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
        <XAxis
          type="number"
          dataKey="x"
          name="X"
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Y"
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            backgroundColor: '#1F2937',
            border: 'none',
            borderRadius: '8px',
            color: '#F9FAFB',
          }}
        />
        <Scatter name="Data" data={data} fill="#8B5CF6">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={`hsl(${(index * 360) / data.length}, 70%, 60%)`} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/**
 * Heatmap for time-based patterns
 */
export function HeatmapChart({ data }: {
  data: Array<{ day: string; hour: number; value: number }>;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = [...new Set(data.map((d) => d.day))];

  const getColor = (value: number) => {
    if (value === 0) return '#F3F4F6';
    if (value < 20) return '#DBEAFE';
    if (value < 40) return '#93C5FD';
    if (value < 60) return '#60A5FA';
    if (value < 80) return '#3B82F6';
    return '#1E40AF';
  };

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: '600px' }}>
        <div className="grid grid-cols-25 gap-1">
          {/* Header row */}
          <div className="text-xs text-gray-500"></div>
          {hours.map((hour) => (
            <div key={hour} className="text-xs text-gray-500 text-center">
              {hour}
            </div>
          ))}

          {/* Data rows */}
          {days.map((day) => (
            <>
              <div key={`label-${day}`} className="text-xs text-gray-500 py-1">
                {day}
              </div>
              {hours.map((hour) => {
                const dataPoint = data.find((d) => d.day === day && d.hour === hour);
                const value = dataPoint?.value || 0;

                return (
                  <div
                    key={`${day}-${hour}`}
                    className="aspect-square rounded"
                    style={{ backgroundColor: getColor(value) }}
                    title={`${day} ${hour}:00 - ${value}`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Funnel chart for conversion tracking
 */
export function FunnelChart({ stages }: {
  stages: Array<{ name: string; value: number; color: string }>;
}) {
  const maxValue = Math.max(...stages.map((s) => s.value));

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const percentage = (stage.value / maxValue) * 100;
        const conversionRate = index > 0
          ? ((stage.value / stages[index - 1].value) * 100).toFixed(1)
          : '100.0';

        return (
          <div key={stage.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">{stage.name}</span>
              <span className="text-gray-600 dark:text-gray-400">
                {stage.value.toLocaleString()} ({conversionRate}%)
              </span>
            </div>
            <div className="relative h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div
                className="h-full flex items-center justify-center text-white font-medium transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: stage.color,
                }}
              >
                {percentage > 20 && stage.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
