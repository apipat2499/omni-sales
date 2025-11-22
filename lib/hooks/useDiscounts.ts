import { useState, useEffect, useCallback } from 'react';
import type { Discount, OrderItem } from '@/types';

export function useDiscounts(search?: string, activeFilter?: string) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (activeFilter) params.append('active', activeFilter);

      const response = await fetch(`/api/discounts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch discounts');
      }

      const data = await response.json();
      setDiscounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discounts. Please check your connection and try again.');
      console.error('Error fetching discounts:', err);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const createDiscount = async (discountData: Partial<Discount>) => {
    try {
      const response = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create discount');
      }

      const newDiscount = await response.json();
      setDiscounts((prev) => [newDiscount, ...prev]);
      return newDiscount;
    } catch (err) {
      throw err;
    }
  };

  const updateDiscount = async (id: string, discountData: Partial<Discount>) => {
    try {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update discount');
      }

      const updatedDiscount = await response.json();
      setDiscounts((prev) =>
        prev.map((d) => (d.id === id ? updatedDiscount : d))
      );
      return updatedDiscount;
    } catch (err) {
      throw err;
    }
  };

  const deleteDiscount = async (id: string) => {
    try {
      const response = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete discount');
      }

      setDiscounts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const validateDiscount = async (
    code: string,
    subtotal: number,
    items?: Array<Pick<OrderItem, 'productId' | 'quantity'>>
  ) => {
    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, items }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate discount');
      }

      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  return {
    discounts,
    loading,
    error,
    refresh: fetchDiscounts,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    validateDiscount,
  };
}
