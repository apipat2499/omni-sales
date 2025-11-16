import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { validateUpdateOrderItem } from '@/lib/validations/order-items';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const { orderId, itemId } = await params;
    const body = await req.json();

    if (!orderId || !itemId) {
      return NextResponse.json(
        { error: 'Missing orderId or itemId' },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateUpdateOrderItem(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const { quantity, price, discount, notes } = validation.data;

    // Verify item belongs to order
    const { data: item, error: verifyError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single();

    if (verifyError || !item) {
      return NextResponse.json(
        { error: 'Item not found in this order' },
        { status: 404 }
      );
    }

    // Update item
    const updateData: any = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = price;
    if (discount !== undefined) updateData.discount = discount;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update({
        ...updateData,
        updated_at: new Date(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }

    // Update order total
    await updateOrderTotal(orderId);

    return NextResponse.json({
      id: updatedItem.id,
      orderId: updatedItem.order_id,
      productId: updatedItem.product_id,
      productName: updatedItem.product_name,
      quantity: updatedItem.quantity,
      price: parseFloat(updatedItem.price || 0),
      discount: updatedItem.discount ? parseFloat(updatedItem.discount) : undefined,
      notes: updatedItem.notes,
      updatedAt: new Date(updatedItem.updated_at || new Date()),
    });
  } catch (error) {
    console.error('Error updating order item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const { orderId, itemId } = await params;

    if (!orderId || !itemId) {
      return NextResponse.json(
        { error: 'Missing orderId or itemId' },
        { status: 400 }
      );
    }

    // Verify item belongs to order
    const { data: item, error: verifyError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single();

    if (verifyError || !item) {
      return NextResponse.json(
        { error: 'Item not found in this order' },
        { status: 404 }
      );
    }

    // Delete item
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete item' },
        { status: 500 }
      );
    }

    // Update order total
    await updateOrderTotal(orderId);

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}

async function updateOrderTotal(orderId: string) {
  try {
    // Get all items for this order
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, price')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    // Calculate subtotal
    const subtotal = (items || []).reduce((sum: number, item: any) => {
      return sum + (item.quantity * parseFloat(item.price || 0));
    }, 0);

    // Get order to calculate taxes and shipping
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('tax, shipping')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    const total = subtotal + (order?.tax || 0) + (order?.shipping || 0);

    // Update order with new subtotal and total
    await supabase
      .from('orders')
      .update({
        subtotal: subtotal.toString(),
        total: total.toString(),
        updated_at: new Date(),
      })
      .eq('id', orderId);
  } catch (error) {
    console.error('Error updating order total:', error);
  }
}
