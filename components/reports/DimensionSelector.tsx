"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Dimension, getAvailableDimensions } from "@/lib/analytics/custom-report-engine";

interface DimensionSelectorProps {
  selectedDimensions: Dimension[];
  onChange: (dimensions: Dimension[]) => void;
}

export default function DimensionSelector({
  selectedDimensions,
  onChange,
}: DimensionSelectorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const availableDimensions = getAvailableDimensions();

  const addDimension = (dimension: Dimension) => {
    // Check if already selected
    if (selectedDimensions.some((d) => d.field === dimension.field)) {
      return;
    }

    onChange([...selectedDimensions, dimension]);
    setShowAddMenu(false);
  };

  const removeDimension = (field: string) => {
    onChange(selectedDimensions.filter((d) => d.field !== field));
  };

  const updateGranularity = (field: string, granularity: string) => {
    onChange(
      selectedDimensions.map((d) =>
        d.field === field
          ? { ...d, granularity: granularity as any }
          : d
      )
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newDimensions = [...selectedDimensions];
    [newDimensions[index - 1], newDimensions[index]] = [
      newDimensions[index],
      newDimensions[index - 1],
    ];
    onChange(newDimensions);
  };

  const moveDown = (index: number) => {
    if (index === selectedDimensions.length - 1) return;
    const newDimensions = [...selectedDimensions];
    [newDimensions[index], newDimensions[index + 1]] = [
      newDimensions[index + 1],
      newDimensions[index],
    ];
    onChange(newDimensions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dimensions
        </h3>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Dimension
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search dimensions..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableDimensions.map((dimension) => {
                  const isSelected = selectedDimensions.some(
                    (d) => d.field === dimension.field
                  );

                  return (
                    <button
                      key={dimension.field}
                      onClick={() => addDimension(dimension)}
                      disabled={isSelected}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isSelected
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {dimension.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {dimension.type}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedDimensions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          No dimensions selected. Add dimensions to group your data.
        </div>
      ) : (
        <div className="space-y-2">
          {selectedDimensions.map((dimension, index) => (
            <div
              key={dimension.field}
              className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-30"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {dimension.label}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                    {dimension.type}
                  </span>
                </div>

                {dimension.type === "date" && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                      Granularity
                    </label>
                    <select
                      value={dimension.granularity || "day"}
                      onChange={(e) =>
                        updateGranularity(dimension.field, e.target.value)
                      }
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="quarter">Quarter</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={() => removeDimension(dimension.field)}
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
