import { useState, useCallback, useEffect } from 'react';
import {
  getStockLevel,
  getAllStockLevels,
  updateStockLevel,
  initializeStock,
  getMovementHistory,
  getAllAlerts,
  acknowledgeAlert,
  getLowStockProducts,
  getOutOfStockProducts,
  forecastStock,
  StockLevel,
  StockAlert,
  StockMovement,
} from '@/lib/utils/stock-management';

/**
 * Hook for stock management
 */
export function useStockManagement(productId?: string) {
  const [stock, setStock] = useState<StockLevel | null>(null);
  const [allStocks, setAllStocks] = useState<StockLevel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [forecast, setForecast] = useState<Array<{
    date: string;
    predictedStock: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stock data
  useEffect(() => {
    loadStockData();
  }, [productId]);

  const loadStockData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (productId) {
        const s = getStockLevel(productId);
        setStock(s);

        const m = getMovementHistory(productId);
        setMovements(m);

        const f = forecastStock(productId);
        setForecast(f);
      }

      const allS = getAllStockLevels();
      setAllStocks(allS);

      const a = getAllAlerts();
      setAlerts(a);

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  const updateStock = useCallback(
    (quantity: number, options?: any) => {
      if (!productId) return null;

      try {
        const updated = updateStockLevel(productId, quantity, options);
        if (updated) {
          setStock(updated);
          loadStockData();
        }
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update stock';
        setError(message);
        return null;
      }
    },
    [productId, loadStockData]
  );

  const addStock = useCallback(
    (quantity: number, reason?: string) => {
      return updateStock(quantity, { type: 'in', reason });
    },
    [updateStock]
  );

  const removeStock = useCallback(
    (quantity: number, reason?: string) => {
      return updateStock(-quantity, { type: 'out', reason });
    },
    [updateStock]
  );

  const acknowledgeStockAlert = useCallback(
    (type: 'low-stock' | 'out-of-stock' | 'overstock') => {
      if (!productId) return false;

      try {
        const success = acknowledgeAlert(productId, type);
        if (success) {
          loadStockData();
        }
        return success;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to acknowledge alert';
        setError(message);
        return false;
      }
    },
    [productId, loadStockData]
  );

  const refresh = useCallback(async () => {
    await loadStockData();
  }, [loadStockData]);

  return {
    // Data
    stock,
    allStocks,
    movements,
    alerts,
    forecast,

    // State
    isLoading,
    error,

    // Actions
    addStock,
    removeStock,
    updateStock,
    acknowledgeStockAlert,
    refresh,

    // Computed
    isLowStock: stock?.status === 'low-stock',
    isCritical: stock?.status === 'critical',
    isOutOfStock: stock?.status === 'out-of-stock',
    daysUntilStockout: stock
      ? Math.ceil(stock.currentStock / Math.max(1, movements.length / 30))
      : null,
  };
}

/**
 * Hook for inventory overview
 */
export function useInventoryOverview() {
  const [inventory, setInventory] = useState<StockLevel[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<StockLevel[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<StockLevel[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = getAllStockLevels();
      setInventory(all);

      const low = getLowStockProducts();
      setLowStockProducts(low);

      const out = getOutOfStockProducts();
      setOutOfStockProducts(out);

      const a = getAllAlerts();
      setAlerts(a);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const totalInventoryValue = inventory.reduce((sum, stock) => {
    return sum + stock.currentStock; // Would multiply by unit cost in real scenario
  }, 0);

  const healthScore = Math.max(
    0,
    100 -
      (outOfStockProducts.length * 10 + lowStockProducts.length * 5) / Math.max(inventory.length, 1)
  );

  return {
    inventory,
    lowStockProducts,
    outOfStockProducts,
    alerts,
    isLoading,
    totalInventoryValue,
    healthScore,
    refresh: loadInventory,
  };
}
