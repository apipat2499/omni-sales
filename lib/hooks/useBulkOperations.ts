'use client';

/**
 * Hook for managing bulk operations with progress tracking
 * Supports cancelling operations, undo/redo, and performance metrics
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  type BulkOperationType,
  type BatchOperation,
  type BulkOperationResult,
  type OperationHistoryEntry,
  type UndoRedoStack,
  generateOperationId,
  calculateProgress,
  bulkUpdatePrices,
  bulkUpdateQuantities,
  bulkApplyDiscount,
  bulkRemoveDiscount,
  bulkDeleteItems,
  saveOperationHistory,
  loadOperationHistory,
  saveUndoRedoStack,
  loadUndoRedoStack,
  clearOperationHistory,
  calculateOperationStats,
  formatDuration,
  createItemSnapshot,
  validateBulkOperation,
  type BulkOperationItem,
} from '@/lib/utils/bulk-operations';
import type { OrderItem } from '@/types';

interface UseBulkOperationsOptions {
  orderId: string;
  onSuccess?: (result: BulkOperationResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface UseBulkOperationsReturn {
  // Current operation state
  currentOperation: BatchOperation | null;
  isRunning: boolean;
  progress: number;

  // Execute operations
  executeOperation: (
    type: BulkOperationType,
    items: BulkOperationItem[],
    metadata?: any
  ) => Promise<void>;
  cancelOperation: () => void;

  // History management
  history: OperationHistoryEntry[];
  clearHistory: () => void;
  getOperationStats: () => ReturnType<typeof calculateOperationStats>;

  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;

  // Confirmation helpers
  confirmationRequired: boolean;
  confirmationMessage: string;
  confirmOperation: () => void;
  cancelConfirmation: () => void;

  // Error state
  errors: { itemId: string; error: string }[];
}

export function useBulkOperations(options: UseBulkOperationsOptions): UseBulkOperationsReturn {
  const { orderId, onSuccess, onError, onProgress } = options;

  // State
  const [currentOperation, setCurrentOperation] = useState<BatchOperation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<OperationHistoryEntry[]>([]);
  const [undoRedoStack, setUndoRedoStack] = useState<UndoRedoStack>({
    undoStack: [],
    redoStack: [],
  });
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [pendingOperation, setPendingOperation] = useState<{
    type: BulkOperationType;
    items: BulkOperationItem[];
    metadata?: any;
  } | null>(null);
  const [errors, setErrors] = useState<{ itemId: string; error: string }[]>([]);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const itemsSnapshotRef = useRef<any>(null);

  // Load history and undo/redo stack on mount
  useEffect(() => {
    setHistory(loadOperationHistory());
    setUndoRedoStack(loadUndoRedoStack());
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      saveOperationHistory(history);
    }
  }, [history]);

  // Save undo/redo stack whenever it changes
  useEffect(() => {
    saveUndoRedoStack(undoRedoStack);
  }, [undoRedoStack]);

  /**
   * Execute bulk operation with confirmation for dangerous operations
   */
  const executeOperation = useCallback(
    async (type: BulkOperationType, items: BulkOperationItem[], metadata?: any) => {
      // Validate operation
      const validation = validateBulkOperation(type, items);
      if (!validation.valid) {
        const error = new Error(validation.errors.join(', '));
        onError?.(error);
        return;
      }

      // Check if confirmation is needed
      const isDangerous = type === 'delete' || (type === 'apply-discount' && items.length > 10);
      if (isDangerous && !pendingOperation) {
        setPendingOperation({ type, items, metadata });
        setConfirmationRequired(true);

        // Set confirmation message based on operation type
        if (type === 'delete') {
          setConfirmationMessage(
            items.length === 1
              ? 'คุณแน่ใจหรือว่าต้องการลบรายการนี้? / Are you sure you want to delete this item?'
              : `คุณแน่ใจหรือว่าต้องการลบ ${items.length} รายการ? / Are you sure you want to delete ${items.length} items?`
          );
        } else {
          setConfirmationMessage(
            `คุณแน่ใจหรือว่าต้องการใช้การดำเนินการนี้กับ ${items.length} รายการ? / Are you sure you want to apply this operation to ${items.length} items?`
          );
        }
        return;
      }

      // Create operation
      const operation: BatchOperation = {
        id: generateOperationId(),
        type,
        items,
        progress: 0,
        status: 'pending',
        totalItems: items.length,
        processedItems: 0,
        failedItems: 0,
        errors: [],
        metadata,
      };

      setCurrentOperation(operation);
      setIsRunning(true);
      setProgress(0);
      setErrors([]);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        // Update operation status to running
        operation.status = 'running';
        operation.startTime = new Date();
        setCurrentOperation({ ...operation });

        // Execute the operation based on type
        let result: BulkOperationResult;

        const progressCallback = (prog: number) => {
          setProgress(prog);
          onProgress?.(prog);
          operation.progress = prog;
          operation.processedItems = Math.floor((prog / 100) * items.length);
          setCurrentOperation({ ...operation });
        };

        switch (type) {
          case 'update-price':
            result = await bulkUpdatePrices(
              orderId,
              items.map((item) => ({ itemId: item.id, price: item.price! })),
              progressCallback,
              abortControllerRef.current.signal
            );
            break;

          case 'update-quantity':
            result = await bulkUpdateQuantities(
              orderId,
              items.map((item) => ({ itemId: item.id, quantity: item.quantity! })),
              progressCallback,
              abortControllerRef.current.signal
            );
            break;

          case 'apply-discount':
            result = await bulkApplyDiscount(
              orderId,
              items.map((item) => ({ itemId: item.id, discount: item.discount! })),
              progressCallback,
              abortControllerRef.current.signal
            );
            break;

          case 'remove-discount':
            result = await bulkRemoveDiscount(
              orderId,
              items.map((item) => item.id),
              progressCallback,
              abortControllerRef.current.signal
            );
            break;

          case 'delete':
            result = await bulkDeleteItems(
              orderId,
              items.map((item) => item.id),
              progressCallback,
              abortControllerRef.current.signal
            );
            break;

          default:
            throw new Error(`Unknown operation type: ${type}`);
        }

        // Update operation with results
        operation.status = result.success ? 'completed' : 'failed';
        operation.endTime = new Date();
        operation.duration = result.duration;
        operation.processedItems = result.updatedCount;
        operation.failedItems = result.failedCount;
        operation.errors = result.errors;
        operation.progress = 100;

        setCurrentOperation({ ...operation });
        setErrors(result.errors);

        // Add to history
        const historyEntry: OperationHistoryEntry = {
          id: operation.id,
          operation,
          timestamp: new Date(),
          undoable: type !== 'delete', // Delete operations are not undoable
          previousState: itemsSnapshotRef.current,
        };

        setHistory((prev) => [historyEntry, ...prev]);

        // Add to undo stack if undoable
        if (historyEntry.undoable) {
          setUndoRedoStack((prev) => ({
            undoStack: [historyEntry, ...prev.undoStack],
            redoStack: [], // Clear redo stack on new operation
          }));
        }

        // Call success callback
        if (result.success) {
          onSuccess?.(result);
        } else {
          onError?.(new Error(`Operation partially failed: ${result.failedCount} items failed`));
        }
      } catch (error) {
        operation.status = 'failed';
        operation.endTime = new Date();
        operation.duration = operation.startTime
          ? Date.now() - operation.startTime.getTime()
          : 0;
        setCurrentOperation({ ...operation });

        const err = error instanceof Error ? error : new Error('Unknown error occurred');
        onError?.(err);
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
        itemsSnapshotRef.current = null;
        setPendingOperation(null);
        setConfirmationRequired(false);
      }
    },
    [orderId, onSuccess, onError, onProgress, pendingOperation]
  );

  /**
   * Cancel the current operation
   */
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current && isRunning) {
      abortControllerRef.current.abort();
      setIsRunning(false);

      if (currentOperation) {
        currentOperation.status = 'cancelled';
        currentOperation.endTime = new Date();
        currentOperation.duration = currentOperation.startTime
          ? Date.now() - currentOperation.startTime.getTime()
          : 0;
        setCurrentOperation({ ...currentOperation });
      }
    }
  }, [isRunning, currentOperation]);

  /**
   * Clear operation history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setUndoRedoStack({ undoStack: [], redoStack: [] });
    clearOperationHistory();
  }, []);

  /**
   * Get operation statistics
   */
  const getOperationStats = useCallback(() => {
    return calculateOperationStats(history);
  }, [history]);

  /**
   * Undo last operation
   */
  const undo = useCallback(async () => {
    if (undoRedoStack.undoStack.length === 0) return;

    const entry = undoRedoStack.undoStack[0];
    if (!entry.previousState) return;

    // TODO: Implement actual undo by restoring previous state
    // This would require API endpoints to restore item states

    setUndoRedoStack((prev) => ({
      undoStack: prev.undoStack.slice(1),
      redoStack: [entry, ...prev.redoStack],
    }));
  }, [undoRedoStack]);

  /**
   * Redo last undone operation
   */
  const redo = useCallback(async () => {
    if (undoRedoStack.redoStack.length === 0) return;

    const entry = undoRedoStack.redoStack[0];

    // TODO: Implement actual redo by re-applying the operation
    // This would require re-executing the operation

    setUndoRedoStack((prev) => ({
      undoStack: [entry, ...prev.undoStack],
      redoStack: prev.redoStack.slice(1),
    }));
  }, [undoRedoStack]);

  /**
   * Confirm pending operation
   */
  const confirmOperation = useCallback(() => {
    if (!pendingOperation) return;

    const { type, items, metadata } = pendingOperation;
    setPendingOperation(null);
    setConfirmationRequired(false);

    // Execute the operation
    executeOperation(type, items, metadata);
  }, [pendingOperation, executeOperation]);

  /**
   * Cancel confirmation
   */
  const cancelConfirmation = useCallback(() => {
    setPendingOperation(null);
    setConfirmationRequired(false);
    setConfirmationMessage('');
  }, []);

  return {
    currentOperation,
    isRunning,
    progress,
    executeOperation,
    cancelOperation,
    history,
    clearHistory,
    getOperationStats,
    canUndo: undoRedoStack.undoStack.length > 0,
    canRedo: undoRedoStack.redoStack.length > 0,
    undo,
    redo,
    confirmationRequired,
    confirmationMessage,
    confirmOperation,
    cancelConfirmation,
    errors,
  };
}

/**
 * Hook for quick bulk operations on items
 */
export function useQuickBulkOperations(items: OrderItem[]) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const selectAll = useCallback(() => {
    setSelectedItems(items.map((item) => item.id!));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }, []);

  const isSelected = useCallback(
    (itemId: string) => {
      return selectedItems.includes(itemId);
    },
    [selectedItems]
  );

  const getSelectedItems = useCallback(() => {
    return items.filter((item) => selectedItems.includes(item.id!));
  }, [items, selectedItems]);

  return {
    selectedItems,
    selectAll,
    deselectAll,
    toggleItem,
    isSelected,
    getSelectedItems,
    selectedCount: selectedItems.length,
    totalCount: items.length,
    allSelected: selectedItems.length === items.length && items.length > 0,
    noneSelected: selectedItems.length === 0,
  };
}
