import { NextRequest, NextResponse } from 'next/server';
import { getShippingManager } from '@/lib/shipping/shipping-manager';

/**
 * GET /api/shipping/rates
 * Get shipping rate quotes from all providers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const weight = searchParams.get('weight');
    const width = searchParams.get('width');
    const height = searchParams.get('height');
    const length = searchParams.get('length');

    if (!origin || !destination || !weight) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, destination, weight' },
        { status: 400 }
      );
    }

    const dimensions = width && height && length ? {
      width: parseFloat(width),
      height: parseFloat(height),
      length: parseFloat(length),
    } : undefined;

    const shippingManager = getShippingManager();
    const rates = await shippingManager.getRates(
      origin,
      destination,
      parseFloat(weight),
      dimensions
    );

    return NextResponse.json({
      success: true,
      data: rates,
    });
  } catch (error: any) {
    console.error('Error getting shipping rates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get shipping rates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shipping/rates
 * Get shipping rate quotes (alternative POST endpoint for complex requests)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, weight, dimensions } = body;

    if (!origin || !destination || !weight) {
      return NextResponse.json(
        { error: 'Missing required fields: origin, destination, weight' },
        { status: 400 }
      );
    }

    const shippingManager = getShippingManager();
    const rates = await shippingManager.getRates(
      origin,
      destination,
      weight,
      dimensions
    );

    return NextResponse.json({
      success: true,
      data: rates,
    });
  } catch (error: any) {
    console.error('Error getting shipping rates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get shipping rates' },
      { status: 500 }
    );
  }
}
