/**
 * WebSocket Integration Examples
 * Examples of how to integrate WebSocket events into API routes
 */

import { emitOrderEvent, emitInventoryEvent, emitProductEvent, emitPaymentEvent } from './helpers';

/**
 * Example 1: Order API Integration
 * Add this code to your order creation API route
 */
export function exampleOrderCreation() {
  // After creating order in database...
  const order = {
    id: 'order_123',
    customerId: 'cust_456',
    customerName: 'John Doe',
    total: 1500,
    status: 'pending' as const,
    channel: 'online' as const,
  };

  // Emit WebSocket event
  emitOrderEvent('created', order);

  // Returns to client...
}

/**
 * Example 2: Order Status Update
 * Add this to your order status update API route
 */
export function exampleOrderStatusUpdate() {
  // When updating order status...
  const orderId = 'order_123';
  const oldStatus = 'pending';
  const newStatus = 'processing';

  const order = {
    id: orderId,
    customerId: 'cust_456',
    customerName: 'John Doe',
    status: newStatus as const,
  };

  // Emit WebSocket event
  emitOrderEvent('status_changed', order, oldStatus);
}

/**
 * Example 3: Inventory Update
 * Add this to your inventory update API route
 */
export function exampleInventoryUpdate() {
  // When updating product stock...
  const productData = {
    id: 'prod_789',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    oldStock: 50,
    newStock: 45,
    reason: 'sale' as const,
  };

  // Emit WebSocket event
  emitInventoryEvent('updated', productData);
}

/**
 * Example 4: Product Price Change
 * Add this to your product update API route
 */
export function exampleProductPriceChange() {
  // When updating product price...
  const product = {
    id: 'prod_789',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    price: 2500,
  };
  const oldPrice = 3000;

  // Emit WebSocket event
  emitProductEvent('price_changed', product, oldPrice);
}

/**
 * Example 5: Payment Processing
 * Add this to your payment webhook handler
 */
export function examplePaymentProcessing() {
  // When payment is received...
  const paymentData = {
    id: 'pay_123',
    orderId: 'order_123',
    customerId: 'cust_456',
    amount: 1500,
    method: 'credit_card',
    status: 'success' as const,
  };

  // Emit WebSocket event
  emitPaymentEvent('received', paymentData);
}

/**
 * Example 6: Complete Order Flow with Multiple Events
 */
export async function exampleCompleteOrderFlow() {
  // 1. Create order
  const order = {
    id: 'order_123',
    customerId: 'cust_456',
    customerName: 'John Doe',
    total: 1500,
    status: 'pending' as const,
    channel: 'online' as const,
    items: [{ productId: 'prod_789', quantity: 1 }],
  };
  emitOrderEvent('created', order);

  // 2. Update inventory
  const productData = {
    id: 'prod_789',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    oldStock: 50,
    newStock: 49,
    reason: 'sale' as const,
  };
  emitInventoryEvent('updated', productData);

  // 3. Process payment
  const paymentData = {
    id: 'pay_123',
    orderId: order.id,
    customerId: order.customerId,
    amount: order.total,
    method: 'credit_card',
    status: 'success' as const,
  };
  emitPaymentEvent('received', paymentData);

  // 4. Update order status
  emitOrderEvent('status_changed', {
    id: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    status: 'processing' as const,
  }, 'pending');
}

/**
 * Example API Route Implementation
 */
export const exampleApiRoute = `
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { emitOrderEvent } from '@/lib/websocket/helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create order in database
    const order = await createOrder(body);

    // Emit WebSocket event
    emitOrderEvent('created', {
      id: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      total: order.total,
      status: order.status,
      channel: order.channel,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
`;
