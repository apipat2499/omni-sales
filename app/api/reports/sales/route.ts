import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from, to' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Fetch orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, customer_id, status, created_at')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .eq('status', 'completed');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      );
    }

    // Calculate summary
    const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
    const totalOrders = orders?.length || 0;
    const uniqueCustomers = new Set(orders?.map((o) => o.customer_id) || []).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group by day
    const dailyMap = new Map<string, { revenue: number; orders: number; customers: Set<number> }>();

    orders?.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { revenue: 0, orders: 0, customers: new Set() });
      }
      const day = dailyMap.get(date)!;
      day.revenue += order.total;
      day.orders += 1;
      day.customers.add(order.customer_id);
    });

    // Convert to array and sort
    const dailyData = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
        revenue: data.revenue,
        orders: data.orders,
        customers: data.customers.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        totalCustomers: uniqueCustomers,
        averageOrderValue,
      },
      dailyData,
    });
  } catch (error) {
    console.error('Unexpected error in sales report API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
