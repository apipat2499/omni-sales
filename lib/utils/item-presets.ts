import type { OrderItem } from '@/types';

export interface ItemTemplate {
  id: string;
  name: string;
  description?: string;
  items: Omit<OrderItem, 'id'>[];
  category?: string;
  tags?: string[];
}

/**
 * Predefined item templates for quick ordering
 */
export const itemTemplates: ItemTemplate[] = [
  {
    id: 'preset-1',
    name: 'โปรโมชั่นชุดกลาง',
    description: 'ชุดสินค้ายอดนิยม 3 รายการ',
    category: 'promotion',
    items: [
      { productId: '', productName: 'สินค้า A', quantity: 1, price: 100 },
      { productId: '', productName: 'สินค้า B', quantity: 1, price: 200 },
      { productId: '', productName: 'สินค้า C', quantity: 1, price: 150 },
    ],
  },
  {
    id: 'preset-2',
    name: 'ชุดสินค้าพื้นฐาน',
    description: 'ชุดสินค้าจำเป็น',
    category: 'basic',
    items: [
      { productId: '', productName: 'สินค้า D', quantity: 2, price: 50 },
      { productId: '', productName: 'สินค้า E', quantity: 1, price: 75 },
    ],
  },
];

/**
 * Create custom item template
 */
export function createItemTemplate(
  name: string,
  items: Omit<OrderItem, 'id'>[],
  description?: string,
  category?: string
): ItemTemplate {
  return {
    id: `template-${Date.now()}`,
    name,
    description,
    category,
    items,
  };
}

/**
 * Get template by category
 */
export function getTemplatesByCategory(category: string): ItemTemplate[] {
  return itemTemplates.filter((template) => template.category === category);
}

/**
 * Search templates
 */
export function searchTemplates(query: string): ItemTemplate[] {
  const lowerQuery = query.toLowerCase();
  return itemTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Apply template to order (returns items to add)
 */
export function applyTemplate(template: ItemTemplate): Omit<OrderItem, 'id'>[] {
  return template.items;
}

/**
 * Get total price for template
 */
export function getTemplateTotal(template: ItemTemplate): number {
  return template.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

/**
 * Quick preset utilities
 */
export const presets = {
  /**
   * Double all quantities
   */
  doubleQuantities: (items: Omit<OrderItem, 'id'>[]): Omit<OrderItem, 'id'>[] => {
    return items.map((item) => ({
      ...item,
      quantity: item.quantity * 2,
    }));
  },

  /**
   * Add quantity to all items
   */
  addQuantityToAll: (items: Omit<OrderItem, 'id'>[], add: number): Omit<OrderItem, 'id'>[] => {
    return items.map((item) => ({
      ...item,
      quantity: Math.max(1, item.quantity + add),
    }));
  },

  /**
   * Apply percentage discount to all
   */
  applyDiscount: (items: Omit<OrderItem, 'id'>[], percent: number): Omit<OrderItem, 'id'>[] => {
    return items.map((item) => ({
      ...item,
      price: item.price * (1 - percent / 100),
    }));
  },

  /**
   * Filter by category/tag
   */
  filterByTag: (items: Omit<OrderItem, 'id'>[], tag: string): Omit<OrderItem, 'id'>[] => {
    return items; // Implement based on your tag system
  },
};

/**
 * Recent items for quick access
 */
export class RecentItemsManager {
  private static readonly STORAGE_KEY = 'order-recent-items';
  private static readonly MAX_ITEMS = 10;

  static addItem(item: OrderItem): void {
    const recent = this.getItems();
    const filtered = recent.filter((i) => i.productId !== item.productId);
    const updated = [item, ...filtered].slice(0, this.MAX_ITEMS);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  static getItems(): OrderItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static removeItem(productId: string): void {
    const items = this.getItems().filter((i) => i.productId !== productId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }
}
