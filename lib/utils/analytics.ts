/**
 * Analytics and reporting utilities
 */

import type { OrderItem } from '@/types';

export interface SalesStats {
  totalRevenue: number;
  averageOrderValue: number;
  totalItems: number;
  averageItemPrice: number;
  totalOrders: number;
  totalDiscounts: number;
}

export interface ProductAnalytics {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  discountAmount: number;
  frequency: number; // How many times ordered
}

export interface TimeBasedAnalytics {
  date: string;
  revenue: number;
  itemCount: number;
  orderCount: number;
  averageOrderValue: number;
  topProducts: Array<{
    name: string;
    units: number;
  }>;
}

export interface CategoryAnalytics {
  category: string;
  count: number;
  revenue: number;
  percentage: number;
}

/**
 * Calculate sales statistics
 */
export function calculateSalesStats(orders: OrderItem[][]): SalesStats {
  if (orders.length === 0) {
    return {
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItems: 0,
      averageItemPrice: 0,
      totalOrders: 0,
      totalDiscounts: 0,
    };
  }

  let totalRevenue = 0;
  let totalItems = 0;
  let totalDiscounts = 0;
  let totalItemPrices = 0;

  orders.forEach((items) => {
    items.forEach((item) => {
      totalRevenue += item.quantity * item.price - (item.discount || 0);
      totalItems += item.quantity;
      totalDiscounts += item.discount || 0;
      totalItemPrices += item.price;
    });
  });

  const allItems = orders.flat();

  return {
    totalRevenue,
    averageOrderValue: totalRevenue / orders.length,
    totalItems,
    averageItemPrice: totalItemPrices / Math.max(allItems.length, 1),
    totalOrders: orders.length,
    totalDiscounts,
  };
}

/**
 * Analyze products from orders
 */
export function analyzeProducts(orders: OrderItem[][]): ProductAnalytics[] {
  const productMap = new Map<string, ProductAnalytics>();

  orders.forEach((items) => {
    items.forEach((item) => {
      const existing = productMap.get(item.productId);

      if (existing) {
        existing.unitsSold += item.quantity;
        existing.revenue += item.quantity * item.price - (item.discount || 0);
        existing.discountAmount += item.discount || 0;
        existing.frequency += 1;
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          unitsSold: item.quantity,
          revenue: item.quantity * item.price - (item.discount || 0),
          averagePrice: item.price,
          discountAmount: item.discount || 0,
          frequency: 1,
        });
      }
    });
  });

  return Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
}

/**
 * Get top products by revenue or units
 */
export function getTopProducts(
  orders: OrderItem[][],
  limit: number = 10,
  sortBy: 'revenue' | 'units' = 'revenue'
): ProductAnalytics[] {
  const products = analyzeProducts(orders);

  if (sortBy === 'units') {
    return products.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, limit);
  }

  return products.slice(0, limit);
}

/**
 * Analyze orders over time
 */
export function analyzeByTimeRange(
  orders: Array<{
    items: OrderItem[];
    date: Date;
  }>,
  groupBy: 'day' | 'week' | 'month' = 'day'
): TimeBasedAnalytics[] {
  const groupedMap = new Map<string, TimeBasedAnalytics>();

  orders.forEach((order) => {
    let key: string;

    switch (groupBy) {
      case 'day':
        key = order.date.toLocaleDateString('th-TH');
        break;
      case 'week':
        const weekStart = new Date(order.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = `Week ${Math.ceil(order.date.getDate() / 7)} - ${order.date.getFullYear()}`;
        break;
      case 'month':
        key = order.date.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
        });
        break;
    }

    const existing = groupedMap.get(key);
    const orderRevenue = order.items.reduce(
      (sum, item) => sum + item.quantity * item.price - (item.discount || 0),
      0
    );
    const orderItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const productMap = new Map<string, number>();
    order.items.forEach((item) => {
      productMap.set(item.productName, (productMap.get(item.productName) || 0) + item.quantity);
    });

    const topProducts = Array.from(productMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, units]) => ({ name, units }));

    if (existing) {
      existing.revenue += orderRevenue;
      existing.itemCount += orderItemCount;
      existing.orderCount += 1;
      existing.averageOrderValue = existing.revenue / existing.orderCount;
    } else {
      groupedMap.set(key, {
        date: key,
        revenue: orderRevenue,
        itemCount: orderItemCount,
        orderCount: 1,
        averageOrderValue: orderRevenue,
        topProducts,
      });
    }
  });

  return Array.from(groupedMap.values());
}

/**
 * Calculate discount impact
 */
export function analyzeDiscounts(orders: OrderItem[][]): {
  totalDiscounts: number;
  discountedOrders: number;
  averageDiscountPerOrder: number;
  discountPercentage: number;
} {
  let totalDiscounts = 0;
  let discountedOrders = 0;
  let totalRevenue = 0;

  orders.forEach((items) => {
    const orderDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const orderRevenue = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    if (orderDiscount > 0) {
      discountedOrders++;
      totalDiscounts += orderDiscount;
    }

    totalRevenue += orderRevenue;
  });

  return {
    totalDiscounts,
    discountedOrders,
    averageDiscountPerOrder: discountedOrders > 0 ? totalDiscounts / discountedOrders : 0,
    discountPercentage: totalRevenue > 0 ? (totalDiscounts / totalRevenue) * 100 : 0,
  };
}

/**
 * Calculate growth metrics
 */
export function calculateGrowth(
  previousPeriod: OrderItem[][],
  currentPeriod: OrderItem[][]
): {
  revenueGrowth: number;
  orderGrowth: number;
  itemGrowth: number;
  trend: 'up' | 'down' | 'stable';
} {
  const prevStats = calculateSalesStats(previousPeriod);
  const currStats = calculateSalesStats(currentPeriod);

  const revenueGrowth =
    prevStats.totalRevenue > 0
      ? ((currStats.totalRevenue - prevStats.totalRevenue) / prevStats.totalRevenue) * 100
      : 0;

  const orderGrowth =
    previousPeriod.length > 0
      ? ((currentPeriod.length - previousPeriod.length) / previousPeriod.length) * 100
      : 0;

  const itemGrowth =
    prevStats.totalItems > 0
      ? ((currStats.totalItems - prevStats.totalItems) / prevStats.totalItems) * 100
      : 0;

  const avgGrowth = (revenueGrowth + orderGrowth + itemGrowth) / 3;
  const trend = avgGrowth > 5 ? 'up' : avgGrowth < -5 ? 'down' : 'stable';

  return {
    revenueGrowth,
    orderGrowth,
    itemGrowth,
    trend,
  };
}

/**
 * Get order statistics
 */
export function getOrderStats(orders: OrderItem[][]) {
  if (orders.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      stdDev: 0,
    };
  }

  const orderValues = orders.map((items) =>
    items.reduce((sum, item) => sum + item.quantity * item.price - (item.discount || 0), 0)
  );

  orderValues.sort((a, b) => a - b);

  const min = orderValues[0];
  const max = orderValues[orderValues.length - 1];
  const average = orderValues.reduce((a, b) => a + b) / orderValues.length;
  const median =
    orderValues.length % 2 === 0
      ? (orderValues[Math.floor(orderValues.length / 2) - 1] +
          orderValues[Math.floor(orderValues.length / 2)]) /
        2
      : orderValues[Math.floor(orderValues.length / 2)];

  const variance =
    orderValues.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) /
    orderValues.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, average, median, stdDev };
}

/**
 * Identify trends
 */
export function identifyTrends(
  products: ProductAnalytics[]
): {
  rising: ProductAnalytics[];
  declining: ProductAnalytics[];
  stable: ProductAnalytics[];
} {
  // Simple trend based on frequency vs units
  const rising = products.filter((p) => p.unitsSold / p.frequency > 5); // High volume per order
  const declining = products.filter((p) => p.frequency > 10 && p.unitsSold / p.frequency < 2); // High frequency, low volume
  const stable = products.filter((p) => !rising.includes(p) && !declining.includes(p));

  return { rising, declining, stable };
}

/**
 * Export analytics as JSON
 */
export function exportAnalytics(
  orders: OrderItem[][],
  filename: string = 'analytics.json'
): string {
  const stats = calculateSalesStats(orders);
  const products = analyzeProducts(orders);
  const discounts = analyzeDiscounts(orders);
  const orderStats = getOrderStats(orders);

  const data = {
    exportDate: new Date().toISOString(),
    salesStats: stats,
    productAnalytics: products,
    discountAnalysis: discounts,
    orderStatistics: orderStats,
    topProducts: products.slice(0, 10),
  };

  return JSON.stringify(data, null, 2);
}
