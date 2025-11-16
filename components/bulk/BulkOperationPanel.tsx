'use client';

/**
 * Bulk Operation Panel Component
 * Provides UI for selecting items and performing bulk operations
 * with progress tracking, confirmation dialogs, and error reporting
 */

import { useState, useCallback, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Trash2,
  DollarSign,
  Hash,
  Percent,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  X,
} from 'lucide-react';
import { useBulkOperations, useQuickBulkOperations } from '@/lib/hooks/useBulkOperations';
import type { OrderItem } from '@/types';
import type { BulkOperationType, BulkOperationItem } from '@/lib/utils/bulk-operations';
import { formatDuration } from '@/lib/utils/bulk-operations';
import ConfirmDialog from '@/components/ConfirmDialog';
import { t, getCurrentLanguage } from '@/lib/utils/i18n';

interface BulkOperationPanelProps {
  orderId: string;
  items: OrderItem[];
  onOperationComplete?: () => void;
}

export default function BulkOperationPanel({
  orderId,
  items,
  onOperationComplete,
}: BulkOperationPanelProps) {
  const language = getCurrentLanguage();

  // Bulk operations state
  const {
    currentOperation,
    isRunning,
    progress,
    executeOperation,
    cancelOperation,
    history,
    clearHistory,
    getOperationStats,
    canUndo,
    canRedo,
    undo,
    redo,
    confirmationRequired,
    confirmationMessage,
    confirmOperation,
    cancelConfirmation,
    errors,
  } = useBulkOperations({
    orderId,
    onSuccess: () => {
      onOperationComplete?.();
    },
    onError: (error) => {
      console.error('Bulk operation error:', error);
    },
  });

  // Selection state
  const {
    selectedItems,
    selectAll,
    deselectAll,
    toggleItem,
    isSelected,
    getSelectedItems,
    selectedCount,
    totalCount,
    allSelected,
    noneSelected,
  } = useQuickBulkOperations(items);

  // Operation form state
  const [operationType, setOperationType] = useState<BulkOperationType>('update-quantity');
  const [operationValue, setOperationValue] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);

  /**
   * Handle operation execution
   */
  const handleExecuteOperation = useCallback(() => {
    const selected = getSelectedItems();
    if (selected.length === 0) return;

    const operationItems: BulkOperationItem[] = selected.map((item) => {
      const baseItem: BulkOperationItem = {
        id: item.id!,
        productId: item.productId,
        productName: item.productName,
      };

      switch (operationType) {
        case 'update-price':
          return { ...baseItem, price: operationValue };

        case 'update-quantity':
          return { ...baseItem, quantity: operationValue };

        case 'apply-discount':
          return {
            ...baseItem,
            discount: (item.price * item.quantity * operationValue) / 100,
          };

        case 'remove-discount':
          return { ...baseItem, discount: 0 };

        case 'delete':
          return baseItem;

        default:
          return baseItem;
      }
    });

    executeOperation(operationType, operationItems, { value: operationValue });
  }, [operationType, operationValue, getSelectedItems, executeOperation]);

  /**
   * Get operation label in Thai/English
   */
  const getOperationLabel = (type: BulkOperationType): string => {
    const labels = {
      'update-price': language === 'th' ? 'อัปเดตราคา' : 'Update Price',
      'update-quantity': language === 'th' ? 'อัปเดตจำนวน' : 'Update Quantity',
      'apply-discount': language === 'th' ? 'ใช้ส่วนลด' : 'Apply Discount',
      'remove-discount': language === 'th' ? 'ลบส่วนลด' : 'Remove Discount',
      delete: language === 'th' ? 'ลบรายการ' : 'Delete Items',
    };
    return labels[type];
  };

  /**
   * Calculate operation statistics
   */
  const stats = useMemo(() => getOperationStats(), [getOperationStats]);

  return (
    <div className="space-y-4">
      {/* Selection Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {language === 'th' ? 'เลือกรายการ' : 'Select Items'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={allSelected ? deselectAll : selectAll}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>
                {allSelected
                  ? language === 'th'
                    ? 'ยกเลิกทั้งหมด'
                    : 'Deselect All'
                  : language === 'th'
                  ? 'เลือกทั้งหมด'
                  : 'Select All'}
              </span>
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedCount} / {totalCount}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id!)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected(item.id!)
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {isSelected(item.id!) ? (
                <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              ) : (
                <Square className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {item.productName}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    {language === 'th' ? 'จำนวน' : 'Qty'}: {item.quantity}
                  </span>
                  <span>
                    {language === 'th' ? 'ราคา' : 'Price'}: ฿{item.price.toFixed(2)}
                  </span>
                  {item.discount && item.discount > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      {language === 'th' ? 'ส่วนลด' : 'Discount'}: ฿{item.discount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operation Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {language === 'th' ? 'การดำเนินการ' : 'Operations'}
        </h3>

        <div className="space-y-4">
          {/* Operation Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'th' ? 'ประเภทการดำเนินการ' : 'Operation Type'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['update-price', 'update-quantity', 'apply-discount', 'remove-discount', 'delete'] as BulkOperationType[]).map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setOperationType(type)}
                    disabled={isRunning}
                    className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
                      operationType === type
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type === 'update-price' && <DollarSign className="h-4 w-4" />}
                    {type === 'update-quantity' && <Hash className="h-4 w-4" />}
                    {type === 'apply-discount' && <Percent className="h-4 w-4" />}
                    {type === 'remove-discount' && <XCircle className="h-4 w-4" />}
                    {type === 'delete' && <Trash2 className="h-4 w-4" />}
                    <span className="truncate">{getOperationLabel(type)}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Value Input (for operations that need a value) */}
          {operationType !== 'delete' && operationType !== 'remove-discount' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {operationType === 'update-price' && (language === 'th' ? 'ราคาใหม่' : 'New Price')}
                {operationType === 'update-quantity' && (language === 'th' ? 'จำนวนใหม่' : 'New Quantity')}
                {operationType === 'apply-discount' && (language === 'th' ? 'ส่วนลด (%)' : 'Discount (%)')}
              </label>
              <input
                type="number"
                value={operationValue}
                onChange={(e) => setOperationValue(Number(e.target.value))}
                disabled={isRunning}
                min={0}
                step={operationType === 'update-price' ? 0.01 : 1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleExecuteOperation}
            disabled={noneSelected || isRunning}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              operationType === 'delete'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                <span>{language === 'th' ? 'กำลังดำเนินการ...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>
                  {language === 'th' ? 'ดำเนินการ' : 'Execute'} ({selectedCount}{' '}
                  {language === 'th' ? 'รายการ' : 'items'})
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Panel (shown when operation is running) */}
      {currentOperation && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {language === 'th' ? 'ความคืบหน้า' : 'Progress'}
            </h3>
            {isRunning && (
              <button
                onClick={cancelOperation}
                className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</span>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{getOperationLabel(currentOperation.type)}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Operation Details */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentOperation.processedItems}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'th' ? 'ดำเนินการแล้ว' : 'Processed'}
              </div>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentOperation.totalItems}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'th' ? 'ทั้งหมด' : 'Total'}
              </div>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {currentOperation.failedItems}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'th' ? 'ล้มเหลว' : 'Failed'}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-3 flex items-center gap-2">
            {currentOperation.status === 'running' && (
              <>
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'th' ? 'กำลังดำเนินการ...' : 'Processing...'}
                </span>
              </>
            )}
            {currentOperation.status === 'completed' && (
              <>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  {language === 'th' ? 'เสร็จสิ้น' : 'Completed'}{' '}
                  {currentOperation.duration && `(${formatDuration(currentOperation.duration)})`}
                </span>
              </>
            )}
            {currentOperation.status === 'failed' && (
              <>
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {language === 'th' ? 'ล้มเหลว' : 'Failed'}
                </span>
              </>
            )}
            {currentOperation.status === 'cancelled' && (
              <>
                <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'th' ? 'ยกเลิกแล้ว' : 'Cancelled'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Panel */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="font-bold text-red-900 dark:text-red-100">
              {language === 'th' ? 'ข้อผิดพลาด' : 'Errors'} ({errors.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {errors.map((error, index) => (
              <div
                key={index}
                className="text-sm text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/30 p-2 rounded"
              >
                <span className="font-medium">{error.itemId}:</span> {error.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Panel */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {language === 'th' ? 'สถิติ' : 'Statistics'}
            </h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showHistory
                ? language === 'th'
                  ? 'ซ่อนประวัติ'
                  : 'Hide History'
                : language === 'th'
                ? 'แสดงประวัติ'
                : 'Show History'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalOperations}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'th' ? 'การดำเนินการ' : 'Operations'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.successRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'th' ? 'อัตราสำเร็จ' : 'Success Rate'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalItemsProcessed}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'th' ? 'รายการทั้งหมด' : 'Total Items'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDuration(stats.averageDuration)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {language === 'th' ? 'เวลาเฉลี่ย' : 'Avg. Time'}
              </div>
            </div>
          </div>

          {/* History List */}
          {showHistory && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getOperationLabel(entry.operation.type)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.timestamp.toLocaleString(language === 'th' ? 'th-TH' : 'en-US')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>
                      {entry.operation.processedItems} / {entry.operation.totalItems}{' '}
                      {language === 'th' ? 'รายการ' : 'items'}
                    </span>
                    {entry.operation.duration && (
                      <span>{formatDuration(entry.operation.duration)}</span>
                    )}
                    {entry.operation.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    {entry.operation.status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clear History Button */}
          <button
            onClick={clearHistory}
            className="mt-4 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            {language === 'th' ? 'ล้างประวัติ' : 'Clear History'}
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmationRequired}
        title={language === 'th' ? 'ยืนยันการดำเนินการ' : 'Confirm Operation'}
        message={confirmationMessage}
        confirmLabel={language === 'th' ? 'ยืนยัน' : 'Confirm'}
        cancelLabel={language === 'th' ? 'ยกเลิก' : 'Cancel'}
        isDangerous={operationType === 'delete'}
        onConfirm={confirmOperation}
        onCancel={cancelConfirmation}
      />
    </div>
  );
}
