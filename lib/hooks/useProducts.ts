'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductCategory } from '@/types';

interface UseProductsOptions {
  search?: string;
  category?: ProductCategory | 'all';
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      if (options.search) {
        params.append('search', options.search);
      }

      if (options.category && options.category !== 'all') {
        params.append('category', options.category);
      }

      const queryString = params.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch products');
      }

      const data = await response.json();

      // Transform date strings to Date objects
      const productsWithDates = data.map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      }));

      setProducts(productsWithDates);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  }, [options.search, options.category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refresh = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refresh,
  };
}
