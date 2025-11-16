import { NextRequest, NextResponse } from 'next/server';
import { autoCreateShipmentForOrder } from '@/lib/shipping/order-integration';

/**
 * POST /api/shipping/bulk-create-from-orders
 * Create shipments for multiple orders
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orders } = body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'Invalid orders array' },
        { status: 400 }
      );
    }

    const results = {
      total: orders.length,
      created: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const orderReq of orders) {
      try {
        const result = await autoCreateShipmentForOrder(
          orderReq.orderId,
          orderReq.provider,
          orderReq.serviceType
        );

        if (result.success) {
          results.created++;
        } else {
          results.failed++;
          results.errors.push({
            orderId: orderReq.orderId,
            error: result.error,
          });
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          orderId: orderReq.orderId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error('Error creating bulk shipments from orders:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create bulk shipments' },
      { status: 500 }
    );
  }
}
