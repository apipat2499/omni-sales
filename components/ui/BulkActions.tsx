'use client';

import { useState } from 'react';
import { Trash2, Edit, Check, X, Loader2 } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  onDelete?: () => void;
  onUpdate?: (field: string, value: any) => void;
  onClear: () => void;
  updateOptions?: Array<{
    field: string;
    label: string;
    type: 'text' | 'number' | 'select';
    options?: Array<{ value: any; label: string }>;
  }>;
  isLoading?: boolean;
}

export default function BulkActions({
  selectedCount,
  onDelete,
  onUpdate,
  onClear,
  updateOptions = [],
  isLoading = false,
}: BulkActionsProps) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [updateValue, setUpdateValue] = useState('');

  if (selectedCount === 0) return null;

  const handleUpdate = () => {
    if (selectedField && updateValue && onUpdate) {
      const option = updateOptions.find((opt) => opt.field === selectedField);
      let finalValue = updateValue;

      if (option?.type === 'number') {
        finalValue = parseFloat(updateValue);
      }

      onUpdate(selectedField, finalValue);
      setShowUpdateForm(false);
      setSelectedField('');
      setUpdateValue('');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[400px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              เลือกแล้ว {selectedCount} รายการ
            </span>
          </div>
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {showUpdateForm ? (
          <div className="space-y-3">
            <select
              value={selectedField}
              onChange={(e) => {
                setSelectedField(e.target.value);
                setUpdateValue('');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            >
              <option value="">เลือกฟิลด์ที่ต้องการอัพเดท</option>
              {updateOptions.map((option) => (
                <option key={option.field} value={option.field}>
                  {option.label}
                </option>
              ))}
            </select>

            {selectedField && (
              <>
                {updateOptions.find((opt) => opt.field === selectedField)?.type === 'select' ? (
                  <select
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  >
                    <option value="">เลือกค่า</option>
                    {updateOptions
                      .find((opt) => opt.field === selectedField)
                      ?.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type={updateOptions.find((opt) => opt.field === selectedField)?.type || 'text'}
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    placeholder="ระบุค่าใหม่"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isLoading}
                  />
                )}
              </>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={!selectedField || !updateValue || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังอัพเดท...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    อัพเดท
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowUpdateForm(false);
                  setSelectedField('');
                  setUpdateValue('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            {onUpdate && updateOptions.length > 0 && (
              <button
                onClick={() => setShowUpdateForm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                <Edit className="h-4 w-4" />
                แก้ไขแบบกลุ่ม
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    ลบทั้งหมด
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
