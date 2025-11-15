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
          discountCode: order.discount_code,
          discountAmount: order.discount_amount ? parseFloat(order.discount_amount) : undefined,
        };
      })
    );

    // Filter out any null values from failed fetches
    const orders: Order[] = ordersWithItems.filter(
      (order): order is Order => order !== null
    );

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customerId || !body.items || body.items.length === 0 || !body.channel) {
      return NextResponse.json(
        { error: 'Missing required fields: customerId, items, channel' },
        { status: 400 }
      );
    }

    // Calculate subtotal from items
    let subtotal = 0;
    const orderItems = [];

    for (const item of body.items) {
      if (!item.productId || !item.quantity) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        );
      }

      // Fetch product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }

      const itemTotal = parseFloat(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: parseFloat(product.price),
        stock: product.stock, // For inventory update later
      });
    }

    // Apply discount if provided
    let discountAmount = 0;
    let discountCode = null;

    if (body.discountCode) {
      const { data: discount } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', body.discountCode.toUpperCase())
        .single();

      if (discount && discount.active) {
        // Calculate discount
        if (discount.type === 'percentage') {
          discountAmount = (subtotal * parseFloat(discount.value)) / 100;
        } else {
          discountAmount = parseFloat(discount.value);
        }

        // Apply max discount limit
        if (discount.max_discount_amount) {
          discountAmount = Math.min(discountAmount, parseFloat(discount.max_discount_amount));
        }

        discountAmount = Math.min(discountAmount, subtotal);
        discountCode = discount.code;

        // Increment usage count
        await supabase
          .from('discounts')
          .update({ usage_count: discount.usage_count + 1 })
          .eq('id', discount.id);
      }
    }

    const tax = body.tax || (subtotal - discountAmount) * 0.07; // 7% VAT
    const shipping = body.shipping || 0;
    const total = subtotal - discountAmount + tax + shipping;

    // Create order
    const orderData = {
      customer_id: body.customerId,
      subtotal,
      tax,
      shipping,
      total,
      status: 'pending',
      channel: body.channel,
      payment_method: body.paymentMethod || null,
      shipping_address: body.shippingAddress || null,
      notes: body.notes || null,
      discount_code: discountCode,
      discount_amount: discountAmount,
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      );
    }

    // Create order items and update inventory
    for (const item of orderItems) {
      // Insert order item
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      });

      // Update product stock
      const newStock = item.stock - item.quantity;
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.productId);

      // Check inventory alerts
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .is('user_id', null)
        .single();

      if (prefs && prefs.email_enabled) {
        const threshold = prefs.low_stock_threshold || 10;

        if (newStock === 0 && prefs.email_on_out_of_stock) {
          // Create out of stock notification
          await supabase.from('notifications').insert({
            type: 'out_of_stock',
            title: `Out of Stock: ${item.productName}`,
            message: `${item.productName} is now out of stock.`,
            severity: 'error',
            related_id: item.productId,
            related_type: 'product',
            is_read: false,
          });
        } else if (newStock > 0 && newStock < threshold && prefs.email_on_low_stock) {
          // Create low stock notification
          await supabase.from('notifications').insert({
            type: 'low_stock',
            title: `Low Stock: ${item.productName}`,
            message: `${item.productName} has only ${newStock} units remaining.`,
            severity: 'warning',
            related_id: item.productId,
            related_type: 'product',
            is_read: false,
          });
        }
      }
    }

    // Create discount usage record if discount was applied
    if (discountCode) {
      const { data: discount } = await supabase
        .from('discounts')
        .select('id')
        .eq('code', discountCode)
        .single();

      if (discount) {
        await supabase.from('discount_usages').insert({
          discount_id: discount.id,
          order_id: order.id,
          customer_id: body.customerId,
          discount_amount: discountAmount,
        });
      }
    }

    // Create order created notification
    await supabase.from('notifications').insert({
      type: 'order_created',
      title: 'New Order Received',
      message: `Order #${order.id.slice(0, 8)} for ${formatCurrency(total)}`,
      severity: 'success',
      related_id: order.id,
      related_type: 'order',
      is_read: false,
    });

    // Send email notification to customer
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', body.customerId)
        .single();

      if (customer && customer.email) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', body.customerId)
          .single();

        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        const orderWithDetails = {
          id: order.id,
          customerName: customer.name,
          items: (itemsData || []).map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })),
          subtotal,
          tax,
          shipping,
          total,
          discountCode,
          discountAmount,
          paymentMethod: body.paymentMethod,
          shippingAddress: body.shippingAddress,
          notes: body.notes,
          createdAt: new Date(order.created_at),
        };

        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order_created',
            to: customer.email,
            order: orderWithDetails,
          }),
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/orders:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
}
