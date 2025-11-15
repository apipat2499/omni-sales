'use client';

import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useCreateStockMovement } from '@/lib/hooks/useStockMovements';

interface StockAdjustmentModalProps {
  productId: number;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function StockAdjustmentModal({
  productId,
  productName,
  currentStock,
  onClose,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const createMovement = useCreateStockMovement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      alert('กรุณาระบุจำนวนที่ต้องการปรับ');
      return;
    }

    const finalQuantity = adjustmentType === 'add' ? quantity : -quantity;

    try {
      await createMovement.mutateAsync({
        product_id: productId,
        type: 'adjustment',
        quantity: finalQuantity,
        reference_type: 'manual',
        notes: notes || undefined,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('เกิดข้อผิดพลาดในการปรับสต็อก');
    }
  };

  const newStock = adjustmentType === 'add' ? currentStock + quantity : currentStock - quantity;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            ปรับสต็อกสินค้า
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">สินค้า</p>
            <p className="font-medium text-gray-900 dark:text-white">{productName}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              สต็อกปัจจุบัน: <span className="font-semibold">{currentStock}</span>
            </p>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ประเภทการปรับ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  adjustmentType === 'add'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Plus className="h-5 w-5" />
                เพิ่ม
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('subtract')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  adjustmentType === 'subtract'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Minus className="h-5 w-5" />
                ลด
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              จำนวน
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ระบุจำนวน"
            />
          </div>

          {/* Preview */}
          {quantity > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  สต็อกหลังปรับ:
                </span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {newStock >= 0 ? newStock : (
                    <span className="text-red-600 dark:text-red-400">
                      {newStock} (ไม่สามารถติดลบได้)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="เช่น สินค้าชำรุด, รับคืนจากลูกค้า, ตรวจนับใหม่"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={quantity <= 0 || newStock < 0 || createMovement.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMovement.isPending ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
