/**
 * Test Data Factories
 * Generates realistic test data for all types
 */

import type { OrderItem, Product } from '@/types';
import type {
  StockLevel,
  StockMovement,
  StockAlert,
} from '@/lib/utils/stock-management';
import type { TaxConfig } from '@/lib/utils/tax-calculation';
import type { OrderSchedule } from '@/lib/utils/order-scheduling';
import type { FilterCriterion, FilterGroup, SavedFilter } from '@/lib/utils/advanced-filtering';
import type { BulkOperationItem, BatchOperation } from '@/lib/utils/bulk-operations';

let idCounter = 1;

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'test'): string {
  return `${prefix}-${idCounter++}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Reset ID counter (useful between tests)
 */
export function resetIdCounter(): void {
  idCounter = 1;
}

/**
 * Create mock OrderItem
 */
export function createMockOrderItem(overrides?: Partial<OrderItem>): OrderItem {
  return {
    id: generateId('item'),
    productId: generateId('prod'),
    productName: `Test Product ${idCounter}`,
    quantity: 1,
    price: 100,
    discount: 0,
    notes: '',
    ...overrides,
  };
}

/**
 * Create mock Product
 */
export function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: generateId('prod'),
    name: `Product ${idCounter}`,
    category: 'Electronics',
    price: 100,
    cost: 50,
    stock: 10,
    sku: `SKU${idCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock StockLevel
 */
export function createMockStockLevel(overrides?: Partial<StockLevel>): StockLevel {
  return {
    productId: generateId('prod'),
    productName: `Product ${idCounter}`,
    currentStock: 50,
    minimumStock: 10,
    maximumStock: 100,
    lastUpdated: new Date(),
    status: 'in-stock',
    ...overrides,
  };
}

/**
 * Create mock StockMovement
 */
export function createMockStockMovement(overrides?: Partial<StockMovement>): StockMovement {
  return {
    id: generateId('move'),
    productId: generateId('prod'),
    type: 'in',
    quantity: 10,
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * Create mock StockAlert
 */
export function createMockStockAlert(overrides?: Partial<StockAlert>): StockAlert {
  return {
    productId: generateId('prod'),
    productName: `Product ${idCounter}`,
    type: 'low-stock',
    currentStock: 5,
    threshold: 10,
    createdAt: new Date(),
    acknowledged: false,
    ...overrides,
  };
}

/**
 * Create mock TaxConfig
 */
export function createMockTaxConfig(overrides?: Partial<TaxConfig>): TaxConfig {
  return {
    id: generateId('tax'),
    name: 'VAT',
    type: 'vat',
    rate: 7,
    isInclusive: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock OrderSchedule
 */
export function createMockOrderSchedule(overrides?: Partial<OrderSchedule>): OrderSchedule {
  const now = new Date();
  return {
    id: generateId('schedule'),
    name: `Schedule ${idCounter}`,
    items: [createMockOrderItem()],
    frequency: 'daily',
    startDate: now,
    time: '09:00',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create mock FilterCriterion
 */
export function createMockFilterCriterion(overrides?: Partial<FilterCriterion>): FilterCriterion {
  return {
    id: generateId('criterion'),
    field: 'price',
    operator: 'gt',
    value: 100,
    ...overrides,
  };
}

/**
 * Create mock FilterGroup
 */
export function createMockFilterGroup(overrides?: Partial<FilterGroup>): FilterGroup {
  return {
    id: generateId('group'),
    name: `Filter Group ${idCounter}`,
    criteria: [createMockFilterCriterion()],
    logic: 'and',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock SavedFilter
 */
export function createMockSavedFilter(overrides?: Partial<SavedFilter>): SavedFilter {
  return {
    id: generateId('filter'),
    name: `Saved Filter ${idCounter}`,
    criteria: [createMockFilterCriterion()],
    logic: 'and',
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock BulkOperationItem
 */
export function createMockBulkOperationItem(
  overrides?: Partial<BulkOperationItem>
): BulkOperationItem {
  return {
    id: generateId('item'),
    productId: generateId('prod'),
    productName: `Product ${idCounter}`,
    quantity: 1,
    price: 100,
    ...overrides,
  };
}

/**
 * Create mock BatchOperation
 */
export function createMockBatchOperation(overrides?: Partial<BatchOperation>): BatchOperation {
  return {
    id: generateId('op'),
    type: 'update-price',
    items: [createMockBulkOperationItem()],
    progress: 0,
    status: 'pending',
    totalItems: 1,
    processedItems: 0,
    failedItems: 0,
    errors: [],
    ...overrides,
  };
}

/**
 * Create multiple OrderItems
 */
export function createMockOrderItems(count: number, overrides?: Partial<OrderItem>): OrderItem[] {
  return Array.from({ length: count }, () => createMockOrderItem(overrides));
}

/**
 * Create multiple Products
 */
export function createMockProducts(count: number, overrides?: Partial<Product>): Product[] {
  return Array.from({ length: count }, () => createMockProduct(overrides));
}

/**
 * Create multiple StockLevels
 */
export function createMockStockLevels(count: number, overrides?: Partial<StockLevel>): StockLevel[] {
  return Array.from({ length: count }, () => createMockStockLevel(overrides));
}

/**
 * Create orders (array of OrderItem arrays)
 */
export function createMockOrders(orderCount: number, itemsPerOrder: number = 3): OrderItem[][] {
  return Array.from({ length: orderCount }, () => createMockOrderItems(itemsPerOrder));
}

/**
 * Create mock fetch response
 */
export function createMockFetchResponse<T>(data: T, ok: boolean = true): Response {
  return {
    ok,
    status: ok ? 200 : 400,
    statusText: ok ? 'OK' : 'Bad Request',
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } as Response;
}

/**
 * Create mock successful fetch
 */
export function mockFetchSuccess<T>(data: T): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(data, true));
}

/**
 * Create mock failed fetch
 */
export function mockFetchError(error: any = { error: 'Test error' }): void {
  (global.fetch as jest.Mock).mockResolvedValueOnce(createMockFetchResponse(error, false));
}

/**
 * Create mock AbortSignal
 */
export function createMockAbortSignal(aborted: boolean = false): AbortSignal {
  return {
    aborted,
    reason: undefined,
    throwIfAborted: () => {},
    onabort: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  } as any;
}

/**
 * Wait for async operations
 */
export function waitFor(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
