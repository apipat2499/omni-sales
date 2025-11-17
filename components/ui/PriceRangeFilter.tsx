'use client';

import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

export interface PriceRange {
  min: number | null;
  max: number | null;
}

interface PriceRangeFilterProps {
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  currency?: string;
  placeholder?: { min?: string; max?: string };
}

export default function PriceRangeFilter({
  value,
  onChange,
  currency = '฿',
  placeholder = { min: 'ราคาต่ำสุด', max: 'ราคาสูงสุด' },
}: PriceRangeFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [localMin, setLocalMin] = useState<string>(value.min?.toString() || '');
  const [localMax, setLocalMax] = useState<string>(value.max?.toString() || '');

  useEffect(() => {
    setLocalMin(value.min?.toString() || '');
    setLocalMax(value.max?.toString() || '');
  }, [value]);

  const handleApply = () => {
    onChange({
      min: localMin ? parseFloat(localMin) : null,
      max: localMax ? parseFloat(localMax) : null,
    });
    setShowDropdown(false);
  };

  const handleClear = () => {
    setLocalMin('');
    setLocalMax('');
    onChange({ min: null, max: null });
  };

  const formatDisplay = () => {
    if (value.min !== null && value.max !== null) {
      return `${currency}${value.min.toLocaleString()} - ${currency}${value.max.toLocaleString()}`;
    }
    if (value.min !== null) {
      return `ตั้งแต่ ${currency}${value.min.toLocaleString()}`;
    }
    if (value.max !== null) {
      return `ถึง ${currency}${value.max.toLocaleString()}`;
    }
    return 'ช่วงราคา';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDisplay()}
        </span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[280px]">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">
              กรองตามราคา
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {placeholder.min}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {placeholder.max}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  ล้าง
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ใช้งาน
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
