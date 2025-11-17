'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import type { ProductFilters } from '@/types';

interface AdvancedFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    filters.inStock !== undefined ||
    filters.isFeatured !== undefined ||
    filters.sortBy !== undefined;

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    onFiltersChange({
      ...filters,
      [type === 'min' ? 'minPrice' : 'maxPrice']: numValue,
    });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({
      ...filters,
      minRating: filters.minRating === rating ? undefined : rating,
    });
  };

  const handleStockChange = () => {
    onFiltersChange({
      ...filters,
      inStock: filters.inStock ? undefined : true,
    });
  };

  const handleFeaturedChange = () => {
    onFiltersChange({
      ...filters,
      isFeatured: filters.isFeatured ? undefined : true,
    });
  };

  const handleSortChange = (sortBy: string) => {
    const [field, order] = sortBy.split('-');
    onFiltersChange({
      ...filters,
      sortBy: field as any,
      sortOrder: order as 'asc' | 'desc',
    });
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
          ${
            hasActiveFilters
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
          }
          hover:bg-gray-50 dark:hover:bg-gray-700
        `}
      >
        <Filter className="w-4 h-4" />
        <span>ตัวกรองขั้นสูง</span>
        {hasActiveFilters && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-blue-600 text-white">
            !
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">ตัวกรองขั้นสูง</h3>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    onClearFilters();
                    setIsOpen(false);
                  }}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  ล้างทั้งหมด
                </button>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ช่วงราคา
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="ต่ำสุด"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="สูงสุด"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                คะแนนขั้นต่ำ
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(rating)}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-lg border transition-colors
                      ${
                        filters.minRating === rating
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-400'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }
                      hover:bg-yellow-50 dark:hover:bg-yellow-900/20
                    `}
                  >
                    {rating}★
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ตัวกรองด่วน
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock || false}
                    onChange={handleStockChange}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    มีสินค้าคงเหลือเท่านั้น
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isFeatured || false}
                    onChange={handleFeaturedChange}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    สินค้าแนะนำเท่านั้น
                  </span>
                </label>
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                เรียงตาม
              </label>
              <select
                value={
                  filters.sortBy && filters.sortOrder
                    ? `${filters.sortBy}-${filters.sortOrder}`
                    : ''
                }
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เริ่มต้น</option>
                <option value="name-asc">ชื่อ (ก-ฮ)</option>
                <option value="name-desc">ชื่อ (ฮ-ก)</option>
                <option value="price-asc">ราคา (ต่ำ-สูง)</option>
                <option value="price-desc">ราคา (สูง-ต่ำ)</option>
                <option value="rating-desc">คะแนนสูงสุด</option>
                <option value="popular-desc">ยอดนิยม</option>
                <option value="newest-desc">ใหม่ล่าสุด</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
