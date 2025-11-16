'use client';

import { useState, useEffect } from 'react';
import { Loader, Clock, Plus, Minus, Trash2, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { OrderItemHistory } from '@/lib/order/item-history';

interface OrderItemHistoryProps {
  orderId: string;
  itemId?: string;
}

export default function OrderItemHistory({
  orderId,
  itemId,
}: OrderItemHistoryProps) {
  const [history, setHistory] = useState<OrderItemHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [orderId, itemId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = itemId
        ? `/api/orders/${orderId}/items/${itemId}/history`
        : `/api/orders/${orderId}/items/history`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('ไม่สามารถโหลดประวัติได้');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'quantity_changed':
        return <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'price_changed':
        return <Edit3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Edit3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'added':
        return 'เพิ่มรายการ';
      case 'deleted':
        return 'ลบรายการ';
      case 'quantity_changed':
        return 'เปลี่ยนจำนวน';
      case 'price_changed':
        return 'เปลี่ยนราคา';
      default:
        return 'แก้ไข';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'added':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'deleted':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'quantity_changed':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'price_changed':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 animate-spin text-blue-600 mr-2" />
        <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
        <Clock className="h-8 w-8 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">ไม่มีประวัติการแก้ไข</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        ประวัติการเปลี่ยนแปลง
      </h3>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 ${getActionColor(item.action)}`}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="mt-1">{getActionIcon(item.action)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getActionLabel(item.action)}
                  </p>
                  <span className="text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                    {item.productName}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  {item.oldQuantity !== undefined && item.newQuantity !== undefined && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">จำนวน</p>
                      <p className="text-gray-900 dark:text-white">
                        {item.oldQuantity} → {item.newQuantity}
                      </p>
                    </div>
                  )}

                  {item.oldPrice !== undefined && item.newPrice !== undefined && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">ราคา</p>
                      <p className="text-gray-900 dark:text-white">
                        ฿{item.oldPrice.toFixed(2)} → ฿{item.newPrice.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {item.newQuantity !== undefined && !item.oldQuantity && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">จำนวน</p>
                      <p className="text-gray-900 dark:text-white">{item.newQuantity}</p>
                    </div>
                  )}

                  {item.newPrice !== undefined && !item.oldPrice && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">ราคา</p>
                      <p className="text-gray-900 dark:text-white">
                        ฿{item.newPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {format(item.changedAt, 'dd MMMM yyyy HH:mm:ss', { locale: th })}
                  {item.changedBy && ` (โดย ${item.changedBy})`}
                </p>

                {item.notes && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                    หมายเหตุ: {item.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
