'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { Product } from '@/types';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export default function DeleteProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: DeleteProductModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการลบสินค้า');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการลบสินค้า'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !product) return null;

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
              ยืนยันการลบสินค้า
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
            คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ชื่อสินค้า:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {product.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  SKU:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {product.sku}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  หมวดหมู่:
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {product.category}
                </span>
              </div>
            </div>
          </div>

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
              {isDeleting ? 'กำลังลบ...' : 'ลบสินค้า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
