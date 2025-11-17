'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer, CustomerTag } from '@/types';
import type { PaginatedResponse } from '@/lib/utils/pagination';

interface UseCustomersParams {
  search?: string;
  tags?: CustomerTag | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchCustomers(params: UseCustomersParams): Promise<PaginatedResponse<Customer>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.append('search', params.search);
  if (params.tags && params.tags !== 'all') searchParams.append('tags', params.tags);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await fetch(`/api/customers?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch customers');
  }

  const data = await response.json();

  // Transform date strings to Date objects
  return {
    ...data,
    data: data.data.map((customer: any) => ({
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
      lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined,
    })),
  };
}

export function useCustomersQuery(params: UseCustomersParams = {}) {
  const { page = 1, limit = 20, ...rest } = params;

  return useQuery({
    queryKey: ['customers', { page, limit, ...rest }],
    queryFn: () => fetchCustomers({ page, limit, ...rest }),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Mutation for creating customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData: Partial<Customer>) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Mutation for updating customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update customer');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Mutation for deleting customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete customer');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
