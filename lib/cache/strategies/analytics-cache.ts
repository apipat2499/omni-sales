import { getCacheManager, generateCacheKey, CACHE_NAMESPACES, TTL_CONFIG, type CacheTag } from '../cache-manager';
import { getSupabaseClient } from '@/lib/supabase/client';

const cache = getCacheManager();
const ANALYTICS_TTL = TTL_CONFIG.LONG; // 1 hour

export interface DashboardAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  topProducts: Array<{ productId: string; productName: string; revenue: number; quantity: number }>;
  topCustomers: Array<{ customerId: string; customerName: string; totalSpent: number; orderCount: number }>;
  revenueByDate: Array<{ date: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number; revenue: number }>;
}

/**
 * Get dashboard analytics with caching
 */
export async function getCachedDashboardAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<DashboardAnalytics> {
  const dateRange = startDate && endDate
    ? `${startDate.toISOString()}-${endDate.toISOString()}`
    : 'all';
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.ANALYTICS, 'dashboard', dateRange);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) {
        return {
          totalRevenue: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalProducts: 0,
          averageOrderValue: 0,
          revenueGrowth: 0,
          ordersGrowth: 0,
          customersGrowth: 0,
          topProducts: [],
          topCustomers: [],
          revenueByDate: [],
          ordersByStatus: [],
        };
      }

      // Build query with date filter
      let ordersQuery = client.from('orders').select('*');
      if (startDate) {
        ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        ordersQuery = ordersQuery.lte('created_at', endDate.toISOString());
      }

      const { data: orders } = await ordersQuery;

      // Calculate totals
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get total customers and products
      const [customersCount, productsCount] = await Promise.all([
        client.from('customers').select('id', { count: 'exact', head: true }),
        client.from('products').select('id', { count: 'exact', head: true }),
      ]);

      // Calculate growth (compare with previous period)
      const previousStartDate = startDate
        ? new Date(startDate.getTime() - (endDate!.getTime() - startDate.getTime()))
        : undefined;
      const previousEndDate = startDate;

      let revenueGrowth = 0;
      let ordersGrowth = 0;
      let customersGrowth = 0;

      if (previousStartDate && previousEndDate) {
        const { data: previousOrders } = await client
          .from('orders')
          .select('total')
          .gte('created_at', previousStartDate.toISOString())
          .lte('created_at', previousEndDate.toISOString());

        const previousRevenue = previousOrders?.reduce((sum, order) => sum + order.total, 0) || 0;
        const previousOrderCount = previousOrders?.length || 0;

        revenueGrowth = previousRevenue > 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : 0;
        ordersGrowth = previousOrderCount > 0
          ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100
          : 0;

        // Calculate customer growth
        const { count: previousCustomerCount } = await client
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .lte('created_at', previousEndDate.toISOString());

        customersGrowth = previousCustomerCount && customersCount.count
          ? ((customersCount.count - previousCustomerCount) / previousCustomerCount) * 100
          : 0;
      }

      // Get top products
      const orderIds = orders?.map(o => o.id) || [];
      let topProducts: Array<{ productId: string; productName: string; revenue: number; quantity: number }> = [];

      if (orderIds.length > 0) {
        const { data: orderItems } = await client
          .from('order_items')
          .select('product_id, product_name, total_price, quantity')
          .in('order_id', orderIds);

        const productStats = new Map<string, { name: string; revenue: number; quantity: number }>();

        for (const item of orderItems || []) {
          const existing = productStats.get(item.product_id) || {
            name: item.product_name,
            revenue: 0,
            quantity: 0,
          };

          productStats.set(item.product_id, {
            name: item.product_name,
            revenue: existing.revenue + item.total_price,
            quantity: existing.quantity + item.quantity,
          });
        }

        topProducts = Array.from(productStats.entries())
          .map(([productId, stats]) => ({
            productId,
            productName: stats.name,
            revenue: stats.revenue,
            quantity: stats.quantity,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
      }

      // Get top customers
      const { data: topCustomersData } = await client
        .from('customers')
        .select('id, name, total_spent, total_orders')
        .order('total_spent', { ascending: false })
        .limit(10);

      const topCustomers = (topCustomersData || []).map(c => ({
        customerId: c.id,
        customerName: c.name,
        totalSpent: c.total_spent,
        orderCount: c.total_orders,
      }));

      // Get revenue by date
      const revenueByDate: Array<{ date: string; revenue: number; orders: number }> = [];
      if (orders && orders.length > 0) {
        const dailyStats = new Map<string, { revenue: number; orders: number }>();

        for (const order of orders) {
          const date = new Date(order.created_at).toISOString().split('T')[0];
          const existing = dailyStats.get(date) || { revenue: 0, orders: 0 };

          dailyStats.set(date, {
            revenue: existing.revenue + order.total,
            orders: existing.orders + 1,
          });
        }

        for (const [date, stats] of dailyStats.entries()) {
          revenueByDate.push({ date, ...stats });
        }

        revenueByDate.sort((a, b) => a.date.localeCompare(b.date));
      }

      // Get orders by status
      const ordersByStatus: Array<{ status: string; count: number; revenue: number }> = [];
      if (orders && orders.length > 0) {
        const statusStats = new Map<string, { count: number; revenue: number }>();

        for (const order of orders) {
          const existing = statusStats.get(order.status) || { count: 0, revenue: 0 };

          statusStats.set(order.status, {
            count: existing.count + 1,
            revenue: existing.revenue + order.total,
          });
        }

        for (const [status, stats] of statusStats.entries()) {
          ordersByStatus.push({ status, ...stats });
        }
      }

      return {
        totalRevenue,
        totalOrders,
        totalCustomers: customersCount.count || 0,
        totalProducts: productsCount.count || 0,
        averageOrderValue,
        revenueGrowth,
        ordersGrowth,
        customersGrowth,
        topProducts,
        topCustomers,
        revenueByDate,
        ordersByStatus,
      };
    },
    ANALYTICS_TTL,
    [{ namespace: CACHE_NAMESPACES.ANALYTICS, resource: 'dashboard' }]
  );
}

/**
 * Get sales analytics with caching
 */
export async function getCachedSalesAnalytics(period: 'day' | 'week' | 'month' | 'year'): Promise<{
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  growth: number;
}> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.ANALYTICS, 'sales', period);

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) {
        return { totalSales: 0, totalOrders: 0, averageOrderValue: 0, growth: 0 };
      }

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      const { data: orders } = await client
        .from('orders')
        .select('total')
        .gte('created_at', startDate.toISOString());

      const totalSales = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalSales,
        totalOrders,
        averageOrderValue,
        growth: 0, // TODO: Calculate growth
      };
    },
    ANALYTICS_TTL,
    [{ namespace: CACHE_NAMESPACES.ANALYTICS, resource: 'sales' }]
  );
}

/**
 * Get product performance analytics with caching
 */
export async function getCachedProductPerformance(limit = 20): Promise<Array<{
  productId: string;
  productName: string;
  totalSales: number;
  totalQuantity: number;
  totalRevenue: number;
}>> {
  const cacheKey = generateCacheKey(CACHE_NAMESPACES.ANALYTICS, 'product-performance', String(limit));

  return await cache.getOrSet(
    cacheKey,
    async () => {
      const client = getSupabaseClient();
      if (!client) return [];

      const { data: orderItems } = await client
        .from('order_items')
        .select('product_id, product_name, quantity, total_price');

      if (!orderItems) return [];

      const productStats = new Map<string, {
        name: string;
        sales: number;
        quantity: number;
        revenue: number;
      }>();

      for (const item of orderItems) {
        const existing = productStats.get(item.product_id) || {
          name: item.product_name,
          sales: 0,
          quantity: 0,
          revenue: 0,
        };

        productStats.set(item.product_id, {
          name: item.product_name,
          sales: existing.sales + 1,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.total_price,
        });
      }

      return Array.from(productStats.entries())
        .map(([productId, stats]) => ({
          productId,
          productName: stats.name,
          totalSales: stats.sales,
          totalQuantity: stats.quantity,
          totalRevenue: stats.revenue,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);
    },
    ANALYTICS_TTL,
    [{ namespace: CACHE_NAMESPACES.ANALYTICS, resource: 'products' }]
  );
}

/**
 * Invalidate analytics cache
 */
export async function invalidateAnalyticsCache(resource?: string): Promise<void> {
  if (resource) {
    await cache.invalidateByTag({
      namespace: CACHE_NAMESPACES.ANALYTICS,
      resource,
    });
  } else {
    // Invalidate all analytics
    await cache.invalidateNamespace(CACHE_NAMESPACES.ANALYTICS);
  }
}

/**
 * Warm analytics cache
 */
export async function warmAnalyticsCache(): Promise<void> {
  // Pre-load dashboard analytics
  await getCachedDashboardAnalytics();

  // Pre-load sales analytics for all periods
  await Promise.all([
    getCachedSalesAnalytics('day'),
    getCachedSalesAnalytics('week'),
    getCachedSalesAnalytics('month'),
    getCachedSalesAnalytics('year'),
  ]);

  // Pre-load product performance
  await getCachedProductPerformance();

  console.log('Analytics cache warmed successfully');
}
