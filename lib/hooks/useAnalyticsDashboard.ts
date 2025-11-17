import { useState, useMemo, useCallback, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import {
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  subYears,
  startOfYear,
  format,
  differenceInDays,
  eachDayOfInterval,
  parseISO,
} from 'date-fns';
import type { PerformanceMetric } from '@/components/analytics/PerformanceCard';
import jsPDF from 'jspdf';

// Data structures
export interface SalesDayData {
  date: string;
  revenue: number;
  orders: number;
  items: number;
  target?: number;
  forecast?: number;
  previousYearRevenue?: number;
}

export interface ProductData {
  id: string;
  name: string;
  revenue: number;
  units: number;
  category: string;
  margin: number;
  marginPercent: number;
  trend: 'up' | 'down' | 'stable';
  averagePrice: number;
}

export interface CustomerSegment {
  name: string;
  count: number;
  value: number;
  clv: number;
  retention: number;
  color?: string;
}

export interface CategoryData {
  name: string;
  revenue: number;
  units: number;
  percentage: number;
  color: string;
}

export interface RevenueBreakdown {
  category: string;
  revenue: number;
  percentage: number;
  color: string;
}

export type DateRangePreset =
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'ytd'
  | 'last12months'
  | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
  preset: DateRangePreset;
}

export interface AnalyticsFilters {
  categories?: string[];
  paymentMethods?: string[];
  channels?: string[];
  customerSegments?: string[];
}

/**
 * Custom hook for analytics dashboard
 */
export function useAnalyticsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
    preset: 'last30days',
  });

  const [compareEnabled, setCompareEnabled] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AnalyticsFilters>({});

  // Raw data state
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Previous period data for comparison
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);
  const [previousOrderItems, setPreviousOrderItems] = useState<any[]>([]);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      // Calculate date ranges
      const { from, to } = dateRange;
      const daysDiff = differenceInDays(to, from);
      const previousFrom = subDays(from, daysDiff + 1);
      const previousTo = subDays(to, daysDiff + 1);

      // Fetch current period orders with items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          customers (*)
        `)
        .gte('created_at', startOfDay(from).toISOString())
        .lte('created_at', endOfDay(to).toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // Fetch previous period if comparison is enabled
      let previousOrdersData = [];
      if (compareEnabled) {
        const { data, error: prevError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .gte('created_at', startOfDay(previousFrom).toISOString())
          .lte('created_at', endOfDay(previousTo).toISOString())
          .order('created_at', { ascending: true });

        if (prevError) throw prevError;
        previousOrdersData = data || [];
      }

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      // Process data
      const allOrders = ordersData || [];
      const allOrderItems = allOrders.flatMap((o: any) => o.order_items || []);
      const allCustomers = customersData || [];

      const prevOrders = previousOrdersData || [];
      const prevOrderItems = prevOrders.flatMap((o: any) => o.order_items || []);

      setOrders(allOrders);
      setOrderItems(allOrderItems);
      setProducts(productsData || []);
      setCustomers(allCustomers);
      setPreviousOrders(prevOrders);
      setPreviousOrderItems(prevOrderItems);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, compareEnabled]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate key metrics
  const metrics = useMemo<PerformanceMetric[]>(() => {
    // Current period stats
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const totalOrders = orders.length;
    const totalItems = orderItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const uniqueCustomers = new Set(orders.map((o) => o.customer_id)).size;

    // Count repeat customers
    const customerOrderCount = new Map<string, number>();
    orders.forEach((o) => {
      if (o.customer_id) {
        customerOrderCount.set(
          o.customer_id,
          (customerOrderCount.get(o.customer_id) || 0) + 1
        );
      }
    });
    const repeatCustomers = Array.from(customerOrderCount.values()).filter((count) => count > 1).length;
    const repeatCustomerRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

    // Previous period stats
    const prevTotalRevenue = previousOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const prevTotalOrders = previousOrders.length;
    const prevTotalItems = previousOrderItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const prevAvgOrderValue = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;
    const prevUniqueCustomers = new Set(previousOrders.map((o) => o.customer_id)).size;

    const prevCustomerOrderCount = new Map<string, number>();
    previousOrders.forEach((o) => {
      if (o.customer_id) {
        prevCustomerOrderCount.set(
          o.customer_id,
          (prevCustomerOrderCount.get(o.customer_id) || 0) + 1
        );
      }
    });
    const prevRepeatCustomers = Array.from(prevCustomerOrderCount.values()).filter((count) => count > 1).length;
    const prevRepeatCustomerRate = prevUniqueCustomers > 0 ? (prevRepeatCustomers / prevUniqueCustomers) * 100 : 0;

    // Generate sparkline data (last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(dateRange.to, 6),
      end: dateRange.to,
    });

    const revenueSparkline = last7Days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return orders
        .filter((o) => format(parseISO(o.created_at), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    });

    const ordersSparkline = last7Days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return orders.filter((o) => format(parseISO(o.created_at), 'yyyy-MM-dd') === dayStr).length;
    });

    const itemsSparkline = last7Days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayOrders = orders.filter(
        (o) => format(parseISO(o.created_at), 'yyyy-MM-dd') === dayStr
      );
      const dayOrderIds = new Set(dayOrders.map((o) => o.id));
      return orderItems
        .filter((i) => dayOrderIds.has(i.order_id))
        .reduce((sum, i) => sum + (i.quantity || 0), 0);
    });

    return [
      {
        label: 'Total Revenue',
        value: totalRevenue,
        unit: '',
        previousValue: prevTotalRevenue,
        percentChange:
          prevTotalRevenue > 0
            ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
            : totalRevenue > 0
            ? 100
            : 0,
        sparklineData: revenueSparkline,
        isPositive: true,
        format: 'currency' as const,
        precision: 0,
      },
      {
        label: 'Total Orders',
        value: totalOrders,
        unit: 'orders',
        previousValue: prevTotalOrders,
        percentChange:
          prevTotalOrders > 0
            ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100
            : totalOrders > 0
            ? 100
            : 0,
        sparklineData: ordersSparkline,
        isPositive: true,
        format: 'number' as const,
        precision: 0,
      },
      {
        label: 'Average Order Value',
        value: avgOrderValue,
        unit: '',
        previousValue: prevAvgOrderValue,
        percentChange:
          prevAvgOrderValue > 0
            ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100
            : avgOrderValue > 0
            ? 100
            : 0,
        sparklineData: revenueSparkline.map((r, i) =>
          ordersSparkline[i] > 0 ? r / ordersSparkline[i] : 0
        ),
        isPositive: true,
        format: 'currency' as const,
        precision: 0,
      },
      {
        label: 'Total Items Sold',
        value: totalItems,
        unit: 'items',
        previousValue: prevTotalItems,
        percentChange:
          prevTotalItems > 0
            ? ((totalItems - prevTotalItems) / prevTotalItems) * 100
            : totalItems > 0
            ? 100
            : 0,
        sparklineData: itemsSparkline,
        isPositive: true,
        format: 'number' as const,
        precision: 0,
      },
      {
        label: 'Unique Customers',
        value: uniqueCustomers,
        unit: 'customers',
        previousValue: prevUniqueCustomers,
        percentChange:
          prevUniqueCustomers > 0
            ? ((uniqueCustomers - prevUniqueCustomers) / prevUniqueCustomers) * 100
            : uniqueCustomers > 0
            ? 100
            : 0,
        sparklineData: [],
        isPositive: true,
        format: 'number' as const,
        precision: 0,
      },
      {
        label: 'Repeat Customer Rate',
        value: repeatCustomerRate,
        unit: '',
        previousValue: prevRepeatCustomerRate,
        percentChange:
          prevRepeatCustomerRate > 0
            ? ((repeatCustomerRate - prevRepeatCustomerRate) / prevRepeatCustomerRate) * 100
            : repeatCustomerRate > 0
            ? 100
            : 0,
        sparklineData: [],
        isPositive: true,
        format: 'percentage' as const,
        precision: 1,
      },
    ];
  }, [orders, orderItems, previousOrders, previousOrderItems, dateRange]);

  // Sales data by day
  const salesData = useMemo<SalesDayData[]>(() => {
    const allDays = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    return allDays.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayOrders = orders.filter(
        (o) => format(parseISO(o.created_at), 'yyyy-MM-dd') === dayStr
      );
      const dayOrderIds = new Set(dayOrders.map((o) => o.id));
      const dayItems = orderItems.filter((i) => dayOrderIds.has(i.order_id));

      const revenue = dayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      const orderCount = dayOrders.length;
      const itemCount = dayItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

      // Get previous year data if comparing
      let previousYearRevenue = 0;
      if (compareEnabled) {
        const prevYearDay = subYears(day, 1);
        const prevYearDayStr = format(prevYearDay, 'yyyy-MM-dd');
        const prevYearOrders = previousOrders.filter(
          (o) => format(parseISO(o.created_at), 'yyyy-MM-dd') === prevYearDayStr
        );
        previousYearRevenue = prevYearOrders.reduce(
          (sum, o) => sum + (parseFloat(o.total) || 0),
          0
        );
      }

      return {
        date: dayStr,
        revenue,
        orders: orderCount,
        items: itemCount,
        previousYearRevenue: compareEnabled ? previousYearRevenue : undefined,
      };
    });
  }, [orders, orderItems, dateRange, compareEnabled, previousOrders]);

  // Product performance data
  const productData = useMemo<ProductData[]>(() => {
    const productMap = new Map<string, ProductData>();

    // Create map of products for quick lookup
    const productsById = new Map(products.map((p) => [p.id, p]));

    orderItems.forEach((item) => {
      const productId = item.product_id;
      const product = productsById.get(productId);

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: item.product_name || 'Unknown',
          revenue: 0,
          units: 0,
          category: product?.category || 'Uncategorized',
          margin: 0,
          marginPercent: 0,
          trend: 'stable' as const,
          averagePrice: 0,
        });
      }

      const data = productMap.get(productId)!;
      const itemRevenue = parseFloat(item.price) * item.quantity;
      const itemCost = product ? parseFloat(product.cost) * item.quantity : 0;

      data.revenue += itemRevenue;
      data.units += item.quantity;
      data.margin += itemRevenue - itemCost;
    });

    // Calculate margins and trends
    productMap.forEach((data) => {
      data.marginPercent = data.revenue > 0 ? (data.margin / data.revenue) * 100 : 0;
      data.averagePrice = data.units > 0 ? data.revenue / data.units : 0;

      // Simple trend calculation based on margin
      if (data.marginPercent > 30) {
        data.trend = 'up';
      } else if (data.marginPercent < 15) {
        data.trend = 'down';
      } else {
        data.trend = 'stable';
      }
    });

    // Sort by revenue
    return Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [orderItems, products]);

  // Category breakdown
  const categoryData = useMemo<CategoryData[]>(() => {
    const categoryMap = new Map<string, { revenue: number; units: number }>();

    productData.forEach((product) => {
      if (!categoryMap.has(product.category)) {
        categoryMap.set(product.category, { revenue: 0, units: 0 });
      }
      const cat = categoryMap.get(product.category)!;
      cat.revenue += product.revenue;
      cat.units += product.units;
    });

    const totalRevenue = Array.from(categoryMap.values()).reduce(
      (sum, c) => sum + c.revenue,
      0
    );

    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // orange
      '#ef4444', // red
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange-500
    ];

    return Array.from(categoryMap.entries())
      .map(([name, data], index) => ({
        name,
        revenue: data.revenue,
        units: data.units,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [productData]);

  // Customer segments
  const customerSegments = useMemo<CustomerSegment[]>(() => {
    const segments: CustomerSegment[] = [];

    // Calculate CLV for each customer
    const customerStats = new Map<string, { orders: number; revenue: number }>();

    orders.forEach((order) => {
      if (!order.customer_id) return;

      if (!customerStats.has(order.customer_id)) {
        customerStats.set(order.customer_id, { orders: 0, revenue: 0 });
      }

      const stats = customerStats.get(order.customer_id)!;
      stats.orders += 1;
      stats.revenue += parseFloat(order.total) || 0;
    });

    // Segment customers
    let highValue = 0;
    let mediumValue = 0;
    let lowValue = 0;
    let highValueRevenue = 0;
    let mediumValueRevenue = 0;
    let lowValueRevenue = 0;

    customerStats.forEach((stats) => {
      if (stats.revenue > 10000) {
        highValue++;
        highValueRevenue += stats.revenue;
      } else if (stats.revenue > 3000) {
        mediumValue++;
        mediumValueRevenue += stats.revenue;
      } else {
        lowValue++;
        lowValueRevenue += stats.revenue;
      }
    });

    if (highValue > 0) {
      segments.push({
        name: 'High Value',
        count: highValue,
        value: highValueRevenue,
        clv: highValueRevenue / highValue,
        retention: 85,
        color: '#10b981',
      });
    }

    if (mediumValue > 0) {
      segments.push({
        name: 'Medium Value',
        count: mediumValue,
        value: mediumValueRevenue,
        clv: mediumValueRevenue / mediumValue,
        retention: 65,
        color: '#3b82f6',
      });
    }

    if (lowValue > 0) {
      segments.push({
        name: 'Low Value',
        count: lowValue,
        value: lowValueRevenue,
        clv: lowValueRevenue / lowValue,
        retention: 45,
        color: '#6b7280',
      });
    }

    return segments;
  }, [orders]);

  // Update date range
  const updateDateRange = useCallback((from: Date, to: Date, preset: DateRangePreset = 'custom') => {
    setDateRange({ from, to, preset });
  }, []);

  // Set preset date range
  const setPresetDateRange = useCallback((preset: DateRangePreset) => {
    const to = new Date();
    let from: Date;

    switch (preset) {
      case 'last7days':
        from = subDays(to, 7);
        break;
      case 'last30days':
        from = subDays(to, 30);
        break;
      case 'last90days':
        from = subDays(to, 90);
        break;
      case 'ytd':
        from = startOfYear(to);
        break;
      case 'last12months':
        from = subMonths(to, 12);
        break;
      default:
        return;
    }

    setDateRange({ from, to, preset });
  }, []);

  // Export chart as image (simplified - would need canvas conversion)
  const exportChart = useCallback((chartName: string, format: 'png' | 'svg') => {
    console.log(`Exporting ${chartName} as ${format}`);
    // Implementation would require canvas conversion
    alert(`Export ${chartName} as ${format} - Feature coming soon`);
  }, []);

  // Export data as CSV
  const exportData = useCallback((format: 'csv' | 'json') => {
    if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Revenue', 'Orders', 'Items'];
      const rows = salesData.map((d) => [d.date, d.revenue, d.orders, d.items]);

      const csv = [
        headers.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } else {
      // Generate JSON
      const data = {
        dateRange,
        metrics,
        salesData,
        productData,
        categoryData,
        customerSegments,
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
    }
  }, [salesData, metrics, productData, categoryData, customerSegments, dateRange]);

  // Generate PDF report
  const generatePDFReport = useCallback(() => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Analytics Report', 20, 20);

    // Date range
    doc.setFontSize(12);
    doc.text(
      `Period: ${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`,
      20,
      30
    );

    // Metrics
    doc.setFontSize(14);
    doc.text('Key Metrics', 20, 45);
    doc.setFontSize(10);
    let y = 55;
    metrics.forEach((metric) => {
      doc.text(`${metric.label}: ${metric.value.toLocaleString()}`, 20, y);
      y += 7;
    });

    // Save
    doc.save(`analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }, [dateRange, metrics]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Data
    metrics,
    salesData,
    productData,
    categoryData,
    customerSegments,

    // State
    dateRange,
    compareEnabled,
    filters,
    isLoading,
    error,

    // Actions
    updateDateRange,
    setPresetDateRange,
    setCompareEnabled,
    setFilters,
    exportChart,
    exportData,
    generatePDFReport,
    refresh,
  };
}
