import { NextRequest, NextResponse } from 'next/server';
import { getShippingManager } from '@/lib/shipping/shipping-manager';

/**
 * POST /api/shipping/create
 * Create a new shipment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      provider,
      orderId,
      senderAddress,
      recipientAddress,
      parcel,
      serviceType,
      referenceNumber,
    } = body;

    // Validate required fields
    if (!provider || !recipientAddress || !parcel) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, recipientAddress, parcel' },
        { status: 400 }
      );
    }

    if (!recipientAddress.name || !recipientAddress.phone || !recipientAddress.address ||
        !recipientAddress.district || !recipientAddress.province || !recipientAddress.postalCode) {
      return NextResponse.json(
        { error: 'Incomplete recipient address information' },
        { status: 400 }
      );
    }

    if (!parcel.weight) {
      return NextResponse.json(
        { error: 'Parcel weight is required' },
        { status: 400 }
      );
    }

    const shippingManager = getShippingManager();
    const shipment = await shippingManager.createShipment({
      provider,
      orderId,
      senderAddress,
      recipientAddress,
      parcel,
      serviceType,
      referenceNumber,
    });

    return NextResponse.json({
      success: true,
      data: shipment,
    });
  } catch (error: any) {
    console.error('Error creating shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipment' },
      { status: 500 }
    );
  }
}
