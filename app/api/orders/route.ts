import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, items, channel, subtotal, tax, shipping, total, shipping_address, notes } = body;

    // Validate required fields
    if (!customer_id || !items || items.length === 0 || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_id, items, and channel are required' },
        { status: 400 }
      );
    }

    // Create the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id,
        status: 'pending',
        channel,
        subtotal,
        tax,
        shipping,
        total,
        shipping_address,
        notes,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      );
    }

    // Fetch product names for order items
    const productIds = items.map((item: any) => item.product_id);
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);

    const productMap = new Map(
      (productsData || []).map((p) => [p.id, p.name])
    );

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.product_id,
      product_name: productMap.get(item.product_id) || 'Unknown Product',
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback: delete the order if items creation failed
      await supabase.from('orders').delete().eq('id', orderData.id);
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemsError.message },
        { status: 500 }
      );
    }

    // Update product stock
    for (const item of items) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        product_id: item.product_id,
        quantity: item.quantity,
      });

      // If RPC doesn't exist, try direct update
      if (stockError?.code === '42883') {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.product_id);
        }
      }
    }

    return NextResponse.json(
      {
        message: 'Order created successfully',
        orderId: orderData.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

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
