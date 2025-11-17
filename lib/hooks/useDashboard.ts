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
    async function fetchStats() {
      if (!supabaseReady) {
        setStats(demoDashboardStats);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/stats?days=${days}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [days, supabaseReady]);

  return { stats, loading, error };
}

export function useChartData(days: number = 14) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady } = useAuth();

  useEffect(() => {
    async function fetchChartData() {
      if (!supabaseReady) {
        setChartData(demoChartData.map((point) => ({ ...point })));
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/chart-data?days=${days}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        const data = await response.json();
        setChartData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, [days, supabaseReady]);

  return { chartData, loading, error };
}

export function useCategorySales(days: number = 30) {
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady } = useAuth();

  useEffect(() => {
    async function fetchCategorySales() {
      if (!supabaseReady) {
        setCategorySales(demoCategorySales.map((entry) => ({ ...entry })));
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/category-sales?days=${days}`);
        if (!response.ok) {
          throw new Error('Failed to fetch category sales');
        }
        const data = await response.json();
        setCategorySales(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching category sales:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCategorySales();
  }, [days, supabaseReady]);

  return { categorySales, loading, error };
}
