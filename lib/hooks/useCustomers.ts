'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer, CustomerTag } from '@/types';

interface UseCustomersOptions {
  search?: string;
  tags?: CustomerTag | 'all';
}

interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCustomers(options: UseCustomersOptions = {}): UseCustomersReturn {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      if (options.search) {
        params.append('search', options.search);
      }

      if (options.tags && options.tags !== 'all') {
        params.append('tags', options.tags);
      }

      const queryString = params.toString();
      const url = `/api/customers${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch customers');
      }

      const result = await response.json();

      // Handle paginated response
      const data = Array.isArray(result) ? result : (result.data || []);

      // Transform date strings to Date objects
      const customersWithDates = data.map((customer: any) => ({
        ...customer,
        createdAt: new Date(customer.createdAt),
        updatedAt: new Date(customer.updatedAt),
        lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined,
      }));

      setCustomers(customersWithDates);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching customers');
    } finally {
      setLoading(false);
    }
  }, [options.search, options.tags]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const refresh = useCallback(async () => {
    await fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refresh,
  };
}
