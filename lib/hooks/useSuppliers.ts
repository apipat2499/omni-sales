'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Supplier } from '@/types';

interface UseSuppliersOptions {
  search?: string;
  isActive?: boolean;
}

interface UseSuppliersReturn {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSuppliers(options: UseSuppliersOptions = {}): UseSuppliersReturn {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.search) params.append('search', options.search);
      if (options.isActive !== undefined) params.append('isActive', options.isActive.toString());

      const queryString = params.toString();
      const url = `/api/suppliers${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch suppliers');
      }

      const result = await response.json();
      const data = result.data || result;

      const suppliersWithDates = (Array.isArray(data) ? data : []).map((supplier: any) => ({
        ...supplier,
        createdAt: new Date(supplier.createdAt || supplier.created_at),
        updatedAt: new Date(supplier.updatedAt || supplier.updated_at),
      }));

      setSuppliers(suppliersWithDates);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [options.search, options.isActive]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const refresh = useCallback(async () => {
    await fetchSuppliers();
  }, [fetchSuppliers]);

  return { suppliers, loading, error, refresh };
}
