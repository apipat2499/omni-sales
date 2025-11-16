'use client';

import { useState, useEffect } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';
import type { OrderItem } from '@/types';
import ConfirmDialog from '@/components/ConfirmDialog';

interface EditItemModalProps {
  isOpen: boolean;
  item: OrderItem | null;
  onClose: () => void;
  onUpdate: (itemId: string, updates: { quantity?: number; price?: number; discount?: number; notes?: string }) => Promise<boolean>;
  onDelete: (itemId: string) => Promise<boolean>;
  loading: boolean;
}

export default function EditItemModal({
  isOpen,
  item,
  onClose,
  onUpdate,
  onDelete,
  loading,
}: EditItemModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setQuantity(item.quantity);
      setPrice(item.price);
      setDiscount(item.discount || 0);
      setNotes(item.notes || '');
      setError(null);
    }
  }, [isOpen, item]);

  const handleQuantityChange = (value: number) => {
    const newQty = Math.max(1, Math.min(value, 10000));
    setQuantity(newQty);
  };

  const handlePriceChange = (value: number) => {
    const newPrice = Math.max(0, value);
    setPrice(newPrice);
  };

  const handleDiscountChange = (value: number) => {
    const newDiscount = Math.max(0, Math.min(value, getTotalPrice()));
    setDiscount(newDiscount);
  };

  const getTotalPrice = (): number => {
    return quantity * price;
  };

  const getFinalPrice = (): number => {
    return Math.max(0, getTotalPrice() - discount);
  };

  const getDiscountPercent = (): number => {
    const total = getTotalPrice();
    if (total === 0) return 0;
    return (discount / total) * 100;
  };

  const handleUpdate = async () => {
    if (!item || quantity <= 0 || price < 0) {
      setError('กรุณาใส่ข้อมูลที่ถูกต้อง');
      return;
    }

    setIsUpdating(true);
    try {
      const success = await onUpdate(item.id!, {
        quantity,
        price,
        discount: discount > 0 ? discount : undefined,
        notes: notes.trim() || undefined,
      });

      if (success) {
        setError(null);
        onClose();
      } else {
        setError('ไม่สามารถอัปเดตรายการได้ โปรดลองอีกครั้ง');
      }
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      const success = await onDelete(item.id!);
      if (success) {
        setShowDeleteConfirm(false);
        onClose();
      } else {
        setError('ไม่สามารถลบรายการได้');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !item) return null;

  const hasChanges =
    quantity !== item.quantity ||
    price !== item.price ||
    discount !== (item.discount || 0) ||
    notes !== (item.notes || '');

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
            disabled={loading || isUpdating || isDeleting}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                แก้ไขรายการ
              </h2>
              <button
                onClick={onClose}
                disabled={loading || isUpdating || isDeleting}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 flex-grow overflow-y-auto">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Product Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      ชื่อสินค้า
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.productName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      รหัสสินค้า
                    </p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white">
                      {item.productId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity Control */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  จำนวน
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity === 1 || loading || isUpdating}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={loading || isUpdating}
                    className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= 10000 || loading || isUpdating}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    หน่วย
                  </span>
                </div>
              </div>

              {/* Price Control */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  ราคาต่อหน่วย
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                    disabled={loading || isUpdating}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Discount Control */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  ส่วนลด ({getDiscountPercent().toFixed(1)}%)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">฿</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                    disabled={loading || isUpdating}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    / ฿{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                {discount > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    ราคาหลังหักส่วนลด: ฿{getFinalPrice().toFixed(2)}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  หมายเหตุ
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading || isUpdating}
                  placeholder="เพิ่มหมายเหตุ..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ราคารวม
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ฿{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ส่วนลด
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -฿{discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-blue-200 dark:border-blue-800 pt-2 flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">
                    รวมทั้งสิ้น
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ฿{getFinalPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-3 justify-between flex-shrink-0 bg-gray-50 dark:bg-gray-900">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || isUpdating || isDeleting}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ลบรายการ
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading || isUpdating || isDeleting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!hasChanges || loading || isUpdating || isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating && <Loader className="h-4 w-4 animate-spin" />}
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="ลบรายการ"
        message={`คุณแน่ใจว่าต้องการลบ "${item.productName}" จากคำสั่ง? ไม่สามารถเลิกทำได้`}
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        isDangerous={true}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
