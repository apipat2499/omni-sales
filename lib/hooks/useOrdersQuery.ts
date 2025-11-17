'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus, OrderChannel } from '@/types';
import type { PaginatedResponse } from '@/lib/utils/pagination';

interface UseOrdersParams {
  search?: string;
  status?: OrderStatus | 'all';
  channel?: OrderChannel | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchOrders(params: UseOrdersParams): Promise<PaginatedResponse<Order>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.append('search', params.search);
  if (params.status && params.status !== 'all') searchParams.append('status', params.status);
  if (params.channel && params.channel !== 'all') searchParams.append('channel', params.channel);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await fetch(`/api/orders?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  const data = await response.json();

  // Transform date strings to Date objects
  return {
    ...data,
    data: data.data.map((order: any) => ({
      ...order,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
    })),
  };
}

export function useOrdersQuery(params: UseOrdersParams = {}) {
  const { page = 1, limit = 20, ...rest } = params;

  return useQuery({
    queryKey: ['orders', { page, limit, ...rest }],
    queryFn: () => fetchOrders({ page, limit, ...rest }),
    staleTime: 15 * 1000, // 15 seconds - orders change frequently
  });
}

// Mutation for updating order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Mutation for creating order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: any) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Inventory changed
    },
  });
}
