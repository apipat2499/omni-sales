import { NextRequest, NextResponse } from 'next/server';
import { syncAllActiveShipments } from '@/lib/shipping/order-integration';

/**
 * POST /api/shipping/sync
 * Sync tracking status for all active shipments
 */
export async function POST(request: NextRequest) {
  try {
    const result = await syncAllActiveShipments();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error syncing shipments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync shipments' },
      { status: 500 }
    );
  }
}
