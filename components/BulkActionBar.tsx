'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { showToast } from '@/lib/utils/toast';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction[];
  onAction: (actionId: string) => void | Promise<void>;
  onClear: () => void;
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  actions,
  onAction,
  onClear,
}: BulkActionBarProps) {
  const [loading, setLoading] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  const handleAction = async (action: BulkAction) => {
    if (action.disabled) return;

    if (action.requiresConfirmation && confirmingAction !== action.id) {
      setConfirmingAction(action.id);
      return;
    }

    try {
      setLoading(true);
      await onAction(action.id);
      setConfirmingAction(null);
    } catch (error) {
      console.error('Bulk action error:', error);
      showToast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const getButtonVariant = (action: BulkAction) => {
    const isConfirming = confirmingAction === action.id;

    if (action.disabled) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500';
    }

    if (isConfirming) {
      return 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800';
    }

    switch (action.variant) {
      case 'danger':
        return 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50';
      case 'success':
        return 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50';
      default:
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50';
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              เลือกแล้ว {selectedCount} รายการ
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              จากทั้งหมด {totalCount}
            </div>
            <button
              onClick={onClear}
              disabled={loading}
              className="ml-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
            >
              ล้างการเลือก
            </button>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions.map((action) => {
              const isConfirming = confirmingAction === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  disabled={loading || action.disabled}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                    'disabled:cursor-not-allowed flex items-center gap-2',
                    getButtonVariant(action)
                  )}
                >
                  {action.icon}
                  {isConfirming ? action.confirmationMessage || 'คลิกอีกครั้งเพื่อยืนยัน' : action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
