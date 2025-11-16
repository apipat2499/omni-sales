import { NextRequest, NextResponse } from 'next/server';
import { getOrderShipmentTracking } from '@/lib/shipping/order-integration';

/**
 * GET /api/orders/[orderId]/tracking
 * Get tracking information for an order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    const tracking = await getOrderShipmentTracking(orderId);

    if (!tracking) {
      return NextResponse.json(
        { error: 'No tracking information available for this order' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tracking,
    });
  } catch (error: any) {
    console.error('Error getting order tracking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tracking information' },
      { status: 500 }
    );
  }
}
