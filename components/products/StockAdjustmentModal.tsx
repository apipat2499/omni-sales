'use client';

import { useState } from 'react';
import { X, Plus, Minus, Package, TrendingUp, TrendingDown } from 'lucide-react';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

type AdjustmentType = 'add' | 'subtract' | 'set';

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('add');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const calculateNewStock = () => {
    switch (adjustmentType) {
      case 'add':
        return product.stock + quantity;
      case 'subtract':
        return Math.max(0, product.stock - quantity);
      case 'set':
        return quantity;
      default:
        return product.stock;
    }
  };

  const newStock = calculateNewStock();
  const difference = newStock - product.stock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (adjustmentType !== 'set' && quantity <= 0) {
      alert('กรุณาระบุจำนวนที่ต้องการปรับ');
      return;
    }

    if (adjustmentType === 'set' && quantity < 0) {
      alert('จำนวนสต็อกต้องไม่ติดลบ');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: newStock,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }

      // Reset form
      setAdjustmentType('add');
      setQuantity(0);
      setReason('');

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการปรับสต็อก'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                ปรับสต็อกสินค้า
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Stock */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                สต็อกปัจจุบัน:
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {product.stock} ชิ้น
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>มูลค่า:</span>
              <span>{formatCurrency(product.cost * product.stock)}</span>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              ประเภทการปรับ
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  adjustmentType === 'add'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Plus className={`h-6 w-6 ${
                  adjustmentType === 'add'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  adjustmentType === 'add'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  เพิ่ม
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('subtract')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  adjustmentType === 'subtract'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Minus className={`h-6 w-6 ${
                  adjustmentType === 'subtract'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  adjustmentType === 'subtract'
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  ลด
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('set')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  adjustmentType === 'set'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Package className={`h-6 w-6 ${
                  adjustmentType === 'set'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  adjustmentType === 'set'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  ตั้งค่า
                </span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {adjustmentType === 'set' ? 'สต็อกใหม่' : 'จำนวน'}
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0"
              required
            />
          </div>

          {/* Preview */}
          {quantity > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  สต็อกหลังปรับ:
                </span>
                <div className="flex items-center gap-2">
                  {difference > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : difference < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : null}
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {newStock} ชิ้น
                  </span>
                </div>
              </div>
              {difference !== 0 && (
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {difference > 0 ? '+' : ''}{difference} ชิ้น
                  ({difference > 0 ? 'เพิ่มขึ้น' : 'ลดลง'})
                </div>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              เหตุผล (ไม่บังคับ)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="เช่น รับสินค้าเข้า, สินค้าชำรุด, นับสต็อก..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (adjustmentType !== 'set' && quantity <= 0)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Package className="h-5 w-5" />
                บันทึกการปรับสต็อก
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
