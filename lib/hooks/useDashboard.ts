'use client';

import { useState, useEffect } from 'react';
import type { SalesStats, ChartDataPoint, CategorySales } from '@/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { demoDashboardStats, demoChartData, demoCategorySales } from '@/lib/demo/data';

export function useDashboardStats(days: number = 30) {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady } = useAuth();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    async function fetchStats() {
      if (!supabaseReady) {
        setStats(demoDashboardStats);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Set timeout fallback to demo data after 5 seconds
        timeoutId = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('Dashboard stats API timeout, using demo data');
            setStats(demoDashboardStats);
            setError(null);
            setLoading(false);
          }
        }, 5000);

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`/api/dashboard/stats?days=${days}`, {
          signal: controller.signal
        });

        clearTimeout(fetchTimeout);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();

        if (isMounted) {
          setStats(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        if (isMounted) {
          // Fallback to demo data on error
          setStats(demoDashboardStats);
          setError(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [days, supabaseReady]);

  return { stats, loading, error };
}

export function useChartData(days: number = 14) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady } = useAuth();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    async function fetchChartData() {
      if (!supabaseReady) {
        setChartData(demoChartData.map((point) => ({ ...point })));
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Set timeout fallback to demo data after 5 seconds
        timeoutId = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('Chart data API timeout, using demo data');
            setChartData(demoChartData.map((point) => ({ ...point })));
            setError(null);
            setLoading(false);
          }
        }, 5000);

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`/api/dashboard/chart-data?days=${days}`, {
          signal: controller.signal
        });

        clearTimeout(fetchTimeout);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        const data = await response.json();

        if (isMounted) {
          setChartData(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        if (isMounted) {
          // Fallback to demo data on error
          setChartData(demoChartData.map((point) => ({ ...point })));
          setError(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchChartData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [days, supabaseReady]);

  return { chartData, loading, error };
}

export function useCategorySales(days: number = 30) {
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady } = useAuth();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    async function fetchCategorySales() {
      if (!supabaseReady) {
        setCategorySales(demoCategorySales.map((entry) => ({ ...entry })));
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Set timeout fallback to demo data after 5 seconds
        timeoutId = setTimeout(() => {
          if (isMounted && loading) {
            console.warn('Category sales API timeout, using demo data');
            setCategorySales(demoCategorySales.map((entry) => ({ ...entry })));
            setError(null);
            setLoading(false);
          }
        }, 5000);

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`/api/dashboard/category-sales?days=${days}`, {
          signal: controller.signal
        });

        clearTimeout(fetchTimeout);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch category sales');
        }
        const data = await response.json();

        if (isMounted) {
          setCategorySales(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching category sales:', err);
        if (isMounted) {
          // Fallback to demo data on error
          setCategorySales(demoCategorySales.map((entry) => ({ ...entry })));
          setError(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCategorySales();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [days, supabaseReady]);

  return { categorySales, loading, error };
}
