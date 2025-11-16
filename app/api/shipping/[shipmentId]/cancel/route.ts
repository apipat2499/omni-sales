import { NextRequest, NextResponse } from 'next/server';
import { getShippingManager } from '@/lib/shipping/shipping-manager';
import { supabase } from '@/lib/supabase/client';

/**
 * PUT /api/shipping/[shipmentId]/cancel
 * Cancel a shipment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { shipmentId: string } }
) {
  try {
    const { shipmentId } = params;
    const body = await request.json();
    const { reason } = body;

    // Get shipment from database
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', shipmentId)
      .single();

    if (error || !shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Check if shipment can be cancelled
    if (shipment.status === 'delivered' || shipment.status === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot cancel shipment with status: ${shipment.status}` },
        { status: 400 }
      );
    }

    const shippingManager = getShippingManager();
    const success = await shippingManager.cancelShipment(
      shipment.provider,
      shipment.tracking_number,
      reason
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Shipment cancelled successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to cancel shipment' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error cancelling shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel shipment' },
      { status: 500 }
    );
  }
}
