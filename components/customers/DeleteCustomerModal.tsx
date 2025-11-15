'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Customer } from '@/types';

interface DeleteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export default function DeleteCustomerModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: DeleteCustomerModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!customer) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบลูกค้า');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการลบลูกค้า'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              ยืนยันการลบลูกค้า
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isDeleting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้านี้? การดำเนินการนี้จะลบข้อมูลลูกค้าและออเดอร์ที่เกี่ยวข้องทั้งหมด และไม่สามารถย้อนกลับได้
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ชื่อลูกค้า:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {customer.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  อีเมล:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {customer.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  เบอร์โทร:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {customer.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  จำนวนออเดอร์:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {customer.totalOrders}
                </span>
              </div>
            </div>
          </div>

          {customer.totalOrders > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                <strong>คำเตือน:</strong> ลูกค้านี้มี {customer.totalOrders} ออเดอร์ที่เกี่ยวข้อง ซึ่งจะถูกลบด้วย
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isDeleting}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting}
            >
              {isDeleting ? 'กำลังลบ...' : 'ลบลูกค้า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
