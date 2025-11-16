import { useState, useCallback, useMemo } from 'react';
import {
  priceHistoryTracker,
  persistentPriceHistory,
  PriceRecord,
  PriceStats,
  calculatePriceTrend,
  getPriceSummary,
  getPriceHistoryInRange,
  calculatePriceVolatility,
  getAveragePriceForPeriod,
} from '@/lib/utils/price-history';

interface UsePriceHistoryOptions {
  itemId: string;
  persistent?: boolean;
  autoLoad?: boolean;
}

/**
 * Hook for managing and displaying price history
 */
export function usePriceHistory(options: UsePriceHistoryOptions) {
  const { itemId, persistent = false, autoLoad = true } = options;

  const [history, setHistory] = useState<PriceRecord[]>(() => {
    if (autoLoad && persistent) {
      return persistentPriceHistory.load(itemId);
    }
    return priceHistoryTracker.getHistory(itemId);
  });

  const recordPrice = useCallback(
    (
      price: number,
      quantity: number,
      options?: {
        discountPercent?: number;
        notes?: string;
        action?: 'created' | 'updated' | 'discounted';
      }
    ) => {
      priceHistoryTracker.recordPrice(itemId, price, quantity, options);

      const updated = priceHistoryTracker.getHistory(itemId);
      setHistory(updated);

      if (persistent) {
        persistentPriceHistory.save(itemId, updated);
      }
    },
    [itemId, persistent]
  );

  const clearHistory = useCallback(() => {
    priceHistoryTracker.clearHistory(itemId);
    setHistory([]);

    if (persistent) {
      persistentPriceHistory.delete(itemId);
    }
  }, [itemId, persistent]);

  const stats = useMemo(() => {
    return priceHistoryTracker.getStats(itemId);
  }, [history, itemId]);

  const summary = useMemo(() => {
    return getPriceSummary(itemId);
  }, [history, itemId]);

  const trend = useMemo(() => {
    return calculatePriceTrend(history);
  }, [history]);

  const volatility = useMemo(() => {
    return calculatePriceVolatility(itemId);
  }, [history, itemId]);

  const getHistoryInRange = useCallback(
    (startDate: Date, endDate: Date): PriceRecord[] => {
      return getPriceHistoryInRange(itemId, startDate, endDate);
    },
    [itemId]
  );

  const getAveragePriceForDays = useCallback(
    (days: number = 30): number => {
      return getAveragePriceForPeriod(itemId, days);
    },
    [itemId]
  );

  return {
    history,
    recordPrice,
    clearHistory,
    stats,
    summary,
    trend,
    volatility,
    getHistoryInRange,
    getAveragePriceForDays,
  };
}

/**
 * Hook for displaying price trends over time
 */
export function usePriceTrends(itemId: string, days: number = 30) {
  const { history } = usePriceHistory({ itemId });

  const trendData = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const filtered = history.filter(
      (record) => record.timestamp >= startDate && record.timestamp <= now
    );

    // Group by date
    const groupedByDate = filtered.reduce(
      (acc, record) => {
        const date = record.timestamp.toLocaleDateString('th-TH');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(record);
        return acc;
      },
      {} as Record<string, PriceRecord[]>
    );

    // Calculate daily stats
    return Object.entries(groupedByDate).map(([date, records]) => {
      const prices = records.map((r) => r.price);
      const avgPrice = prices.reduce((a, b) => a + b) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);

      return {
        date,
        avgPrice,
        minPrice,
        maxPrice,
        totalQuantity,
        recordCount: records.length,
      };
    });
  }, [history, days]);

  return trendData;
}

/**
 * Hook for price comparison between items
 */
export function usePriceComparison(itemIds: string[]) {
  const comparisons = useMemo(() => {
    return itemIds.map((itemId) => ({
      itemId,
      summary: getPriceSummary(itemId),
      stats: priceHistoryTracker.getStats(itemId),
    }));
  }, [itemIds]);

  const sortByPrice = useCallback(
    (ascending: boolean = true) => {
      return [...comparisons].sort((a, b) => {
        const diff = a.stats.currentPrice - b.stats.currentPrice;
        return ascending ? diff : -diff;
      });
    },
    [comparisons]
  );

  const sortByChange = useCallback(
    (ascending: boolean = false) => {
      return [...comparisons].sort((a, b) => {
        const diff = a.summary.changePercent - b.summary.changePercent;
        return ascending ? diff : -diff;
      });
    },
    [comparisons]
  );

  const getCheapest = useCallback(() => {
    return comparisons.reduce((min, curr) =>
      curr.stats.currentPrice < min.stats.currentPrice ? curr : min
    );
  }, [comparisons]);

  const getMostExpensive = useCallback(() => {
    return comparisons.reduce((max, curr) =>
      curr.stats.currentPrice > max.stats.currentPrice ? curr : max
    );
  }, [comparisons]);

  return {
    comparisons,
    sortByPrice,
    sortByChange,
    getCheapest,
    getMostExpensive,
  };
}

/**
 * Hook for bulk price operations
 */
export function useBulkPriceHistory(itemIds: string[]) {
  const recordPrices = useCallback(
    (
      prices: Record<string, { price: number; quantity: number }>
    ) => {
      itemIds.forEach((itemId) => {
        if (prices[itemId]) {
          const { price, quantity } = prices[itemId];
          priceHistoryTracker.recordPrice(itemId, price, quantity, {
            action: 'updated',
          });
        }
      });
    },
    [itemIds]
  );

  const clearAllHistories = useCallback(() => {
    itemIds.forEach((itemId) => {
      priceHistoryTracker.clearHistory(itemId);
    });
  }, [itemIds]);

  const getAllStats = useCallback(() => {
    return itemIds.map((itemId) => ({
      itemId,
      stats: priceHistoryTracker.getStats(itemId),
    }));
  }, [itemIds]);

  return {
    recordPrices,
    clearAllHistories,
    getAllStats,
  };
}
