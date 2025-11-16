import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { withRateLimit, rateLimitPresets } from '@/lib/middleware/rateLimit';

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

// Apply rate limiting to route handler
export const GET = withRateLimit(rateLimitPresets.read, handleGET);
