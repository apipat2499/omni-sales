import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get date ranges
    const now = new Date();
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    // Current period stats
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', currentPeriodStart.toISOString())
      .lte('created_at', now.toISOString());

    // Previous period stats
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', currentPeriodStart.toISOString());

    // Total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Customers in current period
    const { count: currentCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currentPeriodStart.toISOString());

    // Customers in previous period
    const { count: previousCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', currentPeriodStart.toISOString());

    // Calculate current period stats
    const currentRevenue = (currentOrders || []).reduce(
      (sum, order) => sum + parseFloat(order.total),
      0
    );
    const currentOrdersCount = (currentOrders || []).length;

    // Calculate previous period stats
    const previousRevenue = (previousOrders || []).reduce(
      (sum, order) => sum + parseFloat(order.total),
      0
    );
    const previousOrdersCount = (previousOrders || []).length;

    // Calculate growth percentages
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0 ? 100 : 0;

    const ordersGrowth = previousOrdersCount > 0
      ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
      : currentOrdersCount > 0 ? 100 : 0;

    const customersGrowth = (previousCustomers || 0) > 0
      ? (((currentCustomers || 0) - (previousCustomers || 0)) / (previousCustomers || 0)) * 100
      : (currentCustomers || 0) > 0 ? 100 : 0;

    const averageOrderValue = currentOrdersCount > 0
      ? currentRevenue / currentOrdersCount
      : 0;

    return NextResponse.json({
      totalRevenue: currentRevenue,
      totalOrders: currentOrdersCount,
      totalCustomers: totalCustomers || 0,
      averageOrderValue,
      revenueGrowth,
      ordersGrowth,
      customersGrowth,
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/dashboard/stats:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
