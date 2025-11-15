import { supabase } from '@/lib/supabase/client';
import { DailyMetrics, ProductPerformance, CustomerAnalytics } from '@/types';

/**
 * Calculate and aggregate daily metrics from orders
 */
export async function calculateDailyMetrics(
  userId: string,
  date: string
): Promise<DailyMetrics> {
  try {
    // Get all orders for the day
    const { data: orders } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          quantity,
          price
        )
      `
      )
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`)
      .order('created_at', { ascending: false });

    if (!orders || orders.length === 0) {
      return {
        id: '',
        userId,
        date: new Date(date),
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageOrderValue: 0,
        uniqueCustomers: 0,
        returnedOrders: 0,
        cancelledOrders: 0,
        completedOrders: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalProfit = calculateTotalProfit(orders);
    const uniqueCustomers = new Set(orders.map((o) => o.customer_id)).size;
    const returnedOrders = orders.filter((o) => o.status === 'cancelled').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
    const completedOrders = orders.filter((o) => o.status === 'delivered').length;

    return {
      id: '',
      userId,
      date: new Date(date),
      totalOrders,
      totalRevenue,
      totalProfit,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      uniqueCustomers,
      returnedOrders,
      cancelledOrders,
      completedOrders,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error calculating daily metrics:', error);
    throw error;
  }
}

/**
 * Calculate product performance metrics
 */
export async function calculateProductPerformance(
  userId: string,
  productId: string,
  date: string
): Promise<ProductPerformance> {
  try {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(
        `
        quantity,
        price,
        orders (
          total,
          status,
          created_at
        )
      `
      )
      .eq('product_id', productId)
      .gte('orders.created_at', `${date}T00:00:00`)
      .lt('orders.created_at', `${date}T23:59:59`);

    const unitsSold = orderItems?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
    const revenue = orderItems?.reduce(
      (sum, i) => sum + Number(i.price || 0) * (i.quantity || 0),
      0
    ) || 0;

    // Estimate profit (simplified - would need cost data)
    const profit = revenue * 0.3; // 30% assumed margin

    return {
      id: '',
      userId,
      productId,
      date: new Date(date),
      unitsSold,
      revenue,
      profit,
      returns: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error calculating product performance:', error);
    throw error;
  }
}

/**
 * Calculate customer analytics and RFM score
 */
export async function calculateCustomerAnalytics(
  userId: string,
  customerId: string
): Promise<CustomerAnalytics> {
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (!orders || orders.length === 0) {
      return {
        id: '',
        userId,
        customerId,
        lifetimeValue: 0,
        orderCount: 0,
        averageOrderValue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const orderCount = orders.length;
    const lifetimeValue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const averageOrderValue = lifetimeValue / orderCount;

    const firstPurchaseDate = new Date(
      orders[orders.length - 1].created_at
    );
    const lastPurchaseDate = new Date(orders[0].created_at);
    const daysSincePurchase = Math.floor(
      (Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const purchaseFrequency = orderCount /
      Math.max(
        Math.floor(
          (Date.now() - firstPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
        1
      );

    // Calculate RFM Score
    const recency = Math.max(0, 5 - Math.floor(daysSincePurchase / 10));
    const frequency = Math.min(5, Math.floor(purchaseFrequency * 10));
    const monetary = Math.min(
      5,
      Math.floor(lifetimeValue / 1000)
    );
    const rfmScore = `${recency}${frequency}${monetary}`;

    // Determine segment
    let segment = 'new';
    if (orderCount >= 5) segment = 'loyal';
    if (lifetimeValue > 5000) segment = 'vip';
    if (daysSincePurchase > 90) segment = 'atrisk';

    // Calculate churn risk
    const churnRisk =
      daysSincePurchase > 60 ? Math.min(1, daysSincePurchase / 180) : 0;

    return {
      id: '',
      userId,
      customerId,
      lifetimeValue,
      orderCount,
      averageOrderValue,
      firstPurchaseDate,
      lastPurchaseDate,
      daysSincePurchase,
      purchaseFrequency,
      segment,
      churnRisk,
      rfmScore,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error calculating customer analytics:', error);
    throw error;
  }
}

/**
 * Detect anomalies in metrics
 */
export function detectAnomalies(
  currentValue: number,
  historicalAverage: number,
  standardDeviation: number
): boolean {
  // Anomaly if value is more than 2 standard deviations from mean
  const zScore = Math.abs((currentValue - historicalAverage) / standardDeviation);
  return zScore > 2;
}

/**
 * Helper: Calculate total profit from orders
 */
function calculateTotalProfit(orders: any[]): number {
  return orders.reduce((sum, order) => {
    const revenue = Number(order.total || 0);
    const estimatedCost = revenue * 0.6; // 60% assumed cost
    return sum + (revenue - estimatedCost);
  }, 0);
}

/**
 * Generate sales forecast using simple moving average
 */
export function generateSimpleForcast(
  historicalData: number[],
  forecastDays: number = 7
): number[] {
  if (historicalData.length === 0) return [];

  const movingAverageWindow = Math.min(7, historicalData.length);
  const forecast: number[] = [];

  for (let i = 0; i < forecastDays; i++) {
    const recentData = historicalData.slice(-movingAverageWindow);
    const average = recentData.reduce((a, b) => a + b) / recentData.length;
    forecast.push(average);
  }

  return forecast;
}
