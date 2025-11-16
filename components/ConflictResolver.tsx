'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { SyncConflict } from '@/lib/pwa/sync-manager';

interface ConflictResolverProps {
  conflicts: SyncConflict[];
  onResolve: (conflict: SyncConflict, resolution: 'server' | 'client' | 'merge') => void;
  onClose: () => void;
}

export default function ConflictResolver({ conflicts, onResolve, onClose }: ConflictResolverProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  if (conflicts.length === 0) {
    return null;
  }

  const currentConflict = conflicts[currentIndex];
  const isLastConflict = currentIndex === conflicts.length - 1;

  const handleResolve = (resolution: 'server' | 'client' | 'merge') => {
    onResolve(currentConflict, resolution);

    if (isLastConflict) {
      onClose();
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedFields(new Set());
    }
  };

  const handleMerge = () => {
    // Create merged data based on selected fields
    const merged = { ...currentConflict.serverData };

    selectedFields.forEach(field => {
      merged[field] = currentConflict.clientData[field];
    });

    onResolve(currentConflict, 'merge');

    if (isLastConflict) {
      onClose();
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedFields(new Set());
    }
  };

  const toggleField = (field: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const getDifferingFields = () => {
    const fields: string[] = [];
    const allKeys = new Set([
      ...Object.keys(currentConflict.clientData),
      ...Object.keys(currentConflict.serverData),
    ]);

    allKeys.forEach(key => {
      if (key === 'id' || key === 'createdAt') return; // Skip these fields

      const clientValue = currentConflict.clientData[key];
      const serverValue = currentConflict.serverData[key];

      if (JSON.stringify(clientValue) !== JSON.stringify(serverValue)) {
        fields.push(key);
      }
    });

    return fields;
  };

  const differingFields = getDifferingFields();

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatFieldName = (field: string): string => {
    // Convert camelCase to Title Case
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                พบข้อขัดแย้งในข้อมูล
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ข้อขัดแย้ง {currentIndex + 1} จาก {conflicts.length} - {currentConflict.resource}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ข้อมูลในเครื่องของคุณและข้อมูลบนเซิร์ฟเวอร์ไม่ตรงกัน
              กรุณาเลือกว่าต้องการใช้ข้อมูลชุดใด หรือรวมข้อมูลเข้าด้วยกัน
            </p>
          </div>

          {/* Differing Fields */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              ฟิลด์ที่แตกต่างกัน:
            </h3>

            {differingFields.map(field => (
              <div
                key={field}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 font-medium text-gray-900 dark:text-white">
                  {formatFieldName(field)}
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                  {/* Client Data */}
                  <div className="p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      ข้อมูลในเครื่อง
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-900/50 p-2 rounded">
                      {formatValue(currentConflict.clientData[field])}
                    </div>
                  </div>

                  {/* Server Data */}
                  <div className="p-4">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      ข้อมูลบนเซิร์ฟเวอร์
                    </div>
                    <div className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-900/50 p-2 rounded">
                      {formatValue(currentConflict.serverData[field])}
                    </div>
                  </div>
                </div>

                {/* Merge Checkbox */}
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFields.has(field)}
                      onChange={() => toggleField(field)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ใช้ข้อมูลในเครื่องสำหรับฟิลด์นี้
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg transition-colors"
            >
              ข้าม
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleResolve('client')}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                ใช้ข้อมูลในเครื่อง
              </button>

              <button
                onClick={() => handleResolve('server')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                ใช้ข้อมูลบนเซิร์ฟเวอร์
              </button>

              {selectedFields.size > 0 && (
                <button
                  onClick={handleMerge}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  รวมข้อมูล ({selectedFields.size} ฟิลด์)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
