import { useState, useEffect } from 'react';

interface ReportSummary {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface ReportOrder {
  id: string;
  customerId: string;
  customerName: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  channel: string;
  createdAt: Date;
  items: OrderItem[];
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

interface TopCustomer {
  id: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface ReportsData {
  summary: ReportSummary;
  orders: ReportOrder[];
  topProducts: TopProduct[];
  topCustomers: TopCustomer[];
  chartData: ChartDataPoint[];
}

export function useReports(dateRange: '7days' | '30days' | '3months' = '30days') {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        setIsLoading(true);
        setError(null);

        // Convert date range to days
        let days = 30;
        if (dateRange === '7days') days = 7;
        else if (dateRange === '3months') days = 90;

        const response = await fetch(`/api/reports?days=${days}`);

        if (!response.ok) {
          throw new Error('Failed to fetch reports data');
        }

        const result = await response.json();

        // Transform dates from strings to Date objects
        const transformedData: ReportsData = {
          ...result,
          orders: result.orders.map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
          })),
        };

        setData(transformedData);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchReports();
  }, [dateRange]);

  return { data, isLoading, error };
}
