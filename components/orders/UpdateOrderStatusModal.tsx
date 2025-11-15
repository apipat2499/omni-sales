'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { getStatusColor } from '@/lib/utils';

interface UpdateOrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'รอดำเนินการ',
  processing: 'กำลังดำเนินการ',
  shipped: 'จัดส่งแล้ว',
  delivered: 'สำเร็จ',
  cancelled: 'ยกเลิก',
};

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'ออเดอร์รอการยืนยันและดำเนินการ',
  processing: 'กำลังเตรียมสินค้าและจัดเตรียมจัดส่ง',
  shipped: 'สินค้าถูกส่งออกแล้ว รอการจัดส่ง',
  delivered: 'ลูกค้าได้รับสินค้าแล้ว',
  cancelled: 'ออเดอร์ถูกยกเลิก',
};

export default function UpdateOrderStatusModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: UpdateOrderStatusModalProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  // Get available status options based on current status
  const getAvailableStatuses = (): OrderStatus[] => {
    const statusOrder: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(order.status);

    // Can always cancel (except if already delivered)
    const statuses: OrderStatus[] = [];

    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      // Can move forward in the flow
      for (let i = currentIndex + 1; i < statusOrder.length; i++) {
        statuses.push(statusOrder[i]);
      }
      // Can cancel
      statuses.push('cancelled');
    }

    return statuses;
  };

  const availableStatuses = getAvailableStatuses();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) {
      setError('กรุณาเลือกสถานะใหม่');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewStatus('');
    setError(null);
    onClose();
  };

  if (availableStatuses.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                อัปเดตสถานะออเดอร์
              </h2>
              <button
                onClick={handleClose}
                className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ไม่สามารถเปลี่ยนสถานะออเดอร์นี้ได้
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  ออเดอร์อยู่ในสถานะ &quot;{STATUS_LABELS[order.status]}&quot; แล้ว
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              อัปเดตสถานะออเดอร์
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Order Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  รหัสออเดอร์
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  #{order.id.toUpperCase().slice(0, 8)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  ลูกค้า: {order.customerName}
                </p>
              </div>

              {/* Current Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  สถานะปัจจุบัน
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {STATUS_DESCRIPTIONS[order.status]}
                </p>
              </div>

              {/* New Status */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  สถานะใหม่ <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={loading}
                  required
                >
                  <option value="">-- เลือกสถานะใหม่ --</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                {newStatus && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {STATUS_DESCRIPTIONS[newStatus]}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Warning */}
              {newStatus && (
                <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    กรุณายืนยันการเปลี่ยนสถานะ การดำเนินการนี้จะอัปเดตสถานะออเดอร์ทันที
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || !newStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    อัปเดตสถานะ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
