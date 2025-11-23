import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { withRateLimit, rateLimitPresets } from '@/lib/middleware/rateLimit';
import { apiRequireAuth } from '@/lib/middleware/authMiddleware';

async function handleGET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get('customerId');
    const status = req.nextUrl.searchParams.get('status');
    const channel = req.nextUrl.searchParams.get('channel');
    const search = req.nextUrl.searchParams.get('search');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    let query = supabase
      .from('orders')
      .select('*, order_items (*), order_shipping (*)', { count: 'exact' });

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (channel && channel !== 'all') {
      query = query.eq('channel', channel);
    }
    if (search) {
      // Search by order ID or customer name
      query = query.or(`id.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Transform orders to match the expected format
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
      paymentMethod: order.payment_method,
      shippingAddress: order.shipping_address,
      notes: order.notes,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name || 'Unknown',
        quantity: item.quantity,
        price: parseFloat(item.price || 0),
      })),
    }));

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST handler for creating orders - requires authentication
async function handlePOST(req: NextRequest) {
  const { user, error } = apiRequireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { items, total, subtotal, tax, shipping, customerName, customerEmail, paymentMethod, status = 'pending' } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    if (!customerName || !customerEmail) {
      return NextResponse.json({ error: 'Customer name and email required' }, { status: 400 });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        total,
        subtotal,
        tax,
        shipping,
        payment_method: paymentMethod,
        status,
        channel: 'online',
        created_by: user?.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Order was created but items failed - this is a partial failure
      }
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

// Apply rate limiting to route handlers
export const GET = withRateLimit(rateLimitPresets.read, handleGET);
export const POST = withRateLimit(rateLimitPresets.write, handlePOST);
