'use client';

import { useState, useEffect } from 'react';
import type { SalesStats, ChartDataPoint, CategorySales } from '@/types';

export function useDashboardStats(days: number = 30) {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
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
  }, [days]);

  return { stats, loading, error };
}

export function useChartData(days: number = 14) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChartData() {
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
  }, [days]);

  return { chartData, loading, error };
}

export function useCategorySales(days: number = 30) {
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategorySales() {
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
  }, [days]);

  return { categorySales, loading, error };
}
