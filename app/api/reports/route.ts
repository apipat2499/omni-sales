import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { format, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const now = new Date();
    const startDate = subDays(now, days);

    // Fetch orders with items
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items (*)')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    // Fetch all products count
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Fetch all customers count
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Fetch top products
    const { data: topProductsData } = await supabase
      .from('product_performance')
      .select('*')
      .order('total_revenue', { ascending: false })
      .limit(5);

    // Fetch top customers
    const { data: topCustomersData } = await supabase
      .from('customer_lifetime_value')
      .select('*')
      .order('lifetime_value', { ascending: false })
      .limit(5);

    // Calculate stats from orders
    const totalRevenue = (orders || []).reduce(
      (sum, order) => sum + parseFloat(order.total || 0),
      0
    );
    const totalOrders = (orders || []).length;

    // Transform orders for export
    const transformedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      customerId: order.customer_id,
      customerName: order.customer_name || 'Unknown',
      subtotal: parseFloat(order.subtotal || 0),
      tax: parseFloat(order.tax || 0),
      shipping: parseFloat(order.shipping || 0),
      total: parseFloat(order.total || 0),
      status: order.status || 'pending',
      channel: order.channel || 'online',
      createdAt: new Date(order.created_at),
      items: (order.order_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name || 'Unknown',
        quantity: item.quantity,
        price: parseFloat(item.price || 0),
      })),
    }));

    // Transform top products
    const topProducts = (topProductsData || []).map((product: any) => ({
      name: product.name,
      quantity: product.total_quantity_sold || 0,
      revenue: product.total_revenue || 0,
    }));

    // Transform top customers
    const topCustomers = (topCustomersData || []).map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      totalOrders: customer.total_orders || 0,
      totalSpent: customer.lifetime_value || 0,
    }));

    // Generate chart data by date
    const dataByDate: Record<string, { revenue: number; orders: number }> = {};

    // Initialize all dates with zero values
    for (let i = 0; i < days; i++) {
      const date = format(subDays(now, days - i - 1), 'yyyy-MM-dd');
      dataByDate[date] = { revenue: 0, orders: 0 };
    }

    // Aggregate actual data
    (orders || []).forEach((order) => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (dataByDate[date]) {
        dataByDate[date].revenue += parseFloat(order.total);
        dataByDate[date].orders += 1;
      }
    });

    // Convert to array format
    const chartData = Object.entries(dataByDate).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalProducts: totalProducts || 0,
        totalCustomers: totalCustomers || 0,
      },
      orders: transformedOrders,
      topProducts,
      topCustomers,
      chartData,
    });
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return NextResponse.json({ error: 'Failed to fetch reports data' }, { status: 500 });
  }
}
