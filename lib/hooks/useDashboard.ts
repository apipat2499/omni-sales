'use client';

import { useState, useEffect, useRef } from 'react';
import type { SalesStats, ChartDataPoint, CategorySales } from '@/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { demoDashboardStats, demoChartData, demoCategorySales } from '@/lib/demo/data';

export function useDashboardStats(days: number = 30) {
  const [stats, setStats] = useState<SalesStats | null>(demoDashboardStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady, loading: authLoading } = useAuth();
  const loadingRef = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let fetchTimeout: NodeJS.Timeout;
    let isMounted = true;

    async function fetchStats() {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!supabaseReady) {
        // Already showing demo data, no need to update
        return;
      }

      try {
        setLoading(true);
        loadingRef.current = true;

        // Set timeout fallback to demo data after 3 seconds
        timeoutId = setTimeout(() => {
          if (isMounted && loadingRef.current) {
            console.warn('Dashboard stats API timeout, using demo data');
            setStats(demoDashboardStats);
            setError(null);
            setLoading(false);
            loadingRef.current = false;
          }
        }, 3000);

        const controller = new AbortController();
        fetchTimeout = setTimeout(() => controller.abort(), 5000);

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
          loadingRef.current = false;
        }
      }
    }

    fetchStats();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (fetchTimeout) clearTimeout(fetchTimeout);
    };
  }, [days, supabaseReady, authLoading]);

  return { stats, loading, error };
}

export function useChartData(days: number = 14) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>(demoChartData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady, loading: authLoading } = useAuth();
  const loadingRef = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let fetchTimeout: NodeJS.Timeout;
    let isMounted = true;

    async function fetchChartData() {
      if (authLoading) {
        return;
      }

      if (!supabaseReady) {
        // Already showing demo data
        return;
      }

      try {
        setLoading(true);
        loadingRef.current = true;

        // Set timeout fallback to demo data after 3 seconds
        timeoutId = setTimeout(() => {
          if (isMounted && loadingRef.current) {
            console.warn('Chart data API timeout, using demo data');
            setChartData(demoChartData.map((point) => ({ ...point })));
            setError(null);
            setLoading(false);
            loadingRef.current = false;
          }
        }, 3000);

        const controller = new AbortController();
        fetchTimeout = setTimeout(() => controller.abort(), 5000);

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
          loadingRef.current = false;
        }
      }
    }

    fetchChartData();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (fetchTimeout) clearTimeout(fetchTimeout);
    };
  }, [days, supabaseReady, authLoading]);

  return { chartData, loading, error };
}

export function useCategorySales(days: number = 30) {
  const [categorySales, setCategorySales] = useState<CategorySales[]>(demoCategorySales);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady, loading: authLoading } = useAuth();
  const loadingRef = useRef(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let fetchTimeout: NodeJS.Timeout;
    let isMounted = true;

    async function fetchCategorySales() {
      if (authLoading) {
        return;
      }

      if (!supabaseReady) {
        // Already showing demo data
        return;
      }

      try {
        setLoading(true);
        loadingRef.current = true;

        // Set timeout fallback to demo data after 3 seconds
        timeoutId = setTimeout(() => {
          if (isMounted && loadingRef.current) {
            console.warn('Category sales API timeout, using demo data');
            setCategorySales(demoCategorySales.map((entry) => ({ ...entry })));
            setError(null);
            setLoading(false);
            loadingRef.current = false;
          }
        }, 3000);

        const controller = new AbortController();
        fetchTimeout = setTimeout(() => controller.abort(), 5000);

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
          loadingRef.current = false;
        }
      }
    }

    fetchCategorySales();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (fetchTimeout) clearTimeout(fetchTimeout);
    };
  }, [days, supabaseReady, authLoading]);

  return { categorySales, loading, error };
}
