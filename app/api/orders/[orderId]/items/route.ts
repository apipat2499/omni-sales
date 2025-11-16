import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { validateAddOrderItem } from '@/lib/validations/order-items';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    const { data: items, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      );
    }

    const transformedItems = (items || []).map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      price: parseFloat(item.price || 0),
      discount: item.discount ? parseFloat(item.discount) : undefined,
      notes: item.notes,
      createdAt: new Date(item.created_at),
    }));

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Error fetching order items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order items' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateAddOrderItem(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 }
      );
    }

    const { productId, productName, quantity, price } = validation.data;

    // Check stock availability
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if enough stock
    if (product.stock !== null && product.stock < quantity) {
      return NextResponse.json(
        {
          error: 'Insufficient stock',
          available: product.stock,
          requested: quantity,
        },
        { status: 400 }
      );
    }

    // Insert new item
    const { data: newItem, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: productId,
        product_name: productName,
        quantity,
        price,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to add item to order' },
        { status: 500 }
      );
    }

    // Update order total
    await updateOrderTotal(orderId);

    return NextResponse.json({
      id: newItem.id,
      orderId: newItem.order_id,
      productId: newItem.product_id,
      productName: newItem.product_name,
      quantity: newItem.quantity,
      price: parseFloat(newItem.price || 0),
      createdAt: new Date(newItem.created_at),
    });
  } catch (error) {
    console.error('Error adding item to order:', error);
    return NextResponse.json(
      { error: 'Failed to add item to order' },
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
