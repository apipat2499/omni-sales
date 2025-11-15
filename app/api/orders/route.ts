import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Order, OrderItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, items, channel, paymentMethod, shippingAddress, notes, promotionId, couponCode, discount } = body;

    // Validation
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID and items are required' },
        { status: 400 }
      );
    }

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel is required' },
        { status: 400 }
      );
    }

    // Validate customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check stock availability for all items
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item data: productId and quantity > 0 required' },
          { status: 400 }
        );
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    const enrichedItems: (OrderItem & { productId: string })[] = [];

    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('name, price')
        .eq('id', item.productId)
        .single();

      if (product) {
        const itemPrice = item.price || product.price;
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;

        enrichedItems.push({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: itemPrice,
        });
      }
    }

    const discountAmount = discount || 0;
    const tax = (subtotal - discountAmount) * 0.07; // 7% VAT on discounted subtotal
    const shipping = body.shipping || 0;
    const total = subtotal - discountAmount + tax + shipping;

    // Create order
    const orderData: any = {
      customer_id: customerId,
      subtotal,
      tax,
      shipping,
      total,
      status: 'pending',
      channel,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      notes,
    };

    // Add promotion fields if discount is applied
    if (discountAmount > 0 && promotionId) {
      orderData.promotion_id = promotionId;
      orderData.discount = discountAmount;
    }
    if (couponCode) {
      orderData.coupon_code = couponCode;
    }

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError?.message },
        { status: 500 }
      );
    }

    // Create order items and deduct stock
    for (const item of enrichedItems) {
      // Insert order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: newOrder.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          price: item.price,
        });

      if (itemError) {
        console.error('Error creating order item:', itemError);
        // Rollback: delete the order
        await supabase.from('orders').delete().eq('id', newOrder.id);
        return NextResponse.json(
          { error: 'Failed to create order items', details: itemError.message },
          { status: 500 }
        );
      }

      // Deduct stock
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .single();

      if (product) {
        const newStock = product.stock - item.quantity;

        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.productId);

        if (stockError) {
          console.error('Error updating stock:', stockError);
          // Rollback: delete the order (cascade will delete items)
          await supabase.from('orders').delete().eq('id', newOrder.id);
          return NextResponse.json(
            { error: 'Failed to update stock', details: stockError.message },
            { status: 500 }
          );
        }

        // Record stock movement
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: item.productId,
            order_id: newOrder.id,
            type: 'sale',
            quantity: -item.quantity,
            previous_stock: product.stock,
            new_stock: newStock,
            notes: `Stock deducted for order ${newOrder.id}`,
          });

        if (movementError) {
          console.error('Error recording stock movement:', movementError);
          // Continue anyway - stock movement is for tracking only
        }
      }
    }

    // Fetch the created order with customer name
    const { data: createdOrder } = await supabase
      .from('orders')
      .select(`
        *,
        customers!inner(name)
      `)
      .eq('id', newOrder.id)
      .single();

    // Fetch order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, price')
      .eq('order_id', newOrder.id);

    const response: Order = {
      id: createdOrder.id,
      customerId: createdOrder.customer_id,
      customerName: createdOrder.customers.name,
      items: (orderItems || []).map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
      subtotal: parseFloat(createdOrder.subtotal),
      tax: parseFloat(createdOrder.tax),
      shipping: parseFloat(createdOrder.shipping),
      discountAmount: createdOrder.discount ? parseFloat(createdOrder.discount) : undefined,
      total: parseFloat(createdOrder.total),
      status: createdOrder.status,
      channel: createdOrder.channel,
      paymentMethod: createdOrder.payment_method,
      shippingAddress: createdOrder.shipping_address,
      notes: createdOrder.notes,
      promotionId: createdOrder.promotion_id || undefined,
      couponCode: createdOrder.coupon_code || undefined,
      createdAt: new Date(createdOrder.created_at),
      updatedAt: new Date(createdOrder.updated_at),
      deliveredAt: createdOrder.delivered_at ? new Date(createdOrder.delivered_at) : undefined,
    };

    return NextResponse.json(response, { status: 201 });
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabase
      .from('orders')
      .select('*, customers!inner(name)', { count: 'exact', head: true });

    // Build data query
    let dataQuery = supabase
      .from('orders')
      .select(`
        *,
        customers!inner(name)
      `);

    // Apply search filter to both (order ID or customer name)
    if (search) {
      const searchFilter = `id.ilike.%${search}%,customers.name.ilike.%${search}%`;
      dataQuery = dataQuery.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // Apply status filter to both
    if (status && status !== 'all') {
      dataQuery = dataQuery.eq('status', status);
      countQuery = countQuery.eq('status', status);
    }

    // Apply channel filter to both
    if (channel && channel !== 'all') {
      dataQuery = dataQuery.eq('channel', channel);
      countQuery = countQuery.eq('channel', channel);
    }

    // Apply pagination and ordering
    dataQuery = dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute both queries in parallel
    const [{ data: ordersData, error: ordersError }, { count, error: countError }] = await Promise.all([
      dataQuery,
      countQuery,
    ]);

    if (ordersError || countError) {
      console.error('Error fetching orders:', ordersError || countError);
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: (ordersError || countError)?.message },
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
          discountAmount: order.discount ? parseFloat(order.discount) : undefined,
          total: parseFloat(order.total),
          status: order.status,
          channel: order.channel,
          paymentMethod: order.payment_method,
          shippingAddress: order.shipping_address,
          notes: order.notes,
          promotionId: order.promotion_id || undefined,
          couponCode: order.coupon_code || undefined,
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at),
          deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
        };
      })
    );

    // Filter out any null values from failed fetches
    const orders: Order[] = ordersWithItems.filter(
      (order): order is Order => order !== null
    );

    // Return with pagination metadata
    return NextResponse.json({
      data: orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
