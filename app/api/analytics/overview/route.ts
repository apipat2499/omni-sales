import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date ranges
    const now = new Date();
    const currentPeriodStart = new Date();
    const previousPeriodStart = new Date();
    const previousPeriodEnd = new Date();

    switch (range) {
      case '7d':
        currentPeriodStart.setDate(now.getDate() - 7);
        previousPeriodStart.setDate(now.getDate() - 14);
        previousPeriodEnd.setDate(now.getDate() - 7);
        break;
      case '90d':
        currentPeriodStart.setDate(now.getDate() - 90);
        previousPeriodStart.setDate(now.getDate() - 180);
        previousPeriodEnd.setDate(now.getDate() - 90);
        break;
      case '1y':
        currentPeriodStart.setDate(now.getDate() - 365);
        previousPeriodStart.setDate(now.getDate() - 730);
        previousPeriodEnd.setDate(now.getDate() - 365);
        break;
      default: // 30d
        currentPeriodStart.setDate(now.getDate() - 30);
        previousPeriodStart.setDate(now.getDate() - 60);
        previousPeriodEnd.setDate(now.getDate() - 30);
    }

    // Query orders for current period
    const { data: currentOrders, error: currentOrdersError } = await supabase
      .from('orders')
      .select('total, status, created_at')
      .gte('created_at', currentPeriodStart.toISOString());

    if (currentOrdersError) {
      console.error('Current orders error:', currentOrdersError);
    }

    // Query orders for previous period
    const { data: previousOrders, error: previousOrdersError } = await supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', previousPeriodEnd.toISOString());

    if (previousOrdersError) {
      console.error('Previous orders error:', previousOrdersError);
    }

    // Query all customers
    const { count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Query previous period customers for comparison
    const { count: previousCustomersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', previousPeriodEnd.toISOString());

    // Query all products
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Query previous period products for comparison
    const { count: previousProductsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', previousPeriodEnd.toISOString());

    // Calculate metrics
    const totalOrders = currentOrders?.length || 0;
    const previousTotalOrders = previousOrders?.length || 0;
    const ordersChange = previousTotalOrders > 0
      ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100
      : 0;

    const totalRevenue = currentOrders?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
    const previousRevenue = previousOrders?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
    const revenueChange = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const newOrders = currentOrders?.filter(o => o.status === 'new' || o.status === 'pending').length || 0;
    const deliveredOrders = currentOrders?.filter(o => o.status === 'delivered').length || 0;

    const totalCustomers = customersCount || 0;
    const customersChange = (previousCustomersCount || 0) > 0
      ? ((totalCustomers - (previousCustomersCount || 0)) / (previousCustomersCount || 0)) * 100
      : 0;

    const totalProducts = productsCount || 0;
    const productsChange = (previousProductsCount || 0) > 0
      ? ((totalProducts - (previousProductsCount || 0)) / (previousProductsCount || 0)) * 100
      : 0;

    // Return real data
    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        change: Math.abs(revenueChange),
        trend: revenueChange >= 0 ? 'up' : 'down'
      },
      orders: {
        total: totalOrders,
        change: Math.abs(ordersChange),
        trend: ordersChange >= 0 ? 'up' : 'down'
      },
      newOrders: newOrders,
      delivered: deliveredOrders,
      customers: {
        total: totalCustomers,
        change: Math.abs(customersChange),
        trend: customersChange >= 0 ? 'up' : 'down'
      },
      products: {
        total: totalProducts,
        change: Math.abs(productsChange),
        trend: productsChange >= 0 ? 'up' : 'down'
      },
      aiConversations: {
        total: 0,
        change: 0,
        trend: 'up',
        satisfaction: 0
      },
      conversionRate: {
        rate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0,
        change: 0,
        trend: 'up'
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
