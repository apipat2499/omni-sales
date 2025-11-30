'use client';

import useSWR from 'swr';
import type { Product, ProductCategory, ProductFilters } from '@/types';

interface UseProductsOptions extends ProductFilters {
  category?: ProductCategory | 'all';
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mutate: (data?: Product[], shouldRevalidate?: boolean) => Promise<Product[] | undefined>;
}

// Fetcher function for SWR
async function fetchProducts(url: string): Promise<Product[]> {
  const response = await fetch(url);

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch products');
  }

  const result = await response.json();
  const data = result.data || result;

  // Transform date strings to Date objects
  const productsWithDates = (Array.isArray(data) ? data : []).map((product: any) => ({
    ...product,
    createdAt: new Date(product.createdAt || product.created_at),
    updatedAt: new Date(product.updatedAt || product.updated_at),
  }));

  return productsWithDates;
}

/**
 * SWR-powered hook for fetching products with automatic caching and revalidation
 *
 * Features:
 * - Automatic caching
 * - Request deduplication
 * - Revalidation on focus
 * - Optimistic updates
 * - Better error handling
 */
export function useProductsSWR(options: UseProductsOptions = {}): UseProductsReturn {
  // Build query parameters
  const params = new URLSearchParams();

  if (options.search) {
    params.append('search', options.search);
  }

  if (options.category && options.category !== 'all') {
    params.append('category', options.category);
  }

  if (options.minPrice !== undefined) {
    params.append('minPrice', options.minPrice.toString());
  }

  if (options.maxPrice !== undefined) {
    params.append('maxPrice', options.maxPrice.toString());
  }

  if (options.minRating !== undefined) {
    params.append('minRating', options.minRating.toString());
  }

  if (options.inStock) {
    params.append('inStock', 'true');
  }

  if (options.isFeatured) {
    params.append('isFeatured', 'true');
  }

  if (options.sortBy) {
    params.append('sortBy', options.sortBy);
  }

  if (options.sortOrder) {
    params.append('sortOrder', options.sortOrder);
  }

  const queryString = params.toString();
  const url = `/api/products${queryString ? `?${queryString}` : ''}`;

  // Use SWR with configuration
  const { data, error, isLoading, mutate } = useSWR<Product[], Error>(
    url,
    fetchProducts,
    {
      revalidateOnFocus: true, // Revalidate when window regains focus
      revalidateOnReconnect: true, // Revalidate when reconnecting to network
      dedupingInterval: 2000, // Deduplicate requests within 2 seconds
      refreshInterval: 0, // Disable automatic polling (can be enabled if needed)
      errorRetryCount: 3, // Retry failed requests 3 times
      errorRetryInterval: 5000, // Wait 5 seconds between retries
      onError: (err) => {
        console.error('Error fetching products:', err);
      },
    }
  );

  const refresh = async () => {
    await mutate();
  };

  return {
    products: data || [],
    loading: isLoading,
    error: error?.message || null,
    refresh,
    mutate,
  };
}
