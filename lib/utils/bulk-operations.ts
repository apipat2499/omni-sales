/**
 * Comprehensive Bulk Operations Manager
 * Supports batch operations with progress tracking, undo/redo, and operation history
 */

import type { OrderItem, Product, Order, Customer } from '@/lib/types';
import { showToast } from './toast';

// ===========================
// Types and Interfaces
// ===========================

export type BulkOperationType =
  | 'update-price'
  | 'update-quantity'
  | 'apply-discount'
  | 'remove-discount'
  | 'delete';

export interface BulkOperationItem {
  id: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  discount?: number;
  notes?: string;
}

export interface BatchOperation {
  id: string;
  type: BulkOperationType;
  items: BulkOperationItem[];
  progress: number; // 0-100
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: { itemId: string; error: string }[];
  startTime?: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  metadata?: {
    value?: number; // for price updates, discount percentage
    increaseBy?: number; // for quantity changes
    decreaseBy?: number;
  };
}

export interface BulkOperationResult {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors: { itemId: string; error: string }[];
  duration: number;
}

export interface OperationHistoryEntry {
  id: string;
  operation: BatchOperation;
  timestamp: Date;
  undoable: boolean;
  previousState?: any; // Store previous state for undo
}

export interface UndoRedoStack {
  undoStack: OperationHistoryEntry[];
  redoStack: OperationHistoryEntry[];
}

// ===========================
// Constants
// ===========================

const OPERATION_HISTORY_KEY = 'bulk-operations-history';
const MAX_HISTORY_SIZE = 50;
const UNDO_STACK_KEY = 'bulk-operations-undo-stack';
const MAX_UNDO_STACK_SIZE = 20;

// ===========================
// Utility Functions
// ===========================

/**
 * Generate unique operation ID
 */
export function generateOperationId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate operation progress percentage
 */
export function calculateProgress(processed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((processed / total) * 100);
}

// ===========================
// LocalStorage Persistence
// ===========================

/**
 * Save operation history to localStorage
 */
export function saveOperationHistory(history: OperationHistoryEntry[]): void {
  try {
    if (typeof window === 'undefined') return;

    const limitedHistory = history.slice(0, MAX_HISTORY_SIZE);
    const serialized = JSON.stringify(limitedHistory, (key, value) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    });

    localStorage.setItem(OPERATION_HISTORY_KEY, serialized);
  } catch (error) {
    console.error('Failed to save operation history:', error);
  }
}

/**
 * Load operation history from localStorage
 */
export function loadOperationHistory(): OperationHistoryEntry[] {
  try {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(OPERATION_HISTORY_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
      operation: {
        ...entry.operation,
        startTime: entry.operation.startTime ? new Date(entry.operation.startTime) : undefined,
        endTime: entry.operation.endTime ? new Date(entry.operation.endTime) : undefined,
      },
    }));
  } catch (error) {
    console.error('Failed to load operation history:', error);
    return [];
  }
}

/**
 * Save undo/redo stack to localStorage
 */
export function saveUndoRedoStack(stack: UndoRedoStack): void {
  try {
    if (typeof window === 'undefined') return;

    const limitedStack = {
      undoStack: stack.undoStack.slice(0, MAX_UNDO_STACK_SIZE),
      redoStack: stack.redoStack.slice(0, MAX_UNDO_STACK_SIZE),
    };

    const serialized = JSON.stringify(limitedStack, (key, value) => {
      if (value instanceof Date) return value.toISOString();
      return value;
    });

    localStorage.setItem(UNDO_STACK_KEY, serialized);
  } catch (error) {
    console.error('Failed to save undo/redo stack:', error);
  }
}

/**
 * Load undo/redo stack from localStorage
 */
export function loadUndoRedoStack(): UndoRedoStack {
  try {
    if (typeof window === 'undefined') return { undoStack: [], redoStack: [] };

    const stored = localStorage.getItem(UNDO_STACK_KEY);
    if (!stored) return { undoStack: [], redoStack: [] };

    const parsed = JSON.parse(stored);
    return {
      undoStack: parsed.undoStack.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        operation: {
          ...entry.operation,
          startTime: entry.operation.startTime ? new Date(entry.operation.startTime) : undefined,
          endTime: entry.operation.endTime ? new Date(entry.operation.endTime) : undefined,
        },
      })),
      redoStack: parsed.redoStack.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        operation: {
          ...entry.operation,
          startTime: entry.operation.startTime ? new Date(entry.operation.startTime) : undefined,
          endTime: entry.operation.endTime ? new Date(entry.operation.endTime) : undefined,
        },
      })),
    };
  } catch (error) {
    console.error('Failed to load undo/redo stack:', error);
    return { undoStack: [], redoStack: [] };
  }
}

/**
 * Clear operation history
 */
export function clearOperationHistory(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(OPERATION_HISTORY_KEY);
    localStorage.removeItem(UNDO_STACK_KEY);
  } catch (error) {
    console.error('Failed to clear operation history:', error);
  }
}

// ===========================
// Bulk Operations
// ===========================

/**
 * Update prices for multiple items
 */
export async function bulkUpdatePrices(
  orderId: string,
  items: { itemId: string; price: number }[],
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<BulkOperationResult> {
  const startTime = Date.now();
  const result: BulkOperationResult = {
    success: true,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
    duration: 0,
  };

  for (let i = 0; i < items.length; i++) {
    // Check if operation was cancelled
    if (signal?.aborted) {
      result.success = false;
      break;
    }

    const item = items[i];
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${item.itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: item.price }),
        signal,
      });

      if (response.ok) {
        result.updatedCount++;
      } else {
        result.failedCount++;
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        result.errors.push({
          itemId: item.itemId,
          error: errorData.error || 'Update failed',
        });
        result.success = false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        result.success = false;
        break;
      }

      result.failedCount++;
      result.errors.push({
        itemId: item.itemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.success = false;
    }

    // Update progress
    if (onProgress) {
      const progress = calculateProgress(i + 1, items.length);
      onProgress(progress);
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Update quantities for multiple items
 */
export async function bulkUpdateQuantities(
  orderId: string,
  items: { itemId: string; quantity: number }[],
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<BulkOperationResult> {
  const startTime = Date.now();
  const result: BulkOperationResult = {
    success: true,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
    duration: 0,
  };

  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) {
      result.success = false;
      break;
    }

    const item = items[i];
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${item.itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.quantity }),
        signal,
      });

      if (response.ok) {
        result.updatedCount++;
      } else {
        result.failedCount++;
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        result.errors.push({
          itemId: item.itemId,
          error: errorData.error || 'Update failed',
        });
        result.success = false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        result.success = false;
        break;
      }

      result.failedCount++;
      result.errors.push({
        itemId: item.itemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.success = false;
    }

    if (onProgress) {
      const progress = calculateProgress(i + 1, items.length);
      onProgress(progress);
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Apply discount to multiple items
 */
export async function bulkApplyDiscount(
  orderId: string,
  items: { itemId: string; discount: number }[],
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<BulkOperationResult> {
  const startTime = Date.now();
  const result: BulkOperationResult = {
    success: true,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
    duration: 0,
  };

  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) {
      result.success = false;
      break;
    }

    const item = items[i];
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${item.itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount: item.discount }),
        signal,
      });

      if (response.ok) {
        result.updatedCount++;
      } else {
        result.failedCount++;
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }));
        result.errors.push({
          itemId: item.itemId,
          error: errorData.error || 'Update failed',
        });
        result.success = false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        result.success = false;
        break;
      }

      result.failedCount++;
      result.errors.push({
        itemId: item.itemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.success = false;
    }

    if (onProgress) {
      const progress = calculateProgress(i + 1, items.length);
      onProgress(progress);
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Remove discount from multiple items
 */
export async function bulkRemoveDiscount(
  orderId: string,
  itemIds: string[],
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<BulkOperationResult> {
  const items = itemIds.map(itemId => ({ itemId, discount: 0 }));
  return bulkApplyDiscount(orderId, items, onProgress, signal);
}

/**
 * Delete multiple items
 */
export async function bulkDeleteItems(
  orderId: string,
  itemIds: string[],
  onProgress?: (progress: number) => void,
  signal?: AbortSignal
): Promise<BulkOperationResult> {
  const startTime = Date.now();
  const result: BulkOperationResult = {
    success: true,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
    duration: 0,
  };

  for (let i = 0; i < itemIds.length; i++) {
    if (signal?.aborted) {
      result.success = false;
      break;
    }

    const itemId = itemIds[i];
    try {
      const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'DELETE',
        signal,
      });

      if (response.ok) {
        result.updatedCount++;
      } else {
        result.failedCount++;
        const errorData = await response.json().catch(() => ({ error: 'Delete failed' }));
        result.errors.push({
          itemId,
          error: errorData.error || 'Delete failed',
        });
        result.success = false;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        result.success = false;
        break;
      }

      result.failedCount++;
      result.errors.push({
        itemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.success = false;
    }

    if (onProgress) {
      const progress = calculateProgress(i + 1, itemIds.length);
      onProgress(progress);
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

// ===========================
// Helper Functions
// ===========================

/**
 * Apply discount percentage to items
 */
export function applyDiscountToItems(
  items: OrderItem[],
  discountPercent: number,
  itemIds?: string[]
): BulkOperationItem[] {
  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      id: item.id!,
      productId: item.productId,
      productName: item.productName,
      discount: item.price * item.quantity * (discountPercent / 100),
    }));
}

/**
 * Calculate total discount for items
 */
export function calculateTotalDiscount(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.discount || 0), 0);
}

/**
 * Increase quantities for multiple items
 */
export function increaseQuantities(
  items: OrderItem[],
  increaseBy: number,
  itemIds?: string[]
): BulkOperationItem[] {
  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      id: item.id!,
      productId: item.productId,
      productName: item.productName,
      quantity: Math.max(1, item.quantity + increaseBy),
    }));
}

/**
 * Decrease quantities for multiple items
 */
export function decreaseQuantities(
  items: OrderItem[],
  decreaseBy: number,
  itemIds?: string[]
): BulkOperationItem[] {
  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      id: item.id!,
      productId: item.productId,
      productName: item.productName,
      quantity: Math.max(1, item.quantity - decreaseBy),
    }));
}

/**
 * Set quantity for all items to same value
 */
export function setQuantityForAll(
  items: OrderItem[],
  quantity: number,
  itemIds?: string[]
): BulkOperationItem[] {
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      id: item.id!,
      productId: item.productId,
      productName: item.productName,
      quantity,
    }));
}

/**
 * Set price for all items to same value
 */
export function setPriceForAll(
  items: OrderItem[],
  price: number,
  itemIds?: string[]
): BulkOperationItem[] {
  if (price < 0) {
    throw new Error('Price must be non-negative');
  }

  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      id: item.id!,
      productId: item.productId,
      productName: item.productName,
      price,
    }));
}

/**
 * Calculate operation statistics
 */
export function calculateOperationStats(operations: OperationHistoryEntry[]) {
  const totalOperations = operations.length;
  const successfulOperations = operations.filter(
    (op) => op.operation.status === 'completed' && op.operation.failedItems === 0
  ).length;
  const failedOperations = operations.filter(
    (op) => op.operation.status === 'failed'
  ).length;
  const totalItemsProcessed = operations.reduce(
    (sum, op) => sum + op.operation.processedItems,
    0
  );
  const totalItemsFailed = operations.reduce(
    (sum, op) => sum + op.operation.failedItems,
    0
  );
  const averageDuration =
    operations.reduce((sum, op) => sum + (op.operation.duration || 0), 0) /
    (totalOperations || 1);

  return {
    totalOperations,
    successfulOperations,
    failedOperations,
    totalItemsProcessed,
    totalItemsFailed,
    averageDuration,
    successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
  };
}

/**
 * Format operation duration in human-readable form
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Create a snapshot of items for undo functionality
 */
export function createItemSnapshot(items: OrderItem[]): any {
  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    notes: item.notes,
  }));
}

/**
 * Validate bulk operation items
 */
export function validateBulkOperation(
  type: BulkOperationType,
  items: BulkOperationItem[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('No items selected for operation');
  }

  items.forEach((item, index) => {
    if (!item.id) {
      errors.push(`Item at index ${index} is missing ID`);
    }

    if (type === 'update-price' && (item.price === undefined || item.price < 0)) {
      errors.push(`Item ${item.id} has invalid price`);
    }

    if (type === 'update-quantity' && (item.quantity === undefined || item.quantity < 1)) {
      errors.push(`Item ${item.id} has invalid quantity`);
    }

    if (type === 'apply-discount' && (item.discount === undefined || item.discount < 0)) {
      errors.push(`Item ${item.id} has invalid discount`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ===========================
// Product Bulk Operations
// ===========================

/**
 * Bulk delete products
 */
export async function bulkDeleteProducts(productIds: string[]): Promise<void> {
  const toastId = showToast.loading(`กำลังลบสินค้า ${productIds.length} รายการ...`);

  try {
    const response = await fetch('/api/products/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: productIds }),
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถลบสินค้าได้');
    }

    showToast.dismiss(toastId);
    showToast.success(`ลบสินค้าสำเร็จ ${productIds.length} รายการ`);
  } catch (error) {
    showToast.dismiss(toastId);
    throw error;
  }
}

/**
 * Bulk update product field
 */
export async function bulkUpdateProducts(
  productIds: string[],
  field: keyof Product,
  value: any
): Promise<void> {
  const toastId = showToast.loading(`กำลังอัพเดทสินค้า ${productIds.length} รายการ...`);

  try {
    const response = await fetch('/api/products/bulk-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: productIds, field, value }),
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถอัพเดทสินค้าได้');
    }

    showToast.dismiss(toastId);
    showToast.success(`อัพเดทสินค้าสำเร็จ ${productIds.length} รายการ`);
  } catch (error) {
    showToast.dismiss(toastId);
    throw error;
  }
}

// ===========================
// Order Bulk Operations
// ===========================

/**
 * Bulk delete orders
 */
export async function bulkDeleteOrders(orderIds: string[]): Promise<void> {
  const toastId = showToast.loading(`กำลังลบคำสั่งซื้อ ${orderIds.length} รายการ...`);

  try {
    const response = await fetch('/api/orders/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: orderIds }),
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถลบคำสั่งซื้อได้');
    }

    showToast.dismiss(toastId);
    showToast.success(`ลบคำสั่งซื้อสำเร็จ ${orderIds.length} รายการ`);
  } catch (error) {
    showToast.dismiss(toastId);
    throw error;
  }
}

/**
 * Bulk update order status
 */
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: Order['status']
): Promise<void> {
  const toastId = showToast.loading(`กำลังอัพเดทสถานะ ${orderIds.length} รายการ...`);

  try {
    const response = await fetch('/api/orders/bulk-update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: orderIds, status }),
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถอัพเดทสถานะได้');
    }

    showToast.dismiss(toastId);
    showToast.success(`อัพเดทสถานะสำเร็จ ${orderIds.length} รายการ`);
  } catch (error) {
    showToast.dismiss(toastId);
    throw error;
  }
}

// ===========================
// Customer Bulk Operations
// ===========================

/**
 * Bulk delete customers
 */
export async function bulkDeleteCustomers(customerIds: string[]): Promise<void> {
  const toastId = showToast.loading(`กำลังลบลูกค้า ${customerIds.length} รายการ...`);

  try {
    const response = await fetch('/api/customers/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: customerIds }),
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถลบลูกค้าได้');
    }

    showToast.dismiss(toastId);
    showToast.success(`ลบลูกค้าสำเร็จ ${customerIds.length} รายการ`);
  } catch (error) {
    showToast.dismiss(toastId);
    throw error;
  }
}

// ===========================
// Export Operations
// ===========================

/**
 * Bulk export to CSV
 */
export function bulkExportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
): void {
  try {
    // Create CSV header
    const headers = columns.map((col) => col.label).join(',');

    // Create CSV rows
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          const value = item[col.key];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? '');
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',');
    });

    // Combine header and rows
    const csv = [headers, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast.success(`ส่งออก ${data.length} รายการสำเร็จ`);
  } catch (error) {
    showToast.error('ไม่สามารถส่งออกข้อมูลได้');
    throw error;
  }
}

/**
 * Bulk export to JSON
 */
export function bulkExportToJSON<T>(data: T[], filename: string): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast.success(`ส่งออก ${data.length} รายการสำเร็จ`);
  } catch (error) {
    showToast.error('ไม่สามารถส่งออกข้อมูลได้');
    throw error;
  }
}
