'use client';

import { useQuery } from '@tanstack/react-query';

interface AnalyticsOverview {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    productCount: number;
    customerCount: number;
    revenueGrowth: number;
    orderGrowth: number;
  };
  chartData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  lowStockProducts: any[];
}

interface RFMAnalysis {
  customers: Array<{
    customerId: string;
    customerName: string;
    recency: number;
    frequency: number;
    monetary: number;
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    rfmScore: string;
    segment: string;
  }>;
  segments: Array<{
    name: string;
    count: number;
    revenue: number;
    averageValue: number;
  }>;
  summary: {
    totalCustomers: number;
    champions: number;
    atRisk: number;
    lost: number;
  };
}

interface ProductAnalytics {
  topProducts: any[];
  categoryPerformance: any[];
  summary: {
    totalProducts: number;
    totalSold: number;
    totalRevenue: number;
    averageProfitMargin: number;
  };
}

interface SalesForecast {
  historical: {
    dates: string[];
    revenue: number[];
    orders: number[];
  };
  forecast: {
    dates: string[];
    revenue: number[];
    orders: number[];
  };
  trends: {
    revenue: string;
    revenueSlope: number;
    orders: string;
    orderSlope: number;
  };
  projections: {
    nextWeekRevenue: number;
    nextMonthRevenue: number;
    nextWeekOrders: number;
    nextMonthOrders: number;
  };
}

export function useAnalyticsOverview(period: string = '30') {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview', period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/overview?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics overview');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRFMAnalysis() {
  return useQuery<RFMAnalysis>({
    queryKey: ['analytics', 'rfm'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/rfm');
      if (!response.ok) throw new Error('Failed to fetch RFM analysis');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - RFM doesn't change frequently
  });
}

export function useProductAnalytics(period: string = '30') {
  return useQuery<ProductAnalytics>({
    queryKey: ['analytics', 'products', period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/products?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch product analytics');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalesForecast(period: string = '30', forecastDays: number = 7) {
  return useQuery<SalesForecast>({
    queryKey: ['analytics', 'forecast', period, forecastDays],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/forecast?period=${period}&forecast=${forecastDays}`);
      if (!response.ok) throw new Error('Failed to fetch sales forecast');
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}
