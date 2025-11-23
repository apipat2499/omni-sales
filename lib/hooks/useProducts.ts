'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductCategory, ProductFilters } from '@/types';

interface UseProductsOptions extends ProductFilters {
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

      setProducts(productsWithDates);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products. Please check your connection and try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    options.search,
    options.category,
    options.minPrice,
    options.maxPrice,
    options.minRating,
    options.inStock,
    options.isFeatured,
    options.sortBy,
    options.sortOrder,
  ]);

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
