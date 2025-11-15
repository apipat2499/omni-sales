import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus, OrderChannel } from '@/types';

interface UseOrdersOptions {
  search?: string;
  status?: OrderStatus | 'all';
  channel?: OrderChannel | 'all';
}

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { search = '', status = 'all', channel = 'all' } = options;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
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
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch orders');
      }

      const data = await response.json();

      // Transform date strings to Date objects
      const ordersWithDates: Order[] = data.map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
        deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
      }));

      setOrders(ordersWithDates);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, channel, refreshKey]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return {
    orders,
    loading,
    error,
    refresh,
  };
}
