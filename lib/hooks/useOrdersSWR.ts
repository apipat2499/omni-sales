'use client';

import useSWR from 'swr';
import type { Order, OrderStatus, OrderChannel } from '@/types';

type ApiOrder = Omit<Order, 'createdAt' | 'updatedAt' | 'deliveredAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  deliveredAt?: string | Date | null;
};

interface UseOrdersOptions {
  search?: string;
  status?: OrderStatus | 'all';
  channel?: OrderChannel | 'all';
}

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mutate: (data?: Order[], shouldRevalidate?: boolean) => Promise<Order[] | undefined>;
}

// Fetcher function for SWR
async function fetchOrders(url: string): Promise<Order[]> {
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch orders');
  }

  const data = await response.json();
  const rawOrders: ApiOrder[] = Array.isArray(data) ? data : data.data || [];

  const ordersWithDates: Order[] = rawOrders.map((order) => ({
    ...order,
    createdAt:
      order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt),
    updatedAt:
      order.updatedAt instanceof Date ? order.updatedAt : new Date(order.updatedAt),
    deliveredAt: order.deliveredAt
      ? order.deliveredAt instanceof Date
        ? order.deliveredAt
        : new Date(order.deliveredAt)
      : undefined,
  }));

  return ordersWithDates;
}

/**
 * SWR-powered hook for fetching orders with automatic caching and revalidation
 *
 * Features:
 * - Automatic caching
 * - Request deduplication
 * - Revalidation on focus
 * - Optimistic updates
 * - Better error handling
 */
export function useOrdersSWR(options: UseOrdersOptions = {}): UseOrdersReturn {
  const { search = '', status = 'all', channel = 'all' } = options;

  // Build query parameters
  const params = new URLSearchParams();

  if (search) {
    params.append('search', search);
  }

  if (status && status !== 'all') {
    params.append('status', status);
  }

  if (channel && channel !== 'all') {
    params.append('channel', channel);
  }

  const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;

  // Use SWR with configuration
  const { data, error, isLoading, mutate } = useSWR<Order[], Error>(
    url,
    fetchOrders,
    {
      revalidateOnFocus: true, // Revalidate when window regains focus
      revalidateOnReconnect: true, // Revalidate when reconnecting to network
      dedupingInterval: 2000, // Deduplicate requests within 2 seconds
      refreshInterval: 0, // Disable automatic polling (can be enabled if needed)
      errorRetryCount: 3, // Retry failed requests 3 times
      errorRetryInterval: 5000, // Wait 5 seconds between retries
      onError: (err) => {
        console.error('Error fetching orders:', err);
      },
    }
  );

  const refresh = async () => {
    await mutate();
  };

  return {
    orders: data || [],
    loading: isLoading,
    error: error?.message || null,
    refresh,
    mutate,
  };
}
