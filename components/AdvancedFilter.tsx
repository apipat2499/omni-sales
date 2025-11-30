'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, Save, Trash2 } from 'lucide-react';

export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'number' | 'date' | 'dateRange' | 'numberRange';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: any;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValues;
}

interface AdvancedFilterProps {
  fields: FilterField[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset?: () => void;
  presets?: FilterPreset[];
  onSavePreset?: (name: string, filters: FilterValues) => void;
  onDeletePreset?: (id: string) => void;
  onApplyPreset?: (preset: FilterPreset) => void;
}

export default function AdvancedFilter({
  fields,
  values,
  onChange,
  onReset,
  presets = [],
  onSavePreset,
  onDeletePreset,
  onApplyPreset,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const activeFiltersCount = Object.keys(values).filter(
    (key) => values[key] !== undefined && values[key] !== '' && values[key] !== null
  ).length;

  const handleChange = (fieldId: string, value: any) => {
    onChange({
      ...values,
      [fieldId]: value,
    });
  };

  const handleReset = () => {
    const resetValues: FilterValues = {};
    fields.forEach((field) => {
      resetValues[field.id] = undefined;
    });
    onChange(resetValues);
    onReset?.();
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('กรุณาใส่ชื่อ preset');
      return;
    }
    onSavePreset?.(presetName, values);
    setPresetName('');
    setShowSavePreset(false);
  };

  const renderField = (field: FilterField) => {
    const value = values[field.id];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">All</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        );

      case 'dateRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={value?.from || ''}
              onChange={(e) =>
                handleChange(field.id, { ...value, from: e.target.value })
              }
              placeholder="From"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <input
              type="date"
              value={value?.to || ''}
              onChange={(e) =>
                handleChange(field.id, { ...value, to: e.target.value })
              }
              placeholder="To"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        );

      case 'numberRange':
        return (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={value?.min || ''}
              onChange={(e) =>
                handleChange(field.id, { ...value, min: e.target.value })
              }
              placeholder="Min"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            <input
              type="number"
              value={value?.max || ''}
              onChange={(e) =>
                handleChange(field.id, { ...value, max: e.target.value })
              }
              placeholder="Max"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-white transition-colors"
      >
        <Filter className="h-4 w-4" />
        <span>Advanced Filters</span>
        {activeFiltersCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Advanced Filters
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Filter Fields */}
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          {/* Presets */}
          {(presets.length > 0 || onSavePreset) && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <span>Saved Filters</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showPresets ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showPresets && (
                <div className="space-y-2 mt-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <button
                        onClick={() => onApplyPreset?.(preset)}
                        className="flex-1 text-left text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {preset.name}
                      </button>
                      <button
                        onClick={() => onDeletePreset?.(preset.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {onSavePreset && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      {!showSavePreset ? (
                        <button
                          onClick={() => setShowSavePreset(true)}
                          className="w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Save Current Filters
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            placeholder="Preset name..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSavePreset();
                            }}
                          />
                          <button
                            onClick={handleSavePreset}
                            className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setShowSavePreset(false);
                              setPresetName('');
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
