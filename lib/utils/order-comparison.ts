/**
 * Order comparison utilities
 */

import type { OrderItem } from '@/types';

/**
 * Comparison of two orders
 */
export interface OrderComparison {
  orderA: {
    items: OrderItem[];
    total: number;
    itemCount: number;
  };
  orderB: {
    items: OrderItem[];
    total: number;
    itemCount: number;
  };
  comparison: {
    commonItems: OrderItem[];
    uniqueToA: OrderItem[];
    uniqueToB: OrderItem[];
    itemDifferences: DifferenceSummary[];
    totalDifference: number;
    totalDifferencePercent: number;
    similarity: number; // 0-100 percentage
    identicalItems: number;
    totalCommonQuantity: number;
    totalDifferenceQuantity: number;
  };
}

/**
 * Difference summary for items
 */
export interface DifferenceSummary {
  productId: string;
  productName: string;
  quantityDifference: number;
  priceDifference: number;
  discountDifference: number;
  inBothOrders: boolean;
  onlyInA: boolean;
  onlyInB: boolean;
}

/**
 * Batch comparison result
 */
export interface BatchComparisonResult {
  orders: { items: OrderItem[] }[];
  comparison: {
    averageOrderValue: number;
    totalVariation: number;
    mostCommonItems: { productId: string; productName: string; count: number }[];
    leastCommonItems: { productId: string; productName: string; count: number }[];
    commonProducts: string[];
    variableProducts: string[];
    consistency: number; // 0-100 percentage
  };
}

/**
 * Compare two orders
 */
export function compareOrders(orderA: OrderItem[], orderB: OrderItem[]): OrderComparison {
  const totalA = calculateOrderTotal(orderA);
  const totalB = calculateOrderTotal(orderB);

  // Find common and unique items
  const commonItems = findCommonItems(orderA, orderB);
  const uniqueToA = findUniqueItems(orderA, orderB);
  const uniqueToB = findUniqueItems(orderB, orderA);

  // Calculate differences
  const itemDifferences = calculateItemDifferences(orderA, orderB);
  const totalDifference = Math.abs(totalA - totalB);
  const totalDifferencePercent =
    totalA > 0 ? Math.round((totalDifference / totalA) * 10000) / 100 : 0;

  // Calculate similarity
  const totalCommonQuantity = commonItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAQuantity = orderA.reduce((sum, item) => sum + item.quantity, 0);
  const totalBQuantity = orderB.reduce((sum, item) => sum + item.quantity, 0);
  const totalCommonValue = commonItems.reduce(
    (sum, item) => sum + item.quantity * item.price - (item.discount || 0),
    0
  );
  const totalValue = Math.max(totalA, totalB);
  const similarity = totalValue > 0 ? Math.round((totalCommonValue / totalValue) * 100) : 0;

  const identicalItems = commonItems.filter((item) => {
    const aItem = orderA.find((i) => i.productId === item.productId);
    const bItem = orderB.find((i) => i.productId === item.productId);
    return (
      aItem &&
      bItem &&
      aItem.quantity === bItem.quantity &&
      aItem.price === bItem.price &&
      (aItem.discount || 0) === (bItem.discount || 0)
    );
  }).length;

  const totalDifferenceQuantity = Math.abs(totalAQuantity - totalBQuantity);

  return {
    orderA: {
      items: orderA,
      total: totalA,
      itemCount: orderA.length,
    },
    orderB: {
      items: orderB,
      total: totalB,
      itemCount: orderB.length,
    },
    comparison: {
      commonItems,
      uniqueToA,
      uniqueToB,
      itemDifferences,
      totalDifference,
      totalDifferencePercent,
      similarity,
      identicalItems,
      totalCommonQuantity,
      totalDifferenceQuantity,
    },
  };
}

/**
 * Compare multiple orders
 */
export function compareBatch(orders: OrderItem[][]): BatchComparisonResult {
  if (orders.length === 0) {
    return {
      orders: [],
      comparison: {
        averageOrderValue: 0,
        totalVariation: 0,
        mostCommonItems: [],
        leastCommonItems: [],
        commonProducts: [],
        variableProducts: [],
        consistency: 0,
      },
    };
  }

  const totals = orders.map(calculateOrderTotal);
  const averageOrderValue = totals.reduce((a, b) => a + b, 0) / totals.length;
  const totalVariation = calculateVariation(totals);

  // Count product occurrences
  const productCounts: Record<string, { name: string; count: number }> = {};
  orders.forEach((order) => {
    order.forEach((item) => {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { name: item.productName, count: 0 };
      }
      productCounts[item.productId].count++;
    });
  });

  const products = Object.entries(productCounts).map(([id, data]) => ({
    productId: id,
    productName: data.name,
    count: data.count,
  }));

  const mostCommonItems = products
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const leastCommonItems = products
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  const commonProducts = products.filter((p) => p.count === orders.length).map((p) => p.productId);
  const variableProducts = products.filter((p) => p.count < orders.length).map((p) => p.productId);

  // Calculate consistency (how similar orders are)
  const consistency =
    orders.length > 1
      ? 100 - Math.min(100, totalVariation / averageOrderValue)
      : 100;

  return {
    orders: orders.map((items) => ({ items })),
    comparison: {
      averageOrderValue,
      totalVariation,
      mostCommonItems,
      leastCommonItems,
      commonProducts,
      variableProducts,
      consistency: Math.max(0, consistency),
    },
  };
}

/**
 * Find common items between two orders
 */
export function findCommonItems(orderA: OrderItem[], orderB: OrderItem[]): OrderItem[] {
  return orderA.filter((item) => orderB.some((bItem) => bItem.productId === item.productId));
}

/**
 * Find items unique to one order
 */
export function findUniqueItems(orderA: OrderItem[], orderB: OrderItem[]): OrderItem[] {
  return orderA.filter((item) => !orderB.some((bItem) => bItem.productId === item.productId));
}

/**
 * Calculate differences between orders for each product
 */
export function calculateItemDifferences(orderA: OrderItem[], orderB: OrderItem[]): DifferenceSummary[] {
  const differences: DifferenceSummary[] = [];
  const allProductIds = new Set<string>();

  orderA.forEach((item) => allProductIds.add(item.productId));
  orderB.forEach((item) => allProductIds.add(item.productId));

  allProductIds.forEach((productId) => {
    const itemA = orderA.find((i) => i.productId === productId);
    const itemB = orderB.find((i) => i.productId === productId);

    if (!itemA || !itemB) {
      // Item only in one order
      const item = itemA || itemB;
      if (item) {
        differences.push({
          productId,
          productName: item.productName,
          quantityDifference: itemA ? -itemA.quantity : itemB!.quantity,
          priceDifference: itemA ? -itemA.price : itemB!.price,
          discountDifference: (itemA?.discount || 0) - (itemB?.discount || 0),
          inBothOrders: false,
          onlyInA: !!itemA,
          onlyInB: !!itemB,
        });
      }
    } else {
      // Item in both orders
      const quantityDiff = itemB.quantity - itemA.quantity;
      const priceDiff = itemB.price - itemA.price;
      const discountDiff = (itemB.discount || 0) - (itemA.discount || 0);

      if (quantityDiff !== 0 || priceDiff !== 0 || discountDiff !== 0) {
        differences.push({
          productId,
          productName: itemA.productName,
          quantityDifference: quantityDiff,
          priceDifference: priceDiff,
          discountDifference: discountDiff,
          inBothOrders: true,
          onlyInA: false,
          onlyInB: false,
        });
      }
    }
  });

  return differences.sort((a, b) => Math.abs(b.quantityDifference) - Math.abs(a.quantityDifference));
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.price - (item.discount || 0);
    return sum + Math.max(0, itemTotal);
  }, 0);
}

/**
 * Calculate standard deviation (variation) of numbers
 */
export function calculateVariation(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map((num) => Math.pow(num - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  return Math.sqrt(variance);
}

/**
 * Export comparison as text
 */
export function exportComparisonAsText(comparison: OrderComparison): string {
  const lines: string[] = [];

  lines.push('=== ORDER COMPARISON ===\n');

  lines.push('ORDER A:');
  lines.push(`  Total Items: ${comparison.orderA.itemCount}`);
  lines.push(`  Total Value: ${comparison.orderA.total.toFixed(2)}\n`);

  lines.push('ORDER B:');
  lines.push(`  Total Items: ${comparison.orderB.itemCount}`);
  lines.push(`  Total Value: ${comparison.orderB.total.toFixed(2)}\n`);

  lines.push('COMPARISON:');
  lines.push(`  Similarity: ${comparison.comparison.similarity}%`);
  lines.push(`  Total Difference: ${comparison.comparison.totalDifference.toFixed(2)}`);
  lines.push(`  Difference %: ${comparison.comparison.totalDifferencePercent}%`);
  lines.push(`  Common Items: ${comparison.comparison.commonItems.length}`);
  lines.push(`  Identical Items: ${comparison.comparison.identicalItems}\n`);

  if (comparison.comparison.itemDifferences.length > 0) {
    lines.push('ITEM DIFFERENCES:');
    comparison.comparison.itemDifferences.forEach((diff) => {
      lines.push(`  ${diff.productName}:`);
      if (diff.quantityDifference !== 0)
        lines.push(`    Quantity: ${diff.quantityDifference > 0 ? '+' : ''}${diff.quantityDifference}`);
      if (diff.priceDifference !== 0)
        lines.push(`    Price: ${diff.priceDifference > 0 ? '+' : ''}${diff.priceDifference.toFixed(2)}`);
      if (diff.discountDifference !== 0)
        lines.push(
          `    Discount: ${diff.discountDifference > 0 ? '+' : ''}${diff.discountDifference.toFixed(2)}`
        );
    });
  }

  return lines.join('\n');
}

/**
 * Export comparison as JSON
 */
export function exportComparisonAsJSON(comparison: OrderComparison): string {
  return JSON.stringify(comparison, null, 2);
}

/**
 * Get comparison summary
 */
export function getComparisonSummary(comparison: OrderComparison): {
  status: 'identical' | 'similar' | 'different' | 'very-different';
  message: string;
  suggestions: string[];
} {
  const similarity = comparison.comparison.similarity;
  const diffPercent = comparison.comparison.totalDifferencePercent;

  let status: 'identical' | 'similar' | 'different' | 'very-different';
  let message: string;
  const suggestions: string[] = [];

  if (similarity === 100 && diffPercent === 0) {
    status = 'identical';
    message = 'Orders are identical';
  } else if (similarity >= 80) {
    status = 'similar';
    message = 'Orders are very similar';
    if (comparison.comparison.uniqueToA.length > 0) {
      suggestions.push(`Order A has ${comparison.comparison.uniqueToA.length} unique item(s)`);
    }
    if (comparison.comparison.uniqueToB.length > 0) {
      suggestions.push(`Order B has ${comparison.comparison.uniqueToB.length} unique item(s)`);
    }
  } else if (similarity >= 50) {
    status = 'different';
    message = 'Orders have significant differences';
    suggestions.push(`${comparison.comparison.itemDifferences.length} items differ`);
    suggestions.push(`${comparison.comparison.totalDifferencePercent}% difference in value`);
  } else {
    status = 'very-different';
    message = 'Orders are very different';
    suggestions.push('Consider if these should be compared');
  }

  return { status, message, suggestions };
}

/**
 * Find trending products from comparisons
 */
export function findTrendingProducts(comparisons: OrderComparison[], topN: number = 5): {
  increasing: Array<{ productId: string; productName: string; averageIncrease: number }>;
  decreasing: Array<{ productId: string; productName: string; averageDecrease: number }>;
} {
  const productTrends: Record<
    string,
    { name: string; increases: number[]; decreases: number[] }
  > = {};

  comparisons.forEach((comp) => {
    comp.comparison.itemDifferences.forEach((diff) => {
      if (!productTrends[diff.productId]) {
        productTrends[diff.productId] = {
          name: diff.productName,
          increases: [],
          decreases: [],
        };
      }

      if (diff.quantityDifference > 0) {
        productTrends[diff.productId].increases.push(diff.quantityDifference);
      } else if (diff.quantityDifference < 0) {
        productTrends[diff.productId].decreases.push(-diff.quantityDifference);
      }
    });
  });

  const increasing = Object.entries(productTrends)
    .filter(([_, data]) => data.increases.length > 0)
    .map(([id, data]) => ({
      productId: id,
      productName: data.name,
      averageIncrease: data.increases.reduce((a, b) => a + b, 0) / data.increases.length,
    }))
    .sort((a, b) => b.averageIncrease - a.averageIncrease)
    .slice(0, topN);

  const decreasing = Object.entries(productTrends)
    .filter(([_, data]) => data.decreases.length > 0)
    .map(([id, data]) => ({
      productId: id,
      productName: data.name,
      averageDecrease: data.decreases.reduce((a, b) => a + b, 0) / data.decreases.length,
    }))
    .sort((a, b) => b.averageDecrease - a.averageDecrease)
    .slice(0, topN);

  return { increasing, decreasing };
}
