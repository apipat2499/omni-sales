import { NextRequest, NextResponse } from 'next/server';
import { getShippingManager } from '@/lib/shipping/shipping-manager';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/shipping/[shipmentId]/track
 * Track a shipment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shipmentId: string } }
) {
  try {
    const { shipmentId } = params;

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

    const shippingManager = getShippingManager();
    const tracking = await shippingManager.trackShipment(
      shipment.provider,
      shipment.tracking_number
    );

    return NextResponse.json({
      success: true,
      data: tracking,
    });
  } catch (error: any) {
    console.error('Error tracking shipment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track shipment' },
      { status: 500 }
    );
  }
}
