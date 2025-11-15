'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: boolean;
}

const DATE_PRESETS = [
  { label: 'วันนี้', getValue: () => ({ from: new Date(), to: new Date() }) },
  {
    label: '7 วันที่แล้ว',
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 7);
      return { from, to };
    },
  },
  {
    label: '30 วันที่แล้ว',
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      return { from, to };
    },
  },
  {
    label: '90 วันที่แล้ว',
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 90);
      return { from, to };
    },
  },
  {
    label: 'เดือนนี้',
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from, to };
    },
  },
  {
    label: 'เดือนที่แล้ว',
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from, to };
    },
  },
];

export default function DateRangePicker({ value, onChange, presets = true }: DateRangePickerProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    onChange(preset.getValue());
    setShowDropdown(false);
  };

  const handleCustomDateChange = (type: 'from' | 'to', dateString: string) => {
    const newDate = dateString ? new Date(dateString) : null;
    onChange({
      ...value,
      [type]: newDate,
    });
  };

  const handleClear = () => {
    onChange({ from: null, to: null });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value.from && value.to
            ? `${formatDate(value.from)} - ${formatDate(value.to)}`
            : 'เลือกช่วงวันที่'}
        </span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[320px]">
            {presets && (
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                  ช่วงเวลา
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DATE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className="px-3 py-2 text-sm text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                กำหนดเอง
              </p>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  จาก
                </label>
                <input
                  type="date"
                  value={value.from ? value.from.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  ถึง
                </label>
                <input
                  type="date"
                  value={value.to ? value.to.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleCustomDateChange('to', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleClear}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  ล้าง
                </button>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
