'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DiscountModal from '@/components/discounts/DiscountModal';
import DeleteDiscountModal from '@/components/discounts/DeleteDiscountModal';
import { useDiscounts } from '@/lib/hooks/useDiscounts';
import { formatCurrency, cn } from '@/lib/utils';
import { Search, Plus, Edit, Trash2, Tag, Percent, DollarSign, Loader2, Calendar, Users } from 'lucide-react';
import type { Discount } from '@/types';
import { format } from 'date-fns';

export default function DiscountsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);

  const { discounts, loading, error, refresh } = useDiscounts(searchTerm, activeFilter);

  const handleAddDiscount = () => {
    setSelectedDiscount(null);
    setIsDiscountModalOpen(true);
  };

  const handleEditDiscount = (discount: Discount) => {
    setSelectedDiscount(discount);
    setIsDiscountModalOpen(true);
  };

  const handleDeleteDiscount = (discount: Discount) => {
    setSelectedDiscount(discount);
    setIsDeleteModalOpen(true);
  };

  const activeDiscounts = discounts.filter((d) => d.active);
  const totalUsage = discounts.reduce((sum, d) => sum + d.usageCount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ส่วนลด & โปรโมชั่น</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">จัดการโค้ดส่วนลดและโปรโมชั่น</p>
          </div>
          <button
            onClick={handleAddDiscount}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            สร้างส่วนลด
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ส่วนลดทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{discounts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Percent className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ส่วนลดที่ใช้งานได้</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeDiscounts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">จำนวนการใช้งาน</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาโค้ดส่วนลดหรือชื่อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveFilter('true')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  activeFilter === 'true'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                ใช้งาน
              </button>
              <button
                onClick={() => setActiveFilter('false')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  activeFilter === 'false'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                ไม่ใช้งาน
              </button>
            </div>
          </div>
        </div>

        {/* Discounts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : discounts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">ไม่พบส่วนลด</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {discounts.map((discount) => (
              <div
                key={discount.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-mono font-bold text-sm">
                        {discount.code}
                      </div>
                      {discount.active ? (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                          ใช้งาน
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                          ไม่ใช้งาน
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {discount.name}
                    </h3>
                    {discount.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {discount.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">ประเภท</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                          {discount.type === 'percentage' ? (
                            <>
                              <Percent className="h-4 w-4" />
                              {discount.value}%
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4" />
                              {formatCurrency(discount.value)}
                            </>
                          )}
                        </p>
                      </div>

                      {discount.minPurchaseAmount > 0 && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">ซื้อขั้นต่ำ</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(discount.minPurchaseAmount)}
                          </p>
                        </div>
                      )}

                      {discount.usageLimit && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">จำนวนการใช้</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {discount.usageCount} / {discount.usageLimit}
                          </p>
                        </div>
                      )}

                      {(discount.startDate || discount.endDate) && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            ระยะเวลา
                          </p>
                          <p className="font-medium text-gray-900 dark:text-white text-xs">
                            {discount.startDate && format(new Date(discount.startDate), 'dd/MM/yy')}
                            {' - '}
                            {discount.endDate && format(new Date(discount.endDate), 'dd/MM/yy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditDiscount(discount)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDiscountModalOpen && (
        <DiscountModal
          discount={selectedDiscount}
          onClose={() => setIsDiscountModalOpen(false)}
          onSuccess={() => {
            setIsDiscountModalOpen(false);
            refresh();
          }}
        />
      )}

      {isDeleteModalOpen && selectedDiscount && (
        <DeleteDiscountModal
          discount={selectedDiscount}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={() => {
            setIsDeleteModalOpen(false);
            refresh();
          }}
        />
      )}
    </DashboardLayout>
  );
}
