import { NextRequest, NextResponse } from 'next/server';

/**
 * WebSocket Info API
 * Returns information about WebSocket connection and configuration
 */

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'operational',
    version: '1.0.0',
    features: {
      namespaces: ['orders', 'customers', 'products', 'inventory', 'payments', 'system'],
      eventTypes: {
        orders: ['order:created', 'order:updated', 'order:status_changed', 'order:deleted'],
        customers: ['customer:activity', 'customer:viewing_product', 'customer:online', 'customer:offline', 'customer:added_to_cart'],
        inventory: ['inventory:updated', 'inventory:low_stock', 'inventory:out_of_stock', 'inventory:restocked'],
        products: ['product:price_changed', 'product:created', 'product:updated', 'product:deleted'],
        payments: ['payment:received', 'payment:failed', 'payment:refunded'],
        system: ['system:notification', 'system:alert', 'system:maintenance'],
      },
      authentication: {
        required: true,
        method: 'token',
        fields: ['userId', 'role', 'sessionId', 'expiresAt'],
      },
      reconnection: {
        enabled: true,
        strategy: 'exponential-backoff',
        maxAttempts: 5,
      },
      rateLimit: {
        windowMs: 60000,
        maxEvents: 100,
      },
    },
    connection: {
      protocol: 'ws/wss',
      path: '/api/ws',
      port: process.env.WS_PORT || 'default',
      pingInterval: 30000,
    },
  });
}

export const dynamic = 'force-dynamic';
