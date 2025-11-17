'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, ProductCategory } from '@/types';
import type { PaginatedResponse } from '@/lib/utils/pagination';

interface UseProductsParams {
  search?: string;
  category?: ProductCategory | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function fetchProducts(params: UseProductsParams): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.append('search', params.search);
  if (params.category && params.category !== 'all') searchParams.append('category', params.category);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const response = await fetch(`/api/products?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await response.json();

  // Transform date strings to Date objects
  return {
    ...data,
    data: data.data.map((product: any) => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    })),
  };
}

export function useProductsQuery(params: UseProductsParams = {}) {
  const { page = 1, limit = 20, ...rest } = params;

  return useQuery({
    queryKey: ['products', { page, limit, ...rest }],
    queryFn: () => fetchProducts({ page, limit, ...rest }),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Mutation for creating product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Mutation for updating product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Mutation for deleting product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
