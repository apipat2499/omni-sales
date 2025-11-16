import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');

    // First, fetch orders with customer information
    let ordersQuery = supabase
      .from('orders')
      .select(`
        *,
        customers!inner(name)
      `);

    // Apply search filter (order ID or customer name)
    if (search) {
      // We need to use OR condition for searching by order ID or customer name
      ordersQuery = ordersQuery.or(
        `id.ilike.%${search}%,customers.name.ilike.%${search}%`
      );
    }

    // Apply status filter
    if (status && status !== 'all') {
      ordersQuery = ordersQuery.eq('status', status);
    }

    // Apply channel filter
    if (channel && channel !== 'all') {
      ordersQuery = ordersQuery.eq('channel', channel);
    }

    // Order by created date descending
    ordersQuery = ordersQuery.order('created_at', { ascending: false });

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: ordersError.message },
        { status: 500 }
      );
    }

    // For each order, fetch its order items
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('product_id, product_name, quantity, price')
          .eq('order_id', order.id);

        if (itemsError) {
          console.error(`Error fetching items for order ${order.id}:`, itemsError);
          return null;
        }

        return {
          id: order.id,
          customerId: order.customer_id,
          customerName: order.customers.name,
          items: (itemsData || []).map((item) => ({
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })),
          subtotal: parseFloat(order.subtotal),
          tax: parseFloat(order.tax),
          shipping: parseFloat(order.shipping),
          total: parseFloat(order.total),
          status: order.status,
          channel: order.channel,
          paymentMethod: order.payment_method,
          shippingAddress: order.shipping_address,
          notes: order.notes,
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at),
          deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
        };
      })
    );

    // Filter out any null values from failed fetches
    const orders = ordersWithItems.filter((order) => order !== null) as Order[];

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
