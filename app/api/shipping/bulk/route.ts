import { NextRequest, NextResponse } from 'next/server';
import { getShippingManager } from '@/lib/shipping/shipping-manager';

/**
 * POST /api/shipping/bulk
 * Create multiple shipments in bulk
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipments } = body;

    if (!Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json(
        { error: 'Invalid shipments array' },
        { status: 400 }
      );
    }

    const shippingManager = getShippingManager();
    const results = await shippingManager.bulkCreateShipments(shipments);

    return NextResponse.json({
      success: true,
      data: {
        total: shipments.length,
        created: results.length,
        failed: shipments.length - results.length,
        shipments: results,
      },
    });
  } catch (error: any) {
    console.error('Error creating bulk shipments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create bulk shipments' },
      { status: 500 }
    );
  }
}
