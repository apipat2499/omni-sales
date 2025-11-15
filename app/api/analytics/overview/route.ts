import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const days = parseInt(period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch orders in date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    // Calculate metrics
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    const totalOrders = orders?.length || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate previous period for comparison
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const { data: prevOrders } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', prevEndDate.toISOString());

    const prevRevenue = prevOrders?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
    const prevOrderCount = prevOrders?.length || 0;

    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const orderGrowth = prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : 0;

    // Group by date for chart
    const revenueByDate: Record<string, number> = {};
    const ordersByDate: Record<string, number> = {};

    orders?.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + parseFloat(order.total);
      ordersByDate[date] = (ordersByDate[date] || 0) + 1;
    });

    // Convert to array format
    const chartData = Object.keys(revenueByDate)
      .sort()
      .map((date) => ({
        date,
        revenue: revenueByDate[date],
        orders: ordersByDate[date],
      }));

    // Get product count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get customer count
    const { count: customerCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Get low stock products
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('*')
      .lt('stock', 10)
      .gt('stock', 0)
      .order('stock', { ascending: true })
      .limit(5);

    return NextResponse.json({
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        productCount: productCount || 0,
        customerCount: customerCount || 0,
        revenueGrowth,
        orderGrowth,
      },
      chartData,
      lowStockProducts: lowStockProducts || [],
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}
