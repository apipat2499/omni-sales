"use client";

import { useState } from "react";
import { Plus, X, TrendingUp } from "lucide-react";
import { Metric, getAvailableMetrics } from "@/lib/analytics/custom-report-engine";

interface MetricSelectorProps {
  selectedMetrics: Metric[];
  onChange: (metrics: Metric[]) => void;
}

export default function MetricSelector({
  selectedMetrics,
  onChange,
}: MetricSelectorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const availableMetrics = getAvailableMetrics();

  const addMetric = (metric: Metric) => {
    // Check if already selected
    if (selectedMetrics.some((m) => m.field === metric.field)) {
      return;
    }

    onChange([...selectedMetrics, metric]);
    setShowAddMenu(false);
  };

  const removeMetric = (field: string) => {
    onChange(selectedMetrics.filter((m) => m.field !== field));
  };

  const updateAggregation = (field: string, aggregation: string) => {
    onChange(
      selectedMetrics.map((m) =>
        m.field === field
          ? { ...m, aggregation: aggregation as any }
          : m
      )
    );
  };

  const updateFormat = (field: string, format: string) => {
    onChange(
      selectedMetrics.map((m) =>
        m.field === field
          ? { ...m, format: format as any }
          : m
      )
    );
  };

  const getAggregationIcon = (aggregation: string) => {
    switch (aggregation) {
      case 'sum':
        return '∑';
      case 'avg':
        return '⌀';
      case 'count':
        return '#';
      case 'count_distinct':
        return '#!';
      case 'min':
        return '↓';
      case 'max':
        return '↑';
      default:
        return '?';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Metrics
        </h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Metric
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search metrics..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableMetrics.map((metric) => {
                  const isSelected = selectedMetrics.some(
                    (m) => m.field === metric.field
                  );

                  return (
                    <button
                      key={metric.field}
                      onClick={() => addMetric(metric)}
                      disabled={isSelected}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isSelected
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getAggregationIcon(metric.aggregation)}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {metric.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {metric.aggregation}
                            {metric.format && ` • ${metric.format}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedMetrics.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          No metrics selected. Add metrics to analyze your data.
        </div>
      ) : (
        <div className="space-y-2">
          {selectedMetrics.map((metric) => (
            <div
              key={metric.field}
              className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="mt-1">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {metric.label}
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                    {getAggregationIcon(metric.aggregation)} {metric.aggregation}
                  </span>
                  {metric.format && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      {metric.format}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                      Aggregation
                    </label>
                    <select
                      value={metric.aggregation}
                      onChange={(e) =>
                        updateAggregation(metric.field, e.target.value)
                      }
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="count">Count</option>
                      <option value="count_distinct">Count Distinct</option>
                      <option value="min">Minimum</option>
                      <option value="max">Maximum</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                      Format
                    </label>
                    <select
                      value={metric.format || "number"}
                      onChange={(e) =>
                        updateFormat(metric.field, e.target.value)
                      }
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="">Number</option>
                      <option value="currency">Currency</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeMetric(metric.field)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
