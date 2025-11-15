import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Fetch order with customer and items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers!inner(name, email, phone, address)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      );
    }

    // Generate invoice data
    const invoiceData = {
      orderId: order.id,
      orderDate: format(new Date(order.created_at), 'dd MMMM yyyy', { locale: th }),
      customer: {
        name: order.customers.name,
        email: order.customers.email,
        phone: order.customers.phone,
        address: order.customers.address,
      },
      items: (items || []).map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: item.quantity * parseFloat(item.price),
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
    };

    return NextResponse.json(invoiceData, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders/[id]/invoice:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
