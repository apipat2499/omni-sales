'use client';

import useSWR from 'swr';
import type { Order } from '@/types';

interface UseOrderReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mutate: (data?: Order | null, shouldRevalidate?: boolean) => Promise<Order | null | undefined>;
}

// Fetcher function for SWR
async function fetchOrder(url: string): Promise<Order> {
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Order not found');
  }

  const order = await response.json();

  // Transform date strings to Date objects
  return {
    ...order,
    createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt),
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt : new Date(order.updatedAt),
    deliveredAt: order.deliveredAt
      ? order.deliveredAt instanceof Date
        ? order.deliveredAt
        : new Date(order.deliveredAt)
      : undefined,
  };
}

/**
 * SWR-powered hook for fetching a single order by ID
 *
 * Features:
 * - Automatic caching
 * - Request deduplication
 * - Revalidation on focus
 * - Optimistic updates
 * - Better error handling
 */
export function useOrderSWR(orderId: string | null): UseOrderReturn {
  const url = orderId ? `/api/orders/${orderId}` : null;

  // Use SWR with configuration
  const { data, error, isLoading, mutate } = useSWR<Order, Error>(
    url,
    fetchOrder,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      refreshInterval: 0,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (err) => {
        console.error('Error fetching order:', err);
      },
    }
  );

  const refresh = async () => {
    await mutate();
  };

  return {
    order: data || null,
    loading: isLoading,
    error: error?.message || null,
    refresh,
    mutate,
  };
}
