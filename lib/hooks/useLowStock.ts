'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/types';

export function useLowStock(threshold: number = 10) {
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLowStock() {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/low-stock?threshold=${threshold}`);

        if (!response.ok) {
          throw new Error('Failed to fetch low stock products');
        }

        const data = await response.json();
        setProducts(data.products || []);
        setCount(data.count || 0);
        setError(null);
      } catch (err) {
        console.error('Error fetching low stock products:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLowStock();
  }, [threshold]);

  return { products, count, loading, error };
}
