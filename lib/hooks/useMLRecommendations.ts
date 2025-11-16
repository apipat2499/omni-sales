import { useState, useEffect, useCallback } from 'react';

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
  algorithm: 'collaborative' | 'content-based' | 'hybrid';
}

export interface UseMLRecommendationsOptions {
  userId: string;
  topN?: number;
  algorithm?: 'user-based' | 'item-based' | 'content-based' | 'hybrid';
  context?: string;
  useCache?: boolean;
  autoFetch?: boolean;
}

export interface UseMLRecommendationsReturn {
  recommendations: RecommendationResult[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  generateNew: () => Promise<void>;
}

/**
 * Hook for fetching ML-powered product recommendations
 */
export function useMLRecommendations(
  options: UseMLRecommendationsOptions
): UseMLRecommendationsReturn {
  const {
    userId,
    topN = 10,
    algorithm = 'hybrid',
    context = 'general',
    useCache = true,
    autoFetch = true,
  } = options;

  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        topN: topN.toString(),
        algorithm,
        context,
        useCache: useCache.toString(),
      });

      const response = await fetch(`/api/ml/recommendations/${userId}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const result = await response.json();

      if (result.success) {
        setRecommendations(result.data.recommendations);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, topN, algorithm, context, useCache]);

  const generateNew = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ml/recommendations/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topN,
          algorithm,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const result = await response.json();

      if (result.success) {
        setRecommendations(result.data.recommendations);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error generating recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, topN, algorithm, context]);

  useEffect(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
  }, [autoFetch, fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh: fetchRecommendations,
    generateNew,
  };
}

export default useMLRecommendations;
