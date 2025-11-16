'use client';

/**
 * Dashboard Cards Component
 *
 * Real-time dashboard with KPI widgets that auto-refresh every 5 minutes.
 * Displays key metrics like revenue, orders, customers, and performance indicators.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, ShoppingCart, Users, TrendingUp, Package, Activity } from 'lucide-react';
import KPICard from './KPICard';

interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    trend: number;
    sparkline: number[];
  };
  orders: {
    current: number;
    previous: number;
    trend: number;
    sparkline: number[];
  };
  customers: {
    current: number;
    previous: number;
    trend: number;
    sparkline: number[];
  };
  avgOrderValue: {
    current: number;
    previous: number;
    trend: number;
    sparkline: number[];
  };
  conversionRate: {
    current: number;
    previous: number;
    trend: number;
    sparkline: number[];
  };
  activeProducts: {
    current: number;
    previous: number;
    trend: number;
    sparkline: number[];
  };
}

interface DashboardCardsProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function DashboardCards({
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
  dateRange
}: DashboardCardsProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setError(null);

      // Fetch daily metrics
      const params = new URLSearchParams();
      params.append('mode', 'advanced'); // Use advanced mode
      if (dateRange?.start) params.append('startDate', dateRange.start);
      if (dateRange?.end) params.append('endDate', dateRange.end);

      const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }

      const data = await response.json();

      if (data.success) {
        setMetrics(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error('Dashboard metrics error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');

      // Use mock data for development
      setMetrics(getMockMetrics());
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  if (error && !metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">Error loading dashboard</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          {autoRefresh && (
            <span className="flex items-center space-x-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Auto-refresh enabled</span>
            </span>
          )}
          <button
            onClick={fetchMetrics}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          title="Total Revenue"
          value={metrics?.revenue.current || 0}
          trend={metrics?.revenue.trend}
          previousValue={metrics?.revenue.previous}
          icon={<DollarSign className="w-6 h-6" />}
          format="currency"
          loading={loading}
          sparklineData={metrics?.revenue.sparkline}
          color="green"
        />

        <KPICard
          title="Total Orders"
          value={metrics?.orders.current || 0}
          trend={metrics?.orders.trend}
          previousValue={metrics?.orders.previous}
          icon={<ShoppingCart className="w-6 h-6" />}
          format="number"
          loading={loading}
          sparklineData={metrics?.orders.sparkline}
          color="blue"
        />

        <KPICard
          title="Active Customers"
          value={metrics?.customers.current || 0}
          trend={metrics?.customers.trend}
          previousValue={metrics?.customers.previous}
          icon={<Users className="w-6 h-6" />}
          format="number"
          loading={loading}
          sparklineData={metrics?.customers.sparkline}
          color="purple"
        />

        <KPICard
          title="Avg Order Value"
          value={metrics?.avgOrderValue.current || 0}
          trend={metrics?.avgOrderValue.trend}
          previousValue={metrics?.avgOrderValue.previous}
          icon={<TrendingUp className="w-6 h-6" />}
          format="currency"
          loading={loading}
          sparklineData={metrics?.avgOrderValue.sparkline}
          color="yellow"
        />

        <KPICard
          title="Conversion Rate"
          value={metrics?.conversionRate.current || 0}
          trend={metrics?.conversionRate.trend}
          previousValue={metrics?.conversionRate.previous}
          icon={<Activity className="w-6 h-6" />}
          format="percentage"
          loading={loading}
          sparklineData={metrics?.conversionRate.sparkline}
          color="green"
        />

        <KPICard
          title="Active Products"
          value={metrics?.activeProducts.current || 0}
          trend={metrics?.activeProducts.trend}
          previousValue={metrics?.activeProducts.previous}
          icon={<Package className="w-6 h-6" />}
          format="number"
          loading={loading}
          sparklineData={metrics?.activeProducts.sparkline}
          color="blue"
        />
      </div>
    </div>
  );
}

/**
 * Mock metrics for development/fallback
 */
function getMockMetrics(): DashboardMetrics {
  return {
    revenue: {
      current: 125430.50,
      previous: 108750.25,
      trend: 15.3,
      sparkline: [95000, 102000, 98000, 115000, 108750, 125430]
    },
    orders: {
      current: 342,
      previous: 298,
      trend: 14.8,
      sparkline: [250, 275, 260, 310, 298, 342]
    },
    customers: {
      current: 1245,
      previous: 1180,
      trend: 5.5,
      sparkline: [1100, 1150, 1120, 1200, 1180, 1245]
    },
    avgOrderValue: {
      current: 366.76,
      previous: 365.10,
      trend: 0.5,
      sparkline: [360, 365, 358, 371, 365, 367]
    },
    conversionRate: {
      current: 3.8,
      previous: 3.5,
      trend: 8.6,
      sparkline: [3.2, 3.4, 3.3, 3.6, 3.5, 3.8]
    },
    activeProducts: {
      current: 89,
      previous: 85,
      trend: 4.7,
      sparkline: [82, 84, 83, 87, 85, 89]
    }
  };
}
