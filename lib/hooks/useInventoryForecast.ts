'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  DemandHistory,
  Forecast,
  ForecastSettings,
  AlgorithmComparison,
  SeasonalityInfo,
  calculateForecast,
  compareAlgorithms,
  getForecastChartData,
  analyzeTrend,
  detectSeasonality,
} from '@/lib/utils/inventory-forecasting';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ForecastCache {
  [productId: string]: {
    forecast: Forecast;
    timestamp: number;
    settings: ForecastSettings;
  };
}

export interface UseInventoryForecastOptions {
  productId?: string;
  autoCalculate?: boolean;
  cacheTTL?: number; // milliseconds
}

export interface UseInventoryForecastReturn {
  forecast: Forecast | null;
  isCalculating: boolean;
  error: string | null;
  accuracy: number;
  trend: 'up' | 'down' | 'stable';

  calculateForecast: (
    productId: string,
    history: DemandHistory[],
    settings?: ForecastSettings
  ) => Promise<Forecast>;
  getForecastData: (days?: number) => any[];
  getSeasonality: () => SeasonalityInfo | undefined;
  compareAlgorithms: (history: DemandHistory[]) => AlgorithmComparison[];
  clearCache: (productId?: string) => void;
  refreshForecast: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing inventory forecast state and calculations
 */
export function useInventoryForecast(
  options: UseInventoryForecastOptions = {}
): UseInventoryForecastReturn {
  const { productId, autoCalculate = false, cacheTTL = 24 * 60 * 60 * 1000 } = options;

  // State
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<DemandHistory[]>([]);
  const [cache, setCache] = useState<ForecastCache>({});

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Check if cached forecast is still valid
   */
  const isCacheValid = useCallback(
    (productId: string, settings: ForecastSettings): boolean => {
      const cached = cache[productId];
      if (!cached) return false;

      // Check if TTL expired
      const now = Date.now();
      if (now - cached.timestamp > cacheTTL) return false;

      // Check if settings match
      const settingsMatch =
        cached.settings.algorithm === settings.algorithm &&
        cached.settings.periods === settings.periods &&
        cached.settings.confidenceLevel === settings.confidenceLevel;

      return settingsMatch;
    },
    [cache, cacheTTL]
  );

  /**
   * Clear cache for specific product or all products
   */
  const clearCache = useCallback((productId?: string) => {
    if (productId) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[productId];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  // ============================================================================
  // FORECAST CALCULATION
  // ============================================================================

  /**
   * Calculate forecast for a product
   */
  const calculateForecastForProduct = useCallback(
    async (
      productId: string,
      demandHistory: DemandHistory[],
      settings: ForecastSettings = {}
    ): Promise<Forecast> => {
      setIsCalculating(true);
      setError(null);

      try {
        // Check cache first
        if (isCacheValid(productId, settings)) {
          const cached = cache[productId];
          setForecast(cached.forecast);
          setIsCalculating(false);
          return cached.forecast;
        }

        // Validate history
        if (!demandHistory || demandHistory.length === 0) {
          throw new Error('No demand history available for forecasting');
        }

        // Calculate forecast
        const result = await calculateForecast(productId, demandHistory, settings);

        // Update cache
        setCache(prev => ({
          ...prev,
          [productId]: {
            forecast: result,
            timestamp: Date.now(),
            settings,
          },
        }));

        // Update state
        setForecast(result);
        setHistory(demandHistory);

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to calculate forecast';
        setError(errorMessage);
        throw err;
      } finally {
        setIsCalculating(false);
      }
    },
    [cache, isCacheValid]
  );

  /**
   * Refresh current forecast
   */
  const refreshForecast = useCallback(async () => {
    if (!productId || history.length === 0) {
      return;
    }

    // Clear cache for this product to force recalculation
    clearCache(productId);

    await calculateForecastForProduct(productId, history);
  }, [productId, history, clearCache, calculateForecastForProduct]);

  // ============================================================================
  // DATA RETRIEVAL
  // ============================================================================

  /**
   * Get forecast chart data
   */
  const getForecastData = useCallback(
    (days: number = 60) => {
      if (!forecast) return [];
      return getForecastChartData(forecast, history, days);
    },
    [forecast, history]
  );

  /**
   * Get seasonality information
   */
  const getSeasonality = useCallback((): SeasonalityInfo | undefined => {
    return forecast?.seasonality;
  }, [forecast]);

  /**
   * Compare forecasting algorithms
   */
  const compareAlgorithmsForHistory = useCallback(
    (demandHistory: DemandHistory[]): AlgorithmComparison[] => {
      if (!demandHistory || demandHistory.length < 7) {
        return [];
      }
      return compareAlgorithms(demandHistory);
    },
    []
  );

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  /**
   * Get forecast accuracy (0-1)
   */
  const accuracy = useMemo(() => {
    return forecast?.accuracy || 0;
  }, [forecast]);

  /**
   * Get demand trend
   */
  const trend = useMemo<'up' | 'down' | 'stable'>(() => {
    if (history.length === 0) return 'stable';
    return analyzeTrend(history);
  }, [history]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Auto-calculate forecast when productId changes
   */
  useEffect(() => {
    if (autoCalculate && productId && history.length > 0) {
      calculateForecastForProduct(productId, history);
    }
  }, [autoCalculate, productId, history, calculateForecastForProduct]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    forecast,
    isCalculating,
    error,
    accuracy,
    trend,

    calculateForecast: calculateForecastForProduct,
    getForecastData,
    getSeasonality,
    compareAlgorithms: compareAlgorithmsForHistory,
    clearCache,
    refreshForecast,
  };
}

// ============================================================================
// ADDITIONAL HOOKS
// ============================================================================

/**
 * Hook for fetching demand history from API
 */
export function useDemandHistory(productId: string, days: number = 90) {
  const [history, setHistory] = useState<DemandHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/inventory/demand-history?productId=${productId}&days=${days}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch demand history');
      }

      const data = await response.json();

      // Transform data to DemandHistory format
      const transformedHistory: DemandHistory[] = data.map((item: any) => ({
        date: new Date(item.date),
        quantity: item.quantity || 0,
        revenue: item.revenue || 0,
      }));

      setHistory(transformedHistory);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch demand history';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [productId, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

/**
 * Hook for managing multiple product forecasts
 */
export function useMultiProductForecast(productIds: string[]) {
  const [forecasts, setForecasts] = useState<Record<string, Forecast>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateForecasts = useCallback(
    async (
      histories: Record<string, DemandHistory[]>,
      settings: ForecastSettings = {}
    ) => {
      setIsCalculating(true);
      const newForecasts: Record<string, Forecast> = {};
      const newErrors: Record<string, string> = {};

      for (const productId of productIds) {
        const history = histories[productId];
        if (!history || history.length === 0) {
          newErrors[productId] = 'No demand history available';
          continue;
        }

        try {
          const forecast = await calculateForecast(productId, history, settings);
          newForecasts[productId] = forecast;
        } catch (err) {
          newErrors[productId] =
            err instanceof Error ? err.message : 'Failed to calculate forecast';
        }
      }

      setForecasts(newForecasts);
      setErrors(newErrors);
      setIsCalculating(false);
    },
    [productIds]
  );

  return {
    forecasts,
    isCalculating,
    errors,
    calculateForecasts,
  };
}

/**
 * Hook for forecast settings management
 */
export function useForecastSettings() {
  const [settings, setSettings] = useState<ForecastSettings>({
    algorithm: 'hybrid',
    periods: 30,
    confidenceLevel: 0.95,
    smoothingFactor: 0.3,
    smaWindow: 7,
    minSeasonalPeriod: 7,
    maxSeasonalPeriod: 365,
  });

  const updateSetting = useCallback(
    <K extends keyof ForecastSettings>(key: K, value: ForecastSettings[K]) => {
      setSettings(prev => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings({
      algorithm: 'hybrid',
      periods: 30,
      confidenceLevel: 0.95,
      smoothingFactor: 0.3,
      smaWindow: 7,
      minSeasonalPeriod: 7,
      maxSeasonalPeriod: 365,
    });
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
