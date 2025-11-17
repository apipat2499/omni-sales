'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Promotion } from '@/types';

interface UsePromotionsOptions {
  isActive?: boolean;
}

interface UsePromotionsReturn {
  promotions: Promotion[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePromotions(options: UsePromotionsOptions = {}): UsePromotionsReturn {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.isActive !== undefined) {
        params.append('isActive', options.isActive.toString());
      }

      const queryString = params.toString();
      const url = `/api/promotions${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch promotions');
      }

      const result = await response.json();
      const data = result.data || result;

      const promotionsWithDates = (Array.isArray(data) ? data : []).map((promo: any) => ({
        ...promo,
        startDate: new Date(promo.startDate || promo.start_date),
        endDate: new Date(promo.endDate || promo.end_date),
        createdAt: new Date(promo.createdAt || promo.created_at),
        updatedAt: new Date(promo.updatedAt || promo.updated_at),
      }));

      setPromotions(promotionsWithDates);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.isActive]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const refresh = useCallback(async () => {
    await fetchPromotions();
  }, [fetchPromotions]);

  return {
    promotions,
    loading,
    error,
    refresh,
  };
}
