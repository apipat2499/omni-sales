import { useState, useEffect, useCallback } from 'react';

export interface ChurnFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface RFMScore {
  customerId: string;
  recency: number;
  frequency: number;
  monetary: number;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmScore: string;
  segment: string;
}

export interface ChurnPrediction {
  customerId: string;
  customerName: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  rfmScore: RFMScore;
  factors: ChurnFactor[];
  recommendedActions: string[];
  daysUntilChurn?: number;
}

export interface UseMLChurnOptions {
  customerId?: string;
  minRiskLevel?: 'medium' | 'high' | 'critical';
  limit?: number;
  autoFetch?: boolean;
}

export interface UseMLChurnReturn {
  predictions: ChurnPrediction[];
  singlePrediction: ChurnPrediction | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fetchCustomerChurn: (customerId: string) => Promise<ChurnPrediction | null>;
}

/**
 * Hook for fetching ML-powered churn predictions
 */
export function useMLChurn(options: UseMLChurnOptions = {}): UseMLChurnReturn {
  const { customerId, minRiskLevel = 'medium', limit = 100, autoFetch = true } = options;

  const [predictions, setPredictions] = useState<ChurnPrediction[]>([]);
  const [singlePrediction, setSinglePrediction] = useState<ChurnPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAtRiskCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        minRiskLevel,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/ml/churn/at-risk?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch at-risk customers');
      }

      const result = await response.json();

      if (result.success) {
        setPredictions(result.data.customers);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching at-risk customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [minRiskLevel, limit]);

  const fetchCustomerChurn = useCallback(async (targetCustomerId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ml/churn/${targetCustomerId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch customer churn prediction');
      }

      const result = await response.json();

      if (result.success) {
        return result.data as ChurnPrediction;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching customer churn:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      if (customerId) {
        fetchCustomerChurn(customerId).then(prediction => {
          if (prediction) {
            setSinglePrediction(prediction);
          }
        });
      } else {
        fetchAtRiskCustomers();
      }
    }
  }, [autoFetch, customerId, fetchCustomerChurn, fetchAtRiskCustomers]);

  return {
    predictions,
    singlePrediction,
    isLoading,
    error,
    refresh: customerId ? () => fetchCustomerChurn(customerId).then(() => {}) : fetchAtRiskCustomers,
    fetchCustomerChurn,
  };
}

export default useMLChurn;
