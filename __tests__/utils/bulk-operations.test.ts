/**
 * Bulk Operations Tests
 * Tests for bulk update, delete, and undo/redo functionality
 */

import {
  generateOperationId,
  calculateProgress,
  bulkUpdatePrices,
  bulkUpdateQuantities,
  bulkApplyDiscount,
  bulkRemoveDiscount,
  bulkDeleteItems,
  applyDiscountToItems,
  calculateTotalDiscount,
  increaseQuantities,
  decreaseQuantities,
  setQuantityForAll,
  setPriceForAll,
  calculateOperationStats,
  formatDuration,
  createItemSnapshot,
  validateBulkOperation,
  saveOperationHistory,
  loadOperationHistory,
  saveUndoRedoStack,
  loadUndoRedoStack,
  clearOperationHistory,
} from '@/lib/utils/bulk-operations';
import {
  createMockOrderItem,
  createMockOrderItems,
  createMockAbortSignal,
  mockFetchSuccess,
  mockFetchError,
} from '../factories';
import type { OrderItem } from '@/types';

describe('Bulk Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('generateOperationId', () => {
    it('should generate unique operation IDs', () => {
      const id1 = generateOperationId();
      const id2 = generateOperationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format', () => {
      const id = generateOperationId();
      expect(id).toMatch(/^op-\d+-[a-z0-9]+$/);
    });

    it('should generate multiple unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateOperationId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress correctly', () => {
      expect(calculateProgress(0, 100)).toBe(0);
      expect(calculateProgress(50, 100)).toBe(50);
      expect(calculateProgress(100, 100)).toBe(100);
    });

    it('should handle zero total', () => {
      expect(calculateProgress(0, 0)).toBe(0);
    });

    it('should round progress to nearest integer', () => {
      expect(calculateProgress(1, 3)).toBe(33);
      expect(calculateProgress(2, 3)).toBe(67);
    });

    it('should handle large numbers', () => {
      expect(calculateProgress(500, 1000)).toBe(50);
      expect(calculateProgress(999, 1000)).toBe(100);
    });
  });

  describe('bulkUpdatePrices', () => {
    it('should update prices successfully', async () => {
      const items = [
        { itemId: 'item1', price: 100 },
        { itemId: 'item2', price: 200 },
      ];

      mockFetchSuccess({});
      mockFetchSuccess({});

      const result = await bulkUpdatePrices('order1', items);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should track progress during updates', async () => {
      const items = [
        { itemId: 'item1', price: 100 },
        { itemId: 'item2', price: 200 },
        { itemId: 'item3', price: 300 },
      ];

      const progressValues: number[] = [];
      const onProgress = (progress: number) => {
        progressValues.push(progress);
      };

      mockFetchSuccess({});
      mockFetchSuccess({});
      mockFetchSuccess({});

      await bulkUpdatePrices('order1', items, onProgress);

      expect(progressValues).toEqual([33, 67, 100]);
    });

    it('should handle partial failures', async () => {
      const items = [
        { itemId: 'item1', price: 100 },
        { itemId: 'item2', price: 200 },
        { itemId: 'item3', price: 300 },
      ];

      mockFetchSuccess({});
      mockFetchError({ error: 'Update failed' });
      mockFetchSuccess({});

      const result = await bulkUpdatePrices('order1', items);

      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(2);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].itemId).toBe('item2');
    });

    it('should handle cancellation via AbortSignal', async () => {
      const items = [
        { itemId: 'item1', price: 100 },
        { itemId: 'item2', price: 200 },
      ];

      const signal = createMockAbortSignal(true);

      const result = await bulkUpdatePrices('order1', items, undefined, signal);

      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(0);
    });

    it('should record duration', async () => {
      const items = [{ itemId: 'item1', price: 100 }];
      mockFetchSuccess({});

      const result = await bulkUpdatePrices('order1', items);

      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle network errors', async () => {
      const items = [{ itemId: 'item1', price: 100 }];

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await bulkUpdatePrices('order1', items);

      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.errors[0].error).toContain('Network error');
    });
  });

  describe('bulkUpdateQuantities', () => {
    it('should update quantities successfully', async () => {
      const items = [
        { itemId: 'item1', quantity: 5 },
        { itemId: 'item2', quantity: 10 },
      ];

      mockFetchSuccess({});
      mockFetchSuccess({});

      const result = await bulkUpdateQuantities('order1', items);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
    });

    it('should handle AbortError correctly', async () => {
      const items = [
        { itemId: 'item1', quantity: 5 },
        { itemId: 'item2', quantity: 10 },
      ];

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      const result = await bulkUpdateQuantities('order1', items);

      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(0);
    });
  });

  describe('bulkApplyDiscount', () => {
    it('should apply discounts successfully', async () => {
      const items = [
        { itemId: 'item1', discount: 10 },
        { itemId: 'item2', discount: 20 },
      ];

      mockFetchSuccess({});
      mockFetchSuccess({});

      const result = await bulkApplyDiscount('order1', items);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
    });

    it('should call progress callback', async () => {
      const items = [
        { itemId: 'item1', discount: 10 },
      ];

      let progressCalled = false;
      const onProgress = () => {
        progressCalled = true;
      };

      mockFetchSuccess({});

      await bulkApplyDiscount('order1', items, onProgress);

      expect(progressCalled).toBe(true);
    });
  });

  describe('bulkRemoveDiscount', () => {
    it('should remove discounts by setting to 0', async () => {
      const itemIds = ['item1', 'item2'];

      mockFetchSuccess({});
      mockFetchSuccess({});

      const result = await bulkRemoveDiscount('order1', itemIds);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
    });
  });

  describe('bulkDeleteItems', () => {
    it('should delete items successfully', async () => {
      const itemIds = ['item1', 'item2', 'item3'];

      mockFetchSuccess({});
      mockFetchSuccess({});
      mockFetchSuccess({});

      const result = await bulkDeleteItems('order1', itemIds);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
      expect(result.failedCount).toBe(0);
    });

    it('should handle delete failures', async () => {
      const itemIds = ['item1', 'item2'];

      mockFetchSuccess({});
      mockFetchError({ error: 'Delete failed' });

      const result = await bulkDeleteItems('order1', itemIds);

      expect(result.success).toBe(false);
      expect(result.updatedCount).toBe(1);
      expect(result.failedCount).toBe(1);
    });
  });

  describe('applyDiscountToItems', () => {
    it('should apply percentage discount to all items', () => {
      const items = [
        createMockOrderItem({ id: 'item1', price: 100, quantity: 2 }),
        createMockOrderItem({ id: 'item2', price: 200, quantity: 1 }),
      ];

      const result = applyDiscountToItems(items, 10);

      expect(result).toHaveLength(2);
      expect(result[0].discount).toBe(20); // 10% of 200
      expect(result[1].discount).toBe(20); // 10% of 200
    });

    it('should apply discount only to specified items', () => {
      const items = [
        createMockOrderItem({ id: 'item1', price: 100, quantity: 1 }),
        createMockOrderItem({ id: 'item2', price: 200, quantity: 1 }),
        createMockOrderItem({ id: 'item3', price: 300, quantity: 1 }),
      ];

      const result = applyDiscountToItems(items, 10, ['item1', 'item3']);

      expect(result).toHaveLength(2);
      expect(result.find(i => i.id === 'item1')).toBeDefined();
      expect(result.find(i => i.id === 'item3')).toBeDefined();
    });

    it('should calculate discount correctly with quantities', () => {
      const items = [
        createMockOrderItem({ id: 'item1', price: 50, quantity: 4 }),
      ];

      const result = applyDiscountToItems(items, 25);

      expect(result[0].discount).toBe(50); // 25% of (50 * 4)
    });
  });

  describe('calculateTotalDiscount', () => {
    it('should calculate total discount from items', () => {
      const items = [
        createMockOrderItem({ discount: 10 }),
        createMockOrderItem({ discount: 20 }),
        createMockOrderItem({ discount: 30 }),
      ];

      const total = calculateTotalDiscount(items);

      expect(total).toBe(60);
    });

    it('should handle items without discount', () => {
      const items = [
        createMockOrderItem({ discount: 10 }),
        createMockOrderItem({}),
        createMockOrderItem({ discount: 20 }),
      ];

      const total = calculateTotalDiscount(items);

      expect(total).toBe(30);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTotalDiscount([])).toBe(0);
    });
  });

  describe('increaseQuantities', () => {
    it('should increase quantities for all items', () => {
      const items = [
        createMockOrderItem({ id: 'item1', quantity: 5 }),
        createMockOrderItem({ id: 'item2', quantity: 10 }),
      ];

      const result = increaseQuantities(items, 3);

      expect(result[0].quantity).toBe(8);
      expect(result[1].quantity).toBe(13);
    });

    it('should increase quantities for selected items only', () => {
      const items = [
        createMockOrderItem({ id: 'item1', quantity: 5 }),
        createMockOrderItem({ id: 'item2', quantity: 10 }),
      ];

      const result = increaseQuantities(items, 2, ['item1']);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(7);
    });

    it('should enforce minimum quantity of 1', () => {
      const items = [
        createMockOrderItem({ id: 'item1', quantity: 5 }),
      ];

      const result = increaseQuantities(items, -10);

      expect(result[0].quantity).toBe(1);
    });
  });

  describe('decreaseQuantities', () => {
    it('should decrease quantities for all items', () => {
      const items = [
        createMockOrderItem({ id: 'item1', quantity: 10 }),
        createMockOrderItem({ id: 'item2', quantity: 15 }),
      ];

      const result = decreaseQuantities(items, 5);

      expect(result[0].quantity).toBe(5);
      expect(result[1].quantity).toBe(10);
    });

    it('should not go below minimum quantity of 1', () => {
      const items = [
        createMockOrderItem({ id: 'item1', quantity: 3 }),
      ];

      const result = decreaseQuantities(items, 5);

      expect(result[0].quantity).toBe(1);
    });
  });

  describe('setQuantityForAll', () => {
    it('should set same quantity for all items', () => {
      const items = [
        createMockOrderItem({ id: 'item1', quantity: 5 }),
        createMockOrderItem({ id: 'item2', quantity: 10 }),
      ];

      const result = setQuantityForAll(items, 7);

      expect(result[0].quantity).toBe(7);
      expect(result[1].quantity).toBe(7);
    });

    it('should throw error for quantity less than 1', () => {
      const items = [createMockOrderItem()];

      expect(() => setQuantityForAll(items, 0)).toThrow('Quantity must be at least 1');
    });

    it('should apply to selected items only', () => {
      const items = [
        createMockOrderItem({ id: 'item1', quantity: 5 }),
        createMockOrderItem({ id: 'item2', quantity: 10 }),
      ];

      const result = setQuantityForAll(items, 3, ['item2']);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item2');
      expect(result[0].quantity).toBe(3);
    });
  });

  describe('setPriceForAll', () => {
    it('should set same price for all items', () => {
      const items = [
        createMockOrderItem({ id: 'item1', price: 100 }),
        createMockOrderItem({ id: 'item2', price: 200 }),
      ];

      const result = setPriceForAll(items, 150);

      expect(result[0].price).toBe(150);
      expect(result[1].price).toBe(150);
    });

    it('should throw error for negative price', () => {
      const items = [createMockOrderItem()];

      expect(() => setPriceForAll(items, -10)).toThrow('Price must be non-negative');
    });

    it('should allow zero price', () => {
      const items = [createMockOrderItem()];

      const result = setPriceForAll(items, 0);

      expect(result[0].price).toBe(0);
    });
  });

  describe('calculateOperationStats', () => {
    it('should calculate statistics from operation history', () => {
      const operations = [
        {
          id: 'op1',
          operation: {
            id: 'op1',
            type: 'update-price' as const,
            items: [],
            progress: 100,
            status: 'completed' as const,
            totalItems: 10,
            processedItems: 10,
            failedItems: 0,
            errors: [],
            duration: 1000,
          },
          timestamp: new Date(),
          undoable: true,
        },
        {
          id: 'op2',
          operation: {
            id: 'op2',
            type: 'delete' as const,
            items: [],
            progress: 100,
            status: 'failed' as const,
            totalItems: 5,
            processedItems: 3,
            failedItems: 2,
            errors: [],
            duration: 500,
          },
          timestamp: new Date(),
          undoable: false,
        },
      ];

      const stats = calculateOperationStats(operations);

      expect(stats.totalOperations).toBe(2);
      expect(stats.successfulOperations).toBe(1);
      expect(stats.failedOperations).toBe(1);
      expect(stats.totalItemsProcessed).toBe(13);
      expect(stats.totalItemsFailed).toBe(2);
      expect(stats.averageDuration).toBe(750);
      expect(stats.successRate).toBe(50);
    });

    it('should handle empty operation history', () => {
      const stats = calculateOperationStats([]);

      expect(stats.totalOperations).toBe(0);
      expect(stats.successfulOperations).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(59000)).toBe('59s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });
  });

  describe('createItemSnapshot', () => {
    it('should create snapshot of items', () => {
      const items = [
        createMockOrderItem({ id: 'item1', price: 100, quantity: 2 }),
        createMockOrderItem({ id: 'item2', price: 200, quantity: 1 }),
      ];

      const snapshot = createItemSnapshot(items);

      expect(snapshot).toHaveLength(2);
      expect(snapshot[0]).toHaveProperty('id');
      expect(snapshot[0]).toHaveProperty('price');
      expect(snapshot[0]).toHaveProperty('quantity');
    });
  });

  describe('validateBulkOperation', () => {
    it('should validate update-price operation', () => {
      const items = [
        { id: 'item1', price: 100 },
        { id: 'item2', price: 200 },
      ];

      const result = validateBulkOperation('update-price', items);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty items array', () => {
      const result = validateBulkOperation('update-price', []);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No items selected for operation');
    });

    it('should reject items missing ID', () => {
      const items = [
        { price: 100 },
      ];

      const result = validateBulkOperation('update-price', items as any);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('missing ID');
    });

    it('should reject invalid price in update-price operation', () => {
      const items = [
        { id: 'item1', price: -10 },
      ];

      const result = validateBulkOperation('update-price', items);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('invalid price');
    });

    it('should reject invalid quantity in update-quantity operation', () => {
      const items = [
        { id: 'item1', quantity: 0 },
      ];

      const result = validateBulkOperation('update-quantity', items);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('invalid quantity');
    });

    it('should reject invalid discount in apply-discount operation', () => {
      const items = [
        { id: 'item1', discount: -5 },
      ];

      const result = validateBulkOperation('apply-discount', items);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('invalid discount');
    });
  });

  describe('localStorage operations', () => {
    it('should save and load operation history', () => {
      const history = [
        {
          id: 'op1',
          operation: {
            id: 'op1',
            type: 'update-price' as const,
            items: [],
            progress: 100,
            status: 'completed' as const,
            totalItems: 5,
            processedItems: 5,
            failedItems: 0,
            errors: [],
            startTime: new Date(),
            endTime: new Date(),
          },
          timestamp: new Date(),
          undoable: true,
        },
      ];

      saveOperationHistory(history);
      const loaded = loadOperationHistory();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('op1');
    });

    it('should save and load undo/redo stack', () => {
      const stack = {
        undoStack: [
          {
            id: 'op1',
            operation: {
              id: 'op1',
              type: 'update-price' as const,
              items: [],
              progress: 100,
              status: 'completed' as const,
              totalItems: 5,
              processedItems: 5,
              failedItems: 0,
              errors: [],
            },
            timestamp: new Date(),
            undoable: true,
          },
        ],
        redoStack: [],
      };

      saveUndoRedoStack(stack);
      const loaded = loadUndoRedoStack();

      expect(loaded.undoStack).toHaveLength(1);
      expect(loaded.redoStack).toHaveLength(0);
    });

    it('should clear operation history', () => {
      const history = [
        {
          id: 'op1',
          operation: {
            id: 'op1',
            type: 'update-price' as const,
            items: [],
            progress: 100,
            status: 'completed' as const,
            totalItems: 5,
            processedItems: 5,
            failedItems: 0,
            errors: [],
          },
          timestamp: new Date(),
          undoable: true,
        },
      ];

      saveOperationHistory(history);
      clearOperationHistory();
      const loaded = loadOperationHistory();

      expect(loaded).toHaveLength(0);
    });

    it('should limit history to MAX_HISTORY_SIZE', () => {
      const history = Array.from({ length: 100 }, (_, i) => ({
        id: `op${i}`,
        operation: {
          id: `op${i}`,
          type: 'update-price' as const,
          items: [],
          progress: 100,
          status: 'completed' as const,
          totalItems: 1,
          processedItems: 1,
          failedItems: 0,
          errors: [],
        },
        timestamp: new Date(),
        undoable: true,
      }));

      saveOperationHistory(history);
      const loaded = loadOperationHistory();

      expect(loaded.length).toBeLessThanOrEqual(50);
    });
  });
});
