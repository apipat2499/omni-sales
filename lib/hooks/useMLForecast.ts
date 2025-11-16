import { useState, useEffect, useCallback } from 'react';

export interface ForecastResult {
  date: Date;
  predicted: number;
  lower: number;
  upper: number;
  trend: number;
  seasonal: number;
  residual: number;
}

export interface ForecastSummary {
  totalPredicted: number;
  avgDaily: number;
  confidence95Range: { min: number; max: number };
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface UseMLForecastOptions {
  period?: 30 | 90;
  productId?: string;
  autoFetch?: boolean;
}

export interface UseMLForecastReturn {
  forecast: ForecastResult[];
  summary: ForecastSummary | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching ML-powered sales forecasts
 */
export function useMLForecast(options: UseMLForecastOptions = {}): UseMLForecastReturn {
  const { period = 30, productId, autoFetch = true } = options;

  const [forecast, setForecast] = useState<ForecastResult[]>([]);
  const [summary, setSummary] = useState<ForecastSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period: period.toString(),
      });

      if (productId) {
        params.append('productId', productId);
      }

      const response = await fetch(`/api/ml/forecast/sales?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch forecast');
      }

      const result = await response.json();

      if (result.success) {
        if (result.data.type === 'sales') {
          setForecast(result.data.forecast);
          setSummary(result.data.summary);
        } else {
          setForecast(result.data.forecast);
          setSummary(null);
        }
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching forecast:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, productId]);

  useEffect(() => {
    if (autoFetch) {
      fetchForecast();
    }
  }, [autoFetch, fetchForecast]);

  return {
    forecast,
    summary,
    isLoading,
    error,
    refresh: fetchForecast,
  };
}

export default useMLForecast;
