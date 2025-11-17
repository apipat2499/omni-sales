import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus, OrderChannel } from '@/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { getDemoOrders } from '@/lib/demo/data';

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
  refresh: () => void;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { supabaseReady } = useAuth();

  const { search = '', status = 'all', channel = 'all' } = options;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabaseReady) {
        const filtered = filterDemoOrders(getDemoOrders(), search, status, channel);
        setOrders(filtered);
        setLoading(false);
        return;
      }

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

      setOrders(ordersWithDates);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      if (!supabaseReady) {
        setOrders(filterDemoOrders(getDemoOrders(), search, status, channel));
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [search, status, channel, supabaseReady]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshKey]);

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

function filterDemoOrders(
  source: Order[],
  search: string,
  status: OrderStatus | 'all',
  channel: OrderChannel | 'all'
) {
  return source.filter((order) => {
    const matchSearch =
      !search ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === 'all' || order.status === status;
    const matchChannel = channel === 'all' || order.channel === channel;
    return matchSearch && matchStatus && matchChannel;
  });
}
