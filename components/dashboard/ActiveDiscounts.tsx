'use client';

import { useDiscounts } from '@/lib/hooks/useDiscounts';
import { Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { DemoPill } from '@/components/DemoPill';
import { formatCurrency } from '@/lib/utils';

export default function ActiveDiscounts() {
  const { discounts, loading } = useDiscounts('', 'true');
  const { supabaseReady } = useAuth();
  const isDemo = !supabaseReady;

  const activeDiscounts = discounts.filter((d) => d.active).slice(0, 5);
  const totalSavings = discounts.reduce((sum, d) => sum + (d.usageCount * (d.value || 0)), 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Tag className="h-5 w-5 text-purple-600" />
          ส่วนลดที่ใช้งาน
        </h2>
        <div className="flex items-center gap-2">
          {isDemo && <DemoPill />}
          <Link
            href="/discounts"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ดูทั้งหมด
          </Link>
        </div>
      </div>

      {loading && supabaseReady ? (
        <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
      ) : activeDiscounts.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">ไม่มีส่วนลดที่ใช้งานอยู่</p>
          <Link
            href="/discounts"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
          >
            สร้างส่วนลดใหม่
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {activeDiscounts.map((discount) => (
              <div
                key={discount.id}
                className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">
                      {discount.code}
                    </code>
                    {discount.type === 'percentage' ? (
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        -{discount.value}%
                      </span>
                    ) : (
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        -฿{discount.value}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    ใช้แล้ว {discount.usageCount} ครั้ง
                    {discount.usageLimit && ` / ${discount.usageLimit}`}
                  </p>
                </div>
                {discount.endDate && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(discount.endDate), 'dd MMM', { locale: th })}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">ส่วนลดทั้งหมด</span>
              <span className="font-semibold text-gray-900 dark:text-white">{discounts.length} รายการ</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>ยอดรวมส่วนลด</span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalSavings)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
