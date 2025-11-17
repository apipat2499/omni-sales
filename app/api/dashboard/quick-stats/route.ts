import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get yesterday's date range for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's revenue and orders
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const todayRevenue = todayOrders
      ?.filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0) || 0;
    const todayOrderCount = todayOrders?.length || 0;

    // Yesterday's revenue and orders for comparison
    const { data: yesterdayOrders } = await supabase
      .from('orders')
      .select('total, status')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    const yesterdayRevenue = yesterdayOrders
      ?.filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0) || 0;
    const yesterdayOrderCount = yesterdayOrders?.length || 0;

    // Calculate percentage changes
    const revenueChange = yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : 0;
    const ordersChange = yesterdayOrderCount > 0
      ? Math.round(((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100)
      : 0;

    // Total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Customers created today
    const { count: todayCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Customers created yesterday
    const { count: yesterdayCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    const customersChange = (yesterdayCustomers || 0) > 0
      ? Math.round((((todayCustomers || 0) - (yesterdayCustomers || 0)) / (yesterdayCustomers || 1)) * 100)
      : 0;

    // Low stock products (stock <= 10)
    const { count: lowStockCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lte('stock', 10);

    return NextResponse.json({
      todayRevenue,
      todayOrders: todayOrderCount,
      totalCustomers: totalCustomers || 0,
      lowStockCount: lowStockCount || 0,
      revenueChange,
      ordersChange,
      customersChange,
    });
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
