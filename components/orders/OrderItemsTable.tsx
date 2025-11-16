'use client';

import { Trash2, Plus, Minus, Loader } from 'lucide-react';
import type { OrderItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface OrderItemsTableProps {
  items: OrderItem[];
  loading: boolean;
  onAddClick: () => void;
  onQuantityChange: (itemId: string, newQuantity: number) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export default function OrderItemsTable({
  items,
  loading,
  onAddClick,
  onQuantityChange,
  onDelete,
}: OrderItemsTableProps) {
  const handleDecreaseQuantity = async (itemId: string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      await onQuantityChange(itemId, currentQuantity - 1);
    }
  };

  const handleIncreaseQuantity = async (itemId: string, currentQuantity: number) => {
    await onQuantityChange(itemId, currentQuantity + 1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          ລາຍການອາຫານ ({items.length})
        </h3>
        <button
          onClick={onAddClick}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
          เพิ่มรายการ
        </button>
      </div>

      {/* Items Table */}
      {items.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
          ยังไม่มีรายการ
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  สินค้า
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  ราคา
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  จำนวน
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  รวม
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  การกระทำ
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {item.productId.slice(0, 8)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          handleDecreaseQuantity(item.id!, item.quantity)
                        }
                        disabled={loading || item.quantity === 1}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleIncreaseQuantity(item.id!, item.quantity)
                        }
                        disabled={loading}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency((item.totalPrice || item.quantity * item.price))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onDelete(item.id!)}
                      disabled={loading}
                      className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
