'use client';

import { useState, useEffect } from 'react';
import { Save, Bookmark, Trash2, X } from 'lucide-react';

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: Date;
}

interface SavedFiltersProps {
  currentFilters: Record<string, any>;
  onLoadFilter: (filters: Record<string, any>) => void;
  storageKey: string;
}

export default function SavedFilters({ currentFilters, onLoadFilter, storageKey }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Load saved filters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedFilters(
          parsed.map((f: any) => ({
            ...f,
            createdAt: new Date(f.createdAt),
          }))
        );
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  }, [storageKey]);

  // Save filters to localStorage
  const persistFilters = (filters: SavedFilter[]) => {
    localStorage.setItem(storageKey, JSON.stringify(filters));
  };

  const handleSave = () => {
    if (!filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: currentFilters,
      createdAt: new Date(),
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    persistFilters(updated);
    setFilterName('');
    setShowSaveDialog(false);
  };

  const handleLoad = (filter: SavedFilter) => {
    onLoadFilter(filter.filters);
    setShowLoadDialog(false);
  };

  const handleDelete = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    persistFilters(updated);
  };

  const hasActiveFilters = Object.values(currentFilters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some((v) => v !== null && v !== undefined && v !== '');
    }
    return value !== null && value !== undefined && value !== '';
  });

  return (
    <div className="flex gap-2">
      {/* Save Button */}
      <button
        onClick={() => setShowSaveDialog(true)}
        disabled={!hasActiveFilters}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="บันทึกตัวกรองปัจจุบัน"
      >
        <Save className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">บันทึก</span>
      </button>

      {/* Load Button */}
      <button
        onClick={() => setShowLoadDialog(true)}
        disabled={savedFilters.length === 0}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="โหลดตัวกรองที่บันทึกไว้"
      >
        <Bookmark className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          โหลด {savedFilters.length > 0 && `(${savedFilters.length})`}
        </span>
      </button>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                บันทึกตัวกรอง
              </h3>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ชื่อตัวกรอง
                </label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="เช่น สินค้าขายดีเดือนนี้"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={!filterName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                ตัวกรองที่บันทึกไว้
              </h3>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {savedFilters.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  ยังไม่มีตัวกรองที่บันทึกไว้
                </div>
              ) : (
                savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <button
                      onClick={() => handleLoad(filter)}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {filter.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {filter.createdAt.toLocaleDateString('th-TH')}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDelete(filter.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
