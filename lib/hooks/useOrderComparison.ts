import { useState, useCallback, useEffect } from 'react';
import {
  compareOrders,
  compareBatch,
  findCommonItems,
  findUniqueItems,
  calculateItemDifferences,
  exportComparisonAsText,
  exportComparisonAsJSON,
  getComparisonSummary,
  findTrendingProducts,
  OrderComparison,
  BatchComparisonResult,
  type DifferenceSummary,
} from '@/lib/utils/order-comparison';
import type { OrderItem } from '@/types';

interface UseOrderComparisonOptions {
  maxComparisons?: number;
  onComparisonChange?: (comparison: OrderComparison | null) => void;
}

/**
 * Hook for comparing orders
 */
export function useOrderComparison(options: UseOrderComparisonOptions = {}) {
  const { maxComparisons = 10, onComparisonChange } = options;

  const [selectedOrders, setSelectedOrders] = useState<OrderItem[][]>([]);
  const [currentComparison, setCurrentComparison] = useState<OrderComparison | null>(null);
  const [batchComparison, setBatchComparison] = useState<BatchComparisonResult | null>(null);
  const [comparisonHistory, setComparisonHistory] = useState<OrderComparison[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOrderToComparison = useCallback((order: OrderItem[]) => {
    setSelectedOrders((prev) => {
      if (prev.length >= 5) {
        setError('Maximum 5 orders can be compared at once');
        return prev;
      }
      return [...prev, order];
    });
  }, []);

  const removeOrderFromComparison = useCallback((index: number) => {
    setSelectedOrders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearOrders = useCallback(() => {
    setSelectedOrders([]);
    setCurrentComparison(null);
    setBatchComparison(null);
  }, []);

  const performComparison = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedOrders.length < 2) {
        setError('Select at least 2 orders to compare');
        setIsLoading(false);
        return;
      }

      if (selectedOrders.length === 2) {
        const comparison = compareOrders(selectedOrders[0], selectedOrders[1]);
        setCurrentComparison(comparison);
        onComparisonChange?.(comparison);

        // Add to history
        setComparisonHistory((prev) => {
          const updated = [comparison, ...prev];
          return updated.slice(0, maxComparisons);
        });

        setBatchComparison(null);
      } else {
        const batch = compareBatch(selectedOrders);
        setBatchComparison(batch);
        onComparisonChange?.(null);

        // Can't add batch to history easily, so just clear current
        setCurrentComparison(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to perform comparison';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrders, onComparisonChange, maxComparisons]);

  const getCommonProducts = useCallback(() => {
    if (!currentComparison) return [];
    return findCommonItems(
      currentComparison.orderA.items,
      currentComparison.orderB.items
    ).map((item) => item.productId);
  }, [currentComparison]);

  const getUniqueProducts = useCallback(() => {
    if (!currentComparison) return [];
    return {
      onlyInA: findUniqueItems(
        currentComparison.orderA.items,
        currentComparison.orderB.items
      ),
      onlyInB: findUniqueItems(
        currentComparison.orderB.items,
        currentComparison.orderA.items
      ),
    };
  }, [currentComparison]);

  const getDifferences = useCallback(() => {
    if (!currentComparison) return [];
    return currentComparison.comparison.itemDifferences;
  }, [currentComparison]);

  const getSummary = useCallback(() => {
    if (!currentComparison) return null;
    return getComparisonSummary(currentComparison);
  }, [currentComparison]);

  const getTrends = useCallback(
    (topN: number = 5) => {
      return findTrendingProducts(comparisonHistory, topN);
    },
    [comparisonHistory]
  );

  const exportAsText = useCallback(() => {
    if (!currentComparison) return '';
    return exportComparisonAsText(currentComparison);
  }, [currentComparison]);

  const exportAsJSON = useCallback(() => {
    if (!currentComparison) return '';
    return exportComparisonAsJSON(currentComparison);
  }, [currentComparison]);

  const downloadComparison = useCallback(
    (format: 'text' | 'json' = 'text') => {
      try {
        const content = format === 'text' ? exportAsText() : exportAsJSON();
        if (!content) {
          setError('No comparison to export');
          return;
        }

        const element = document.createElement('a');
        const file = new Blob([content], {
          type: format === 'text' ? 'text/plain' : 'application/json',
        });
        element.href = URL.createObjectURL(file);
        element.download = `order-comparison.${format === 'text' ? 'txt' : 'json'}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to download';
        setError(message);
      }
    },
    [exportAsText, exportAsJSON]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data
    selectedOrders,
    currentComparison,
    batchComparison,
    comparisonHistory,

    // State
    isLoading,
    error,

    // Actions
    addOrderToComparison,
    removeOrderFromComparison,
    clearOrders,
    performComparison,
    getCommonProducts,
    getUniqueProducts,
    getDifferences,
    getSummary,
    getTrends,
    exportAsText,
    exportAsJSON,
    downloadComparison,

    // Utility
    clearError,

    // Computed
    canCompare: selectedOrders.length >= 2,
  };
}

/**
 * Hook for multi-order batch comparison
 */
export function useBatchComparison(orders: OrderItem[][]) {
  const [result, setResult] = useState<BatchComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (orders.length < 2) return;

    setIsLoading(true);
    try {
      const batch = compareBatch(orders);
      setResult(batch);
    } finally {
      setIsLoading(false);
    }
  }, [orders]);

  return {
    result,
    isLoading,
    averageOrderValue: result?.comparison.averageOrderValue || 0,
    totalVariation: result?.comparison.totalVariation || 0,
    mostCommonItems: result?.comparison.mostCommonItems || [],
    leastCommonItems: result?.comparison.leastCommonItems || [],
    consistency: result?.comparison.consistency || 0,
  };
}

/**
 * Hook for tracking comparison history
 */
export function useComparisonHistory(maxSize: number = 20) {
  const [history, setHistory] = useState<OrderComparison[]>([]);

  const addComparison = useCallback(
    (comparison: OrderComparison) => {
      setHistory((prev) => {
        const updated = [comparison, ...prev];
        return updated.slice(0, maxSize);
      });
    },
    [maxSize]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getComparison = useCallback((index: number) => {
    return history[index] || null;
  }, [history]);

  return {
    history,
    addComparison,
    clearHistory,
    getComparison,
    size: history.length,
  };
}
