"use client";

import { BarChart3, Table as TableIcon, Download, Loader } from "lucide-react";
import { ReportResult } from "@/lib/analytics/custom-report-engine";

interface ReportPreviewProps {
  result: ReportResult | null;
  isLoading: boolean;
  chartType?: "table" | "bar" | "line" | "pie" | "area";
  onExport?: (format: "csv" | "json" | "excel") => void;
}

export default function ReportPreview({
  result,
  isLoading,
  chartType = "table",
  onExport,
}: ReportPreviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Generating report...
          </p>
        </div>
      </div>
    );
  }

  if (!result || !result.data || result.data.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No data to display. Configure dimensions and metrics, then run the
          report.
        </p>
      </div>
    );
  }

  const { data, metadata } = result;

  return (
    <div className="space-y-4">
      {/* Header with metadata */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Rows
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metadata.rowCount.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Execution Time
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metadata.executionTime}ms
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Cached
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {metadata.cached ? "Yes" : "No"}
            </div>
          </div>
        </div>

        {onExport && (
          <div className="flex gap-2">
            <button
              onClick={() => onExport("csv")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => onExport("json")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => onExport("excel")}
              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        )}
      </div>

      {/* Data display */}
      {chartType === "table" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {Object.keys(data[0])
                    .filter((key) => !key.endsWith("_formatted"))
                    .map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {key.replace(/_/g, " ")}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    {Object.entries(row)
                      .filter(([key]) => !key.endsWith("_formatted"))
                      .map(([key, value], colIndex) => {
                        const formattedValue = row[`${key}_formatted`];
                        return (
                          <td
                            key={colIndex}
                            className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                          >
                            {formattedValue !== undefined
                              ? formattedValue
                              : typeof value === "number"
                              ? value.toLocaleString()
                              : String(value || "-")}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length > 10 && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400">
              Showing {data.length} of {metadata.rowCount} rows
            </div>
          )}
        </div>
      )}

      {chartType === "bar" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-64 flex items-end justify-around gap-2">
            {data.slice(0, 10).map((row, index) => {
              const values = Object.entries(row).filter(
                ([key]) =>
                  !key.endsWith("_formatted") &&
                  typeof row[key] === "number"
              );

              const maxValue = Math.max(
                ...data.flatMap((r) =>
                  Object.entries(r)
                    .filter(
                      ([k]) =>
                        !k.endsWith("_formatted") &&
                        typeof r[k] === "number"
                    )
                    .map(([, v]) => v as number)
                )
              );

              const value = values[0]?.[1] as number || 0;
              const height = (value / maxValue) * 100;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${height}%`, minHeight: "4px" }}
                    title={`${value.toLocaleString()}`}
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">
                    {Object.entries(row)
                      .filter(([key]) => typeof row[key] === "string")
                      .map(([, v]) => String(v))[0] || `Item ${index + 1}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(chartType === "line" || chartType === "area") && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-64 relative">
            <svg className="w-full h-full">
              {data.length > 1 && (() => {
                const values = data.map((row) => {
                  const numericValues = Object.entries(row).filter(
                    ([key]) =>
                      !key.endsWith("_formatted") &&
                      typeof row[key] === "number"
                  );
                  return numericValues[0]?.[1] as number || 0;
                });

                const maxValue = Math.max(...values);
                const minValue = Math.min(...values);
                const range = maxValue - minValue || 1;

                const points = values
                  .map((value, index) => {
                    const x = (index / (values.length - 1)) * 100;
                    const y = 100 - ((value - minValue) / range) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ");

                return (
                  <>
                    {chartType === "area" && (
                      <polygon
                        points={`0,100 ${points} 100,100`}
                        fill="rgba(59, 130, 246, 0.2)"
                        stroke="none"
                      />
                    )}
                    <polyline
                      points={points}
                      fill="none"
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    {values.map((value, index) => {
                      const x = (index / (values.length - 1)) * 100;
                      const y = 100 - ((value - minValue) / range) * 100;
                      return (
                        <circle
                          key={index}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="3"
                          fill="rgb(59, 130, 246)"
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}

      {chartType === "pie" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Pie chart visualization</p>
              <p className="text-xs mt-1">
                (Requires charting library for full implementation)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
