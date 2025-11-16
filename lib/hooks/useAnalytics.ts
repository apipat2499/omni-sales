import { useState, useMemo, useCallback } from 'react';
import {
  calculateSalesStats,
  analyzeProducts,
  getTopProducts,
  analyzeByTimeRange,
  analyzeDiscounts,
  calculateGrowth,
  getOrderStats,
  identifyTrends,
  exportAnalytics,
  SalesStats,
  ProductAnalytics,
  TimeBasedAnalytics,
} from '@/lib/utils/analytics';
import type { OrderItem } from '@/types';

/**
 * Hook for order analytics
 */
export function useAnalytics(
  orders: Array<{
    items: OrderItem[];
    date?: Date;
  }> = []
) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [topLimit, setTopLimit] = useState(10);

  // Convert to proper format
  const formattedOrders = useMemo(
    () =>
      orders.map((order) => ({
        items: order.items,
        date: order.date || new Date(),
      })),
    [orders]
  );

  const itemsOnly = useMemo(() => orders.map((o) => o.items), [orders]);

  // Calculate stats
  const salesStats = useMemo(
    () => calculateSalesStats(itemsOnly),
    [itemsOnly]
  );

  const productAnalytics = useMemo(
    () => analyzeProducts(itemsOnly),
    [itemsOnly]
  );

  const topProducts = useMemo(
    () => getTopProducts(itemsOnly, topLimit, 'revenue'),
    [itemsOnly, topLimit]
  );

  const topProductsByUnits = useMemo(
    () => getTopProducts(itemsOnly, topLimit, 'units'),
    [itemsOnly, topLimit]
  );

  const timeBasedAnalytics = useMemo(
    () => analyzeByTimeRange(formattedOrders, timeRange),
    [formattedOrders, timeRange]
  );

  const discountAnalysis = useMemo(
    () => analyzeDiscounts(itemsOnly),
    [itemsOnly]
  );

  const orderStatistics = useMemo(
    () => getOrderStats(itemsOnly),
    [itemsOnly]
  );

  const trends = useMemo(
    () => identifyTrends(productAnalytics),
    [productAnalytics]
  );

  // Growth calculation (compare first half with second half)
  const growth = useMemo(() => {
    const mid = Math.floor(itemsOnly.length / 2);
    if (mid === 0) {
      return {
        revenueGrowth: 0,
        orderGrowth: 0,
        itemGrowth: 0,
        trend: 'stable' as const,
      };
    }

    return calculateGrowth(
      itemsOnly.slice(0, mid),
      itemsOnly.slice(mid)
    );
  }, [itemsOnly]);

  const exportData = useCallback(() => {
    return exportAnalytics(itemsOnly);
  }, [itemsOnly]);

  return {
    // Stats
    salesStats,
    productAnalytics,
    topProducts,
    topProductsByUnits,
    timeBasedAnalytics,
    discountAnalysis,
    orderStatistics,
    trends,
    growth,

    // Controls
    timeRange,
    setTimeRange,
    topLimit,
    setTopLimit,

    // Export
    exportData,

    // Meta
    totalOrders: orders.length,
    hasData: orders.length > 0,
  };
}

/**
 * Hook for comparing analytics between periods
 */
export function useAnalyticsComparison(
  period1: OrderItem[][],
  period2: OrderItem[][]
) {
  const stats1 = useMemo(() => calculateSalesStats(period1), [period1]);
  const stats2 = useMemo(() => calculateSalesStats(period2), [period2]);

  const comparison = useMemo(
    () => ({
      revenueChange: stats2.totalRevenue - stats1.totalRevenue,
      revenueChangePercent:
        stats1.totalRevenue > 0
          ? ((stats2.totalRevenue - stats1.totalRevenue) / stats1.totalRevenue) * 100
          : 0,
      orderChange: stats2.totalOrders - stats1.totalOrders,
      orderChangePercent:
        stats1.totalOrders > 0
          ? ((stats2.totalOrders - stats1.totalOrders) / stats1.totalOrders) * 100
          : 0,
      itemChange: stats2.totalItems - stats1.totalItems,
      itemChangePercent:
        stats1.totalItems > 0
          ? ((stats2.totalItems - stats1.totalItems) / stats1.totalItems) * 100
          : 0,
      averageOrderChange: stats2.averageOrderValue - stats1.averageOrderValue,
      averageOrderChangePercent:
        stats1.averageOrderValue > 0
          ? ((stats2.averageOrderValue - stats1.averageOrderValue) / stats1.averageOrderValue) * 100
          : 0,
    }),
    [stats1, stats2]
  );

  return {
    period1: stats1,
    period2: stats2,
    comparison,
  };
}

/**
 * Hook for real-time analytics dashboard
 */
export function useRealTimeAnalytics(
  orders: OrderItem[][] = [],
  pollInterval: number = 5000
) {
  const [isPolling, setIsPolling] = useState(true);

  const analytics = useAnalytics(
    orders.map((items) => ({
      items,
      date: new Date(),
    }))
  );

  const togglePolling = useCallback(() => {
    setIsPolling((prev) => !prev);
  }, []);

  return {
    ...analytics,
    isPolling,
    togglePolling,
    lastUpdated: new Date(),
  };
}
