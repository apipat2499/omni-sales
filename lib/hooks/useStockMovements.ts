'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginatedResponse } from '@/lib/utils/pagination';

export interface StockMovement {
  id: number;
  product_id: number;
  type: 'sale' | 'purchase' | 'adjustment' | 'return' | 'transfer';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  products?: {
    id: number;
    name: string;
    sku: string;
    category: string;
  };
}

interface UseStockMovementsParams {
  productId?: number;
  type?: string;
  referenceType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchStockMovements(
  params: UseStockMovementsParams
): Promise<PaginatedResponse<StockMovement>> {
  const searchParams = new URLSearchParams();

  if (params.productId) searchParams.set('productId', params.productId.toString());
  if (params.type) searchParams.set('type', params.type);
  if (params.referenceType) searchParams.set('referenceType', params.referenceType);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`/api/stock-movements?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch stock movements');
  }
  return response.json();
}

export function useStockMovements(params: UseStockMovementsParams = {}) {
  return useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => fetchStockMovements(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<StockMovement>) => {
      const response = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create stock movement');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate stock movements and products queries
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

/**
 * Helper function to record stock movement when creating an order
 */
export async function recordOrderStockMovement(
  productId: number,
  quantity: number,
  orderId: number
): Promise<void> {
  await fetch('/api/stock-movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      type: 'sale',
      quantity: -quantity, // Negative for sales
      reference_type: 'order',
      reference_id: orderId,
      notes: `Order #${orderId}`,
    }),
  });
}

/**
 * Helper function to record manual stock adjustment
 */
export async function recordStockAdjustment(
  productId: number,
  quantity: number,
  notes?: string
): Promise<void> {
  await fetch('/api/stock-movements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      type: 'adjustment',
      quantity,
      reference_type: 'manual',
      notes,
    }),
  });
}
