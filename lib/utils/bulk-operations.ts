import type { OrderItem } from '@/types';

export interface BulkUpdateItem {
  itemId: string;
  quantity?: number;
  price?: number;
  discount?: number;
}

export interface BulkOperationResult {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors: { itemId: string; error: string }[];
}

/**
 * Bulk update quantities for multiple items
 */
export async function bulkUpdateQuantities(
  orderId: string,
  updates: { itemId: string; quantity: number }[]
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
  };

  for (const update of updates) {
    try {
      const response = await fetch(
        `/api/orders/${orderId}/items/${update.itemId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: update.quantity }),
        }
      );

      if (response.ok) {
        result.updatedCount++;
      } else {
        result.failedCount++;
        const errorData = await response.json();
        result.errors.push({
          itemId: update.itemId,
          error: errorData.error || 'Update failed',
        });
        result.success = false;
      }
    } catch (error) {
      result.failedCount++;
      result.errors.push({
        itemId: update.itemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.success = false;
    }
  }

  return result;
}

/**
 * Bulk delete items
 */
export async function bulkDeleteItems(
  orderId: string,
  itemIds: string[]
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = {
    success: true,
    updatedCount: 0,
    failedCount: 0,
    errors: [],
  };

  for (const itemId of itemIds) {
    try {
      const response = await fetch(
        `/api/orders/${orderId}/items/${itemId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        result.updatedCount++;
      } else {
        result.failedCount++;
        const errorData = await response.json();
        result.errors.push({
          itemId,
          error: errorData.error || 'Delete failed',
        });
        result.success = false;
      }
    } catch (error) {
      result.failedCount++;
      result.errors.push({
        itemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.success = false;
    }
  }

  return result;
}

/**
 * Apply discount to multiple items
 */
export function applyDiscountToItems(
  items: OrderItem[],
  discountPercent: number,
  itemIds?: string[]
): BulkUpdateItem[] {
  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      itemId: item.id!,
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
 * Increase quantity for multiple items
 */
export function increaseQuantities(
  items: OrderItem[],
  increaseBy: number,
  itemIds?: string[]
): BulkUpdateItem[] {
  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      itemId: item.id!,
      quantity: Math.max(1, item.quantity + increaseBy),
    }));
}

/**
 * Decrease quantity for multiple items
 */
export function decreaseQuantities(
  items: OrderItem[],
  decreaseBy: number,
  itemIds?: string[]
): BulkUpdateItem[] {
  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      itemId: item.id!,
      quantity: Math.max(1, item.quantity - decreaseBy),
    }));
}

/**
 * Set quantity for multiple items to same value
 */
export function setQuantityForAll(
  items: OrderItem[],
  quantity: number,
  itemIds?: string[]
): BulkUpdateItem[] {
  if (quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  return items
    .filter((item) => !itemIds || itemIds.includes(item.id!))
    .map((item) => ({
      itemId: item.id!,
      quantity,
    }));
}
