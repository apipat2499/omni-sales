import { NextRequest, NextResponse } from 'next/server';
import { orders } from '../route';

/**
 * GET /api/shop/orders/[orderId]
 * Get detailed order information by order ID (MOCK IMPLEMENTATION)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order from in-memory storage
    const order = orders.get(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Return the order
    return NextResponse.json(order, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in GET /api/shop/orders/[orderId]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
