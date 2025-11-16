/**
 * Quick action utilities for order items
 */

import type { OrderItem } from '@/types';

/**
 * Duplicate an item (copies all properties)
 */
export function duplicateItem(item: OrderItem): Omit<OrderItem, 'id'> {
  return {
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    discount: item.discount,
    notes: item.notes ? `${item.notes} (duplicated)` : undefined,
  };
}

/**
 * Split item quantity into two items
 */
export function splitItemQuantity(
  item: OrderItem,
  splitRatio: number = 0.5
): [Omit<OrderItem, 'id'>, Omit<OrderItem, 'id'>] {
  const qty1 = Math.floor(item.quantity * splitRatio);
  const qty2 = item.quantity - qty1;

  return [
    {
      productId: item.productId,
      productName: item.productName,
      quantity: qty1,
      price: item.price,
      discount: item.discount ? (item.discount * qty1) / item.quantity : undefined,
      notes: item.notes ? `${item.notes} (split - part 1)` : undefined,
    },
    {
      productId: item.productId,
      productName: item.productName,
      quantity: qty2,
      price: item.price,
      discount: item.discount ? (item.discount * qty2) / item.quantity : undefined,
      notes: item.notes ? `${item.notes} (split - part 2)` : undefined,
    },
  ];
}

/**
 * Merge multiple items (same product)
 */
export function mergeItems(items: OrderItem[]): Omit<OrderItem, 'id'> {
  if (items.length === 0) {
    throw new Error('Cannot merge empty items');
  }

  const first = items[0];

  // Verify all items are the same product
  if (!items.every((item) => item.productId === first.productId)) {
    throw new Error('Can only merge items of the same product');
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);

  // Use average price if prices differ
  const avgPrice = items.reduce((sum, item) => sum + item.price, 0) / items.length;

  return {
    productId: first.productId,
    productName: first.productName,
    quantity: totalQuantity,
    price: avgPrice,
    discount: totalDiscount > 0 ? totalDiscount : undefined,
    notes: items.length > 1 ? `Merged ${items.length} items` : first.notes,
  };
}

/**
 * Increase quantity by percentage
 */
export function increaseQuantityByPercent(
  item: OrderItem,
  percent: number
): Omit<OrderItem, 'id'> {
  const newQuantity = Math.ceil(item.quantity * (1 + percent / 100));

  return {
    productId: item.productId,
    productName: item.productName,
    quantity: Math.max(1, newQuantity),
    price: item.price,
    discount: item.discount,
    notes: item.notes,
  };
}

/**
 * Apply bulk discount to item
 */
export function applyBulkDiscount(
  item: OrderItem,
  discountPercent: number
): Omit<OrderItem, 'id'> {
  const totalPrice = item.quantity * item.price;
  const discountAmount = totalPrice * (discountPercent / 100);

  return {
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    discount: (item.discount || 0) + discountAmount,
    notes: item.notes,
  };
}

/**
 * Clear discount from item
 */
export function clearDiscount(item: OrderItem): Omit<OrderItem, 'id'> {
  return {
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.price,
    notes: item.notes,
  };
}

/**
 * Group items by product
 */
export function groupItemsByProduct(items: OrderItem[]): Record<string, OrderItem[]> {
  return items.reduce(
    (acc, item) => {
      if (!acc[item.productId]) {
        acc[item.productId] = [];
      }
      acc[item.productId].push(item);
      return acc;
    },
    {} as Record<string, OrderItem[]>
  );
}

/**
 * Find duplicate items (same product)
 */
export function findDuplicateItems(items: OrderItem[]): OrderItem[][] {
  const grouped = groupItemsByProduct(items);
  return Object.values(grouped).filter((group) => group.length > 1);
}

/**
 * Consolidate duplicate items
 */
export function consolidateDuplicates(items: OrderItem[]): OrderItem[] {
  const duplicates = findDuplicateItems(items);

  if (duplicates.length === 0) {
    return items;
  }

  // Get non-duplicate items
  const nonDuplicates = items.filter(
    (item) =>
      !duplicates.some((dup) =>
        dup.some((dupItem) => dupItem.id === item.id)
      )
  );

  // Merge duplicates
  const merged = duplicates.map((group) => ({
    id: group[0].id,
    ...mergeItems(group),
  }));

  return [...nonDuplicates, ...merged];
}

/**
 * Quick action templates
 */
export const quickActions = {
  /**
   * Double the quantity
   */
  double: (item: OrderItem): Omit<OrderItem, 'id'> => ({
    ...item,
    quantity: item.quantity * 2,
  }),

  /**
   * Half the quantity
   */
  half: (item: OrderItem): Omit<OrderItem, 'id'> => ({
    ...item,
    quantity: Math.max(1, Math.floor(item.quantity / 2)),
  }),

  /**
   * Add 1 to quantity
   */
  addOne: (item: OrderItem): Omit<OrderItem, 'id'> => ({
    ...item,
    quantity: item.quantity + 1,
  }),

  /**
   * Remove 1 from quantity
   */
  removeOne: (item: OrderItem): Omit<OrderItem, 'id'> => ({
    ...item,
    quantity: Math.max(1, item.quantity - 1),
  }),

  /**
   * Round quantity to nearest 5
   */
  roundToFive: (item: OrderItem): Omit<OrderItem, 'id'> => ({
    ...item,
    quantity: Math.round(item.quantity / 5) * 5 || 5,
  }),

  /**
   * Round quantity to nearest 10
   */
  roundToTen: (item: OrderItem): Omit<OrderItem, 'id'> => ({
    ...item,
    quantity: Math.round(item.quantity / 10) * 10 || 10,
  }),

  /**
   * Apply 10% discount
   */
  discount10: (item: OrderItem): Omit<OrderItem, 'id'> =>
    applyBulkDiscount(item, 10),

  /**
   * Apply 20% discount
   */
  discount20: (item: OrderItem): Omit<OrderItem, 'id'> =>
    applyBulkDiscount(item, 20),

  /**
   * Apply 50% discount
   */
  discount50: (item: OrderItem): Omit<OrderItem, 'id'> =>
    applyBulkDiscount(item, 50),

  /**
   * Remove all discount
   */
  removeDiscount: clearDiscount,

  /**
   * Duplicate item
   */
  duplicate: duplicateItem,

  /**
   * Split 50/50
   */
  split: (item: OrderItem): [Omit<OrderItem, 'id'>, Omit<OrderItem, 'id'>] =>
    splitItemQuantity(item, 0.5),
};

/**
 * Quick action metadata for UI
 */
export interface QuickActionMetadata {
  id: string;
  label: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  tooltip: string;
  category: 'quantity' | 'discount' | 'duplicate' | 'split';
}

export const quickActionMetadata: Record<keyof typeof quickActions, QuickActionMetadata> = {
  double: {
    id: 'double',
    label: 'คูณ2',
    icon: 'x2',
    color: 'blue',
    tooltip: 'คูณจำนวนด้วย 2',
    category: 'quantity',
  },
  half: {
    id: 'half',
    label: '÷2',
    icon: 'divide',
    color: 'yellow',
    tooltip: 'ลดจำนวนครึ่งหนึ่ง',
    category: 'quantity',
  },
  addOne: {
    id: 'addOne',
    label: '+1',
    icon: 'plus',
    color: 'green',
    tooltip: 'เพิ่มจำนวน 1 หน่วย',
    category: 'quantity',
  },
  removeOne: {
    id: 'removeOne',
    label: '-1',
    icon: 'minus',
    color: 'red',
    tooltip: 'ลดจำนวน 1 หน่วย',
    category: 'quantity',
  },
  roundToFive: {
    id: 'roundToFive',
    label: 'ปัด 5',
    icon: 'round',
    color: 'purple',
    tooltip: 'ปัดจำนวนให้เป็นผลคูณของ 5',
    category: 'quantity',
  },
  roundToTen: {
    id: 'roundToTen',
    label: 'ปัด 10',
    icon: 'round',
    color: 'purple',
    tooltip: 'ปัดจำนวนให้เป็นผลคูณของ 10',
    category: 'quantity',
  },
  discount10: {
    id: 'discount10',
    label: '-10%',
    icon: 'percent',
    color: 'red',
    tooltip: 'ลด 10%',
    category: 'discount',
  },
  discount20: {
    id: 'discount20',
    label: '-20%',
    icon: 'percent',
    color: 'red',
    tooltip: 'ลด 20%',
    category: 'discount',
  },
  discount50: {
    id: 'discount50',
    label: '-50%',
    icon: 'percent',
    color: 'red',
    tooltip: 'ลด 50%',
    category: 'discount',
  },
  removeDiscount: {
    id: 'removeDiscount',
    label: 'ยกเลิกส่วนลด',
    icon: 'x',
    color: 'gray',
    tooltip: 'ยกเลิกส่วนลด',
    category: 'discount',
  },
  duplicate: {
    id: 'duplicate',
    label: 'ทำซ้ำ',
    icon: 'copy',
    color: 'blue',
    tooltip: 'คัดลอกรายการนี้',
    category: 'duplicate',
  },
  split: {
    id: 'split',
    label: 'แบ่ง',
    icon: 'split',
    color: 'purple',
    tooltip: 'แบ่งจำนวนครึ่งหนึ่ง',
    category: 'split',
  },
};
