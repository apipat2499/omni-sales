import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { z } from 'zod';

// Validation schema for status update
const UpdateStatusSchema = z.object({
  status: z.enum(['pending_payment', 'processing', 'shipped', 'delivered', 'cancelled']),
  paymentStatus: z.enum(['pending', 'confirmed', 'failed']).optional(),
});

/**
 * PUT /api/admin/orders/[orderId]/status
 * Update order status (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 503 }
    );
  }

  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = UpdateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      );
    }

    const { status, paymentStatus } = validation.data;

    // First, verify the order exists
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, payment_status, order_number')
      .eq('order_number', orderId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching order:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch order' },
        { status: 500 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Update payment status if provided
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    // Auto-update payment status based on order status
    if (status === 'processing' && !paymentStatus) {
      updateData.payment_status = 'confirmed';
    } else if (status === 'cancelled' && !paymentStatus) {
      updateData.payment_status = 'failed';
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_number', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // If order is cancelled, restore inventory
    if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
      // Get order items to restore stock
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', existingOrder.id);

      if (orderItems) {
        for (const item of orderItems) {
          await supabase.rpc('restore_product_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }
    }

    // Record status change in history (if order_status_history table exists)
    try {
      await supabase
        .from('order_status_history')
        .insert({
          order_id: existingOrder.id,
          old_status: existingOrder.status,
          new_status: status,
          changed_at: new Date().toISOString(),
          notes: paymentStatus ? `Payment status: ${paymentStatus}` : undefined,
        });
    } catch (historyError) {
      // Log but don't fail the request if history insert fails
      console.warn('Failed to record status history:', historyError);
    }

    return NextResponse.json(
      {
        orderId: updatedOrder.order_number,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.payment_status,
        updatedAt: updatedOrder.updated_at,
        message: 'Order status updated successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/orders/[orderId]/status:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/orders/[orderId]/status
 * Get current order status (for convenience)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 503 }
    );
  }

  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('order_number, status, payment_status, updated_at')
      .eq('order_number', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching order status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order status' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        orderId: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        updatedAt: order.updated_at,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/orders/[orderId]/status:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
