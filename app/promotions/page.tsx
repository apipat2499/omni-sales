'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useToast } from '@/lib/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { Tag, Plus, Edit, Trash2, Calendar, TrendingUp, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Promotion } from '@/types';

export default function PromotionsPage() {
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const { promotions, loading, error, refresh } = usePromotions({ isActive: showActiveOnly });
  const { success, error: showError } = useToast();

  const activePromotions = promotions.filter((p) => {
    const now = new Date();
    return p.isActive && p.startDate <= now && p.endDate >= now;
  });

  const upcomingPromotions = promotions.filter((p) => {
    const now = new Date();
    return p.isActive && p.startDate > now;
  });

  const expiredPromotions = promotions.filter((p) => {
    const now = new Date();
    return p.endDate < now;
  });

  const getPromotionTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'ส่วนลดเปอร์เซ็นต์';
      case 'fixed_amount':
        return 'ส่วนลดคงที่';
      case 'free_shipping':
        return 'จัดส่งฟรี';
      case 'buy_x_get_y':
        return 'ซื้อ X แถม Y';
      default:
        return type;
    }
  };

  const getPromotionValue = (promotion: Promotion) => {
    if (promotion.type === 'percentage') {
      return `${promotion.value}%`;
    } else if (promotion.type === 'fixed_amount') {
      return formatCurrency(promotion.value);
    } else {
      return '-';
    }
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();

    if (promotion.endDate < now) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          หมดอายุ
        </span>
      );
    }

    if (promotion.startDate > now) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
          กำลังจะมา
        </span>
      );
    }

    if (promotion.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          ใช้งานอยู่
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
        ปิดใช้งาน
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">โปรโมชั่น</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">จัดการโปรโมชั่นและส่วนลด</p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            สร้างโปรโมชั่น
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ใช้งานอยู่</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activePromotions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">กำลังจะมา</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {upcomingPromotions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Tag className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">หมดอายุ</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {expiredPromotions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              แสดงเฉพาะที่ใช้งานได้
            </span>
          </label>
        </div>

        {/* Promotions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
            </div>
          ) : promotions.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">ยังไม่มีโปรโมชั่น</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                คลิก "สร้างโปรโมชั่น" เพื่อเริ่มต้น
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ชื่อโปรโมชั่น
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ประเภท
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      มูลค่า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ระยะเวลา
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      การใช้งาน
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {promotions.map((promotion) => (
                    <tr
                      key={promotion.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {promotion.name}
                        </div>
                        {promotion.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {promotion.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {getPromotionTypeLabel(promotion.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {getPromotionValue(promotion)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {format(promotion.startDate, 'd MMM yyyy', { locale: th })}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ถึง {format(promotion.endDate, 'd MMM yyyy', { locale: th })}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(promotion)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {promotion.usageCount}
                          {promotion.usageLimit && ` / ${promotion.usageLimit}`}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
