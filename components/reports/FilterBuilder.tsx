"use client";

import { useState } from "react";
import { Plus, X, Filter as FilterIcon } from "lucide-react";
import { Filter, getAvailableDimensions } from "@/lib/analytics/custom-report-engine";

interface FilterBuilderProps {
  filters: Filter[];
  onChange: (filters: Filter[]) => void;
}

const OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "gt", label: "Greater Than" },
  { value: "gte", label: "Greater or Equal" },
  { value: "lt", label: "Less Than" },
  { value: "lte", label: "Less or Equal" },
  { value: "in", label: "In List" },
  { value: "not_in", label: "Not In List" },
  { value: "between", label: "Between" },
];

export default function FilterBuilder({ filters, onChange }: FilterBuilderProps) {
  const availableFields = getAvailableDimensions();

  const addFilter = () => {
    const newFilter: Filter = {
      field: availableFields[0].field,
      operator: "equals",
      value: "",
    };
    onChange([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (
    index: number,
    updates: Partial<Filter>
  ) => {
    onChange(
      filters.map((filter, i) =>
        i === index ? { ...filter, ...updates } : filter
      )
    );
  };

  const getFieldType = (fieldName: string): string => {
    const field = availableFields.find((f) => f.field === fieldName);
    return field?.type || "string";
  };

  const renderValueInput = (filter: Filter, index: number) => {
    const fieldType = getFieldType(filter.field);

    if (filter.operator === "in" || filter.operator === "not_in") {
      return (
        <input
          type="text"
          placeholder="value1, value2, value3"
          value={Array.isArray(filter.value) ? filter.value.join(", ") : filter.value}
          onChange={(e) => {
            const values = e.target.value
              .split(",")
              .map((v) => v.trim())
              .filter((v) => v);
            updateFilter(index, { value: values });
          }}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      );
    }

    if (filter.operator === "between") {
      return (
        <div className="flex-1 flex gap-2">
          <input
            type={fieldType === "date" ? "date" : fieldType === "number" ? "number" : "text"}
            placeholder="From"
            value={filter.value || ""}
            onChange={(e) => updateFilter(index, { value: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <span className="text-gray-500 dark:text-gray-400 self-center">to</span>
          <input
            type={fieldType === "date" ? "date" : fieldType === "number" ? "number" : "text"}
            placeholder="To"
            value={filter.value2 || ""}
            onChange={(e) => updateFilter(index, { value2: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
      );
    }

    const inputType =
      fieldType === "date"
        ? "date"
        : fieldType === "number"
        ? "number"
        : "text";

    return (
      <input
        type={inputType}
        placeholder="Value"
        value={filter.value || ""}
        onChange={(e) => updateFilter(index, { value: e.target.value })}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filters
        </h3>
        <button
          onClick={addFilter}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Filter
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          No filters applied. Add filters to refine your data.
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="mt-2">
                <FilterIcon className="w-5 h-5 text-purple-600" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                      Field
                    </label>
                    <select
                      value={filter.field}
                      onChange={(e) =>
                        updateFilter(index, { field: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      {availableFields.map((field) => (
                        <option key={field.field} value={field.field}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                      Operator
                    </label>
                    <select
                      value={filter.operator}
                      onChange={(e) =>
                        updateFilter(index, { operator: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      {OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Value
                  </label>
                  {renderValueInput(filter, index)}
                </div>
              </div>

              <button
                onClick={() => removeFilter(index)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {filters.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filters.length} filter{filters.length !== 1 ? "s" : ""} applied
        </div>
      )}
    </div>
  );
}
