import { NextRequest, NextResponse } from 'next/server';
import { getShippingManager } from '@/lib/shipping/shipping-manager';

/**
 * GET /api/shipping/providers
 * Get list of available shipping providers
 */
export async function GET(request: NextRequest) {
  try {
    const shippingManager = getShippingManager();
    const providers = await shippingManager.getAvailableProviders();

    return NextResponse.json({
      success: true,
      data: providers,
    });
  } catch (error: any) {
    console.error('Error getting shipping providers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get shipping providers' },
      { status: 500 }
    );
  }
}
