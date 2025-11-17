'use client';

import { useState } from 'react';
import { useDiscounts } from '@/lib/hooks/useDiscounts';
import { useToast } from '@/lib/hooks/useToast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Discount } from '@/types';

interface DeleteDiscountModalProps {
  discount: Discount;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteDiscountModal({
  discount,
  onClose,
  onSuccess,
}: DeleteDiscountModalProps) {
  const { deleteDiscount } = useDiscounts();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteDiscount(discount.id);
      showToast('ลบส่วนลดสำเร็จ', 'success');
      onSuccess();
    } catch (error: any) {
      showToast(error.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ลบส่วนลด</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-6">
            คุณแน่ใจหรือไม่ว่าต้องการลบส่วนลด{' '}
            <span className="font-semibold">{discount.name}</span> ({discount.code})?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              ลบส่วนลด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
