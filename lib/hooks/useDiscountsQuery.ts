'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Discount } from '@/types';
import type { PaginatedResponse } from '@/lib/utils/pagination';

interface UseDiscountsParams {
  search?: string;
  active?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchDiscounts(params: UseDiscountsParams): Promise<PaginatedResponse<Discount>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.append('search', params.search);
  if (params.active) searchParams.append('active', params.active);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await fetch(`/api/discounts?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch discounts');
  }

  const data = await response.json();

  // Transform date strings to Date objects
  return {
    ...data,
    data: data.data.map((discount: any) => ({
      ...discount,
      createdAt: new Date(discount.createdAt),
      updatedAt: new Date(discount.updatedAt),
      startDate: discount.startDate ? new Date(discount.startDate) : undefined,
      endDate: discount.endDate ? new Date(discount.endDate) : undefined,
    })),
  };
}

export function useDiscountsQuery(params: UseDiscountsParams = {}) {
  const { page = 1, limit = 20, ...rest } = params;

  return useQuery({
    queryKey: ['discounts', { page, limit, ...rest }],
    queryFn: () => fetchDiscounts({ page, limit, ...rest }),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Mutation for creating discount
export function useCreateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (discountData: Partial<Discount>) => {
      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create discount');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}

// Mutation for updating discount
export function useUpdateDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Discount> }) => {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update discount');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}

// Mutation for deleting discount
export function useDeleteDiscount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete discount');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
}
