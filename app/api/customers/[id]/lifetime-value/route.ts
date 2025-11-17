import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Get customer's order history
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        clv: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          firstOrderDate: null,
          lastOrderDate: null,
          daysSinceFirstOrder: 0,
          orderFrequency: 0,
          predictedLifetimeValue: 0,
        },
        orders: [],
      });
    }

    // Calculate metrics
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const firstOrderDate = new Date(orders[0].created_at);
    const lastOrderDate = new Date(orders[orders.length - 1].created_at);
    const daysSinceFirstOrder = Math.max(
      1,
      Math.floor((Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Order frequency: orders per month
    const monthsSinceFirstOrder = daysSinceFirstOrder / 30;
    const orderFrequency = monthsSinceFirstOrder > 0 ? totalOrders / monthsSinceFirstOrder : 0;

    // Simple CLV prediction: AOV × Purchase Frequency × Customer Lifespan (estimated 2 years)
    const predictedLifetimeValue = averageOrderValue * orderFrequency * 24; // 24 months

    // Build order timeline with cumulative revenue
    let cumulativeRevenue = 0;
    const orderTimeline = orders.map((order) => {
      if (order.status === 'completed') {
        cumulativeRevenue += order.total;
      }
      return {
        id: order.id,
        date: order.created_at,
        total: order.total,
        status: order.status,
        cumulativeRevenue,
      };
    });

    return NextResponse.json({
      clv: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        firstOrderDate: firstOrderDate.toISOString(),
        lastOrderDate: lastOrderDate.toISOString(),
        daysSinceFirstOrder,
        orderFrequency, // orders per month
        predictedLifetimeValue,
      },
      orders: orderTimeline,
    });
  } catch (error) {
    console.error('Unexpected error in CLV calculation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
