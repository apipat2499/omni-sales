'use client';

import { Download, Printer } from 'lucide-react';
import type { OrderItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { exportOrderItemsToCSV, printOrderItems } from '@/lib/utils/export';

interface CartSummaryProps {
  items: OrderItem[];
  tax?: number;
  shipping?: number;
  discount?: number;
}

export default function CartSummary({
  items,
  tax = 0,
  shipping = 0,
  discount = 0,
}: CartSummaryProps) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.price);
  }, 0);

  const total = subtotal + tax + shipping - discount;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        สรุปออเดอร์
      </h3>

      <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">ยอดรวม</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Tax */}
        {tax > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">ภาษี</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(tax)}
            </span>
          </div>
        )}

        {/* Shipping */}
        {shipping > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">ค่าจัดส่ง</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(shipping)}
            </span>
          </div>
        )}

        {/* Discount */}
        {discount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400">ส่วนลด</span>
            <span className="font-medium text-red-600 dark:text-red-400">
              -{formatCurrency(discount)}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900 dark:text-white">
          รวมทั้งสิ้น
        </span>
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {formatCurrency(total)}
        </span>
      </div>

      {/* Item Count */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          จำนวนรายการทั้งหมด:{' '}
          <span className="font-medium text-gray-900 dark:text-white">
            {items.length} รายการ
          </span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          จำนวนหน่วยทั้งหมด:{' '}
          <span className="font-medium text-gray-900 dark:text-white">
            {items.reduce((sum, item) => sum + item.quantity, 0)} หน่วย
          </span>
        </p>
      </div>

      {/* Export Actions */}
      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={() => exportOrderItemsToCSV(items)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={() => printOrderItems(items)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Printer className="h-4 w-4" />
            พิมพ์
          </button>
        </div>
      )}
    </div>
  );
}
