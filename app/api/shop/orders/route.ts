import { NextRequest, NextResponse } from 'next/server';

// MOCK IMPLEMENTATION FOR STOREFRONT
// In-memory storage for demo purposes
// TODO: Database team will integrate with real database
const orders = new Map<string, any>();

/**
 * POST /api/shop/orders
 * Create a new order from checkout (MOCK IMPLEMENTATION)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.customer || !body.items || !body.total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create order object
    const order = {
      orderId,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        address: body.customer.address,
        notes: body.customer.notes || '',
      },
      items: body.items,
      total: body.total,
      paymentMethod: body.paymentMethod || 'bank_transfer',
      status: 'pending',
      createdAt: body.createdAt || new Date().toISOString(),
    };

    // Store order in memory
    orders.set(orderId, order);

    console.log('Order created (MOCK):', orderId);

    return NextResponse.json(
      {
        success: true,
        orderId,
        message: 'Order created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shop/orders
 * Get all orders (MOCK IMPLEMENTATION)
 */
export async function GET() {
  try {
    const allOrders = Array.from(orders.values());

    return NextResponse.json(
      {
        orders: allOrders,
        total: allOrders.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// Export the orders map for use in other routes
export { orders };
