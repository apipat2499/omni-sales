'use client';

import { useState } from 'react';
import { useStockMovements, StockMovement } from '@/lib/hooks/useStockMovements';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Package,
  RefreshCw,
  FileText,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface StockMovementHistoryProps {
  productId?: number;
}

const MOVEMENT_TYPES = {
  sale: { label: 'ขาย', color: 'text-red-600 dark:text-red-400', icon: ShoppingCart },
  purchase: { label: 'ซื้อเข้า', color: 'text-green-600 dark:text-green-400', icon: Truck },
  adjustment: { label: 'ปรับปรุง', color: 'text-blue-600 dark:text-blue-400', icon: RefreshCw },
  return: { label: 'คืนสินค้า', color: 'text-purple-600 dark:text-purple-400', icon: Package },
  transfer: { label: 'โอนย้าย', color: 'text-orange-600 dark:text-orange-400', icon: FileText },
};

export default function StockMovementHistory({ productId }: StockMovementHistoryProps) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>('');

  const { data, isLoading, error } = useStockMovements({
    productId,
    type: type || undefined,
    page,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const movements = data?.data || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return <SkeletonLoader type="list" count={5} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">
          เกิดข้อผิดพลาดในการโหลดประวัติการเคลื่อนไหว
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">ทุกประเภท</option>
          {Object.entries(MOVEMENT_TYPES).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>

        {pagination && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ทั้งหมด {pagination.total.toLocaleString('th-TH')} รายการ
          </div>
        )}
      </div>

      {/* Movement List */}
      {movements.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">ยังไม่มีประวัติการเคลื่อนไหว</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    วันที่/เวลา
                  </th>
                  {!productId && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      สินค้า
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    จำนวน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    สต็อกก่อน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    สต็อกหลัง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    หมายเหตุ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {movements.map((movement) => {
                  const typeConfig = MOVEMENT_TYPES[movement.type];
                  const Icon = typeConfig.icon;

                  return (
                    <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(movement.created_at).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      {!productId && movement.products && (
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {movement.products.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {movement.products.sku}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${typeConfig.color}`} />
                          <span className={`text-sm font-medium ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {movement.quantity > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              movement.quantity > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {movement.quantity > 0 ? '+' : ''}
                            {movement.quantity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {movement.previous_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {movement.new_stock}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
