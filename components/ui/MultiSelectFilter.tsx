'use client';

import { useState } from 'react';
import { Filter, Check } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  showCount?: boolean;
}

export default function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  showCount = false,
}: MultiSelectFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (value.length === 0) return label;
    if (value.length === 1) {
      const selected = options.find((opt) => opt.value === value[0]);
      return selected?.label || label;
    }
    return `${label} (${value.length})`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
          value.length > 0
            ? 'border-blue-500 dark:border-blue-400'
            : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {getDisplayText()}
        </span>
        {value.length > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            {value.length}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[280px] max-h-[400px] flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหา..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Options */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  ไม่พบรายการ
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleToggle(option.value)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        value.includes(option.value)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {value.includes(option.value) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                    {showCount && option.count !== undefined && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({option.count})
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                onClick={handleSelectAll}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                {value.length === options.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
              </button>
              <button
                onClick={handleClear}
                disabled={value.length === 0}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ล้าง
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
