import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Order, OrderStatus } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderId } = await params;

    // Fetch order with customer information
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers!inner(name, email, phone, address)
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Failed to fetch order', details: orderError.message },
        { status: 500 }
      );
    }

    // Fetch order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, price')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch order items', details: itemsError.message },
        { status: 500 }
      );
    }

    const order: Order = {
      id: orderData.id,
      customerId: orderData.customer_id,
      customerName: orderData.customers.name,
      items: (itemsData || []).map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
      subtotal: parseFloat(orderData.subtotal),
      tax: parseFloat(orderData.tax),
      shipping: parseFloat(orderData.shipping),
      total: parseFloat(orderData.total),
      status: orderData.status,
      channel: orderData.channel,
      paymentMethod: orderData.payment_method,
      shippingAddress: orderData.shipping_address,
      notes: orderData.notes,
      createdAt: new Date(orderData.created_at),
      updatedAt: new Date(orderData.updated_at),
      deliveredAt: orderData.delivered_at ? new Date(orderData.delivered_at) : undefined,
    };

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders/[orderId]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const newStatus = body.status as OrderStatus;

    // Validate status value
    const validStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Fetch current order to validate status transition
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching current order:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch order', details: fetchError.message },
        { status: 500 }
      );
    }

    const currentStatus = currentOrder.status as OrderStatus;

    // Validate status transition (prevent going backwards)
    const statusOrder: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);

    // Allow transition to cancelled from any status except delivered
    if (newStatus === 'cancelled' && currentStatus === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot cancel a delivered order' },
        { status: 400 }
      );
    }

    // Prevent going backwards in the normal flow (unless cancelling)
    if (newStatus !== 'cancelled' && currentStatus !== 'cancelled' && newIndex < currentIndex) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${newStatus}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
    };

    // Set delivered_at timestamp when status is delivered
    if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return NextResponse.json(
        { error: 'Failed to update order status', details: error.message },
        { status: 500 }
      );
    }

    // Send email notification for status changes
    if (newStatus === 'shipped' || newStatus === 'delivered') {
      try {
        const { data: customer } = await supabase
          .from('customers')
          .select('name, email')
          .eq('id', data.customer_id)
          .single();

        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (customer && customer.email) {
          const orderWithDetails = {
            id: data.id,
            customerName: customer.name,
            items: (itemsData || []).map((item: any) => ({
              productName: item.product_name,
              quantity: item.quantity,
              price: parseFloat(item.price),
            })),
            subtotal: parseFloat(data.subtotal),
            tax: parseFloat(data.tax),
            shipping: parseFloat(data.shipping),
            total: parseFloat(data.total),
            discountCode: data.discount_code,
            discountAmount: data.discount_amount ? parseFloat(data.discount_amount) : undefined,
            status: newStatus,
            paymentMethod: data.payment_method,
            shippingAddress: data.shipping_address,
            notes: data.notes,
            createdAt: new Date(data.created_at),
          };

          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order_status_update',
              to: customer.email,
              order: orderWithDetails,
              oldStatus: currentStatus,
              newStatus: newStatus,
            }),
          });
        }
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Order status updated successfully',
        order: {
          id: data.id,
          status: data.status,
          deliveredAt: data.delivered_at ? new Date(data.delivered_at) : undefined,
          updatedAt: new Date(data.updated_at),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PUT /api/orders/[orderId]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
