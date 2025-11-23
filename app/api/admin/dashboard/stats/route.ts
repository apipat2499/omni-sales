import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics for admin
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, all

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }

    // Get all orders
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('id, total, status, payment_status, created_at')
      .order('created_at', { ascending: false });

    if (allOrdersError) {
      console.error('Error fetching orders:', allOrdersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // Get orders for the selected period
    const { data: periodOrders, error: periodOrdersError } = await supabase
      .from('orders')
      .select('id, total, status, payment_status, created_at, order_number, customer_name')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (periodOrdersError) {
      console.error('Error fetching period orders:', periodOrdersError);
      return NextResponse.json(
        { error: 'Failed to fetch period orders' },
        { status: 500 }
      );
    }

    // Get today's orders specifically
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayOrders, error: todayOrdersError } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', todayStart.toISOString());

    if (todayOrdersError) {
      console.error('Error fetching today orders:', todayOrdersError);
    }

    // Calculate total orders and revenue (all time)
    const totalOrders = allOrders?.length || 0;
    const totalRevenue = allOrders?.reduce(
      (sum, order) => sum + parseFloat(order.total || '0'),
      0
    ) || 0;

    // Calculate new orders (in selected period)
    const newOrders = periodOrders?.length || 0;

    // Calculate today's revenue
    const todayRevenue = todayOrders?.reduce(
      (sum, order) => sum + parseFloat(order.total || '0'),
      0
    ) || 0;

    // Get recent orders with details (limit to 10)
    const recentOrders = periodOrders?.slice(0, 10).map(order => ({
      orderId: order.order_number,
      customerName: order.customer_name,
      total: parseFloat(order.total || '0'),
      status: order.status,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
    })) || [];

    // Calculate order status breakdown
    const ordersByStatus = {
      pending_payment: allOrders?.filter(o => o.status === 'pending_payment').length || 0,
      processing: allOrders?.filter(o => o.status === 'processing').length || 0,
      shipped: allOrders?.filter(o => o.status === 'shipped').length || 0,
      delivered: allOrders?.filter(o => o.status === 'delivered').length || 0,
      cancelled: allOrders?.filter(o => o.status === 'cancelled').length || 0,
    };

    // Calculate payment status breakdown
    const paymentsByStatus = {
      pending: allOrders?.filter(o => o.payment_status === 'pending').length || 0,
      confirmed: allOrders?.filter(o => o.payment_status === 'confirmed').length || 0,
      failed: allOrders?.filter(o => o.payment_status === 'failed').length || 0,
    };

    // Get product stats
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('stock');

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    const totalProducts = products?.length || 0;
    const lowStockProducts = products?.filter(p => p.stock < 10).length || 0;
    const outOfStockProducts = products?.filter(p => p.stock === 0).length || 0;

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return NextResponse.json(
      {
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        newOrders,
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
        recentOrders,
        ordersByStatus,
        paymentsByStatus,
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        period,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/dashboard/stats:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
