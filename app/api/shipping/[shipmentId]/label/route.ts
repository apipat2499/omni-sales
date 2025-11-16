import { NextRequest, NextResponse } from 'next/server';
import { getShippingManager } from '@/lib/shipping/shipping-manager';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/shipping/[shipmentId]/label
 * Get shipping label for a shipment
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
    const labelUrl = await shippingManager.getShippingLabel(
      shipment.provider,
      shipment.tracking_number
    );

    // Update label printed status
    await supabase
      .from('shipments')
      .update({
        label_printed: true,
        label_printed_at: new Date(),
      })
      .eq('id', shipmentId);

    return NextResponse.json({
      success: true,
      data: {
        labelUrl,
        trackingNumber: shipment.tracking_number,
      },
    });
  } catch (error: any) {
    console.error('Error getting shipping label:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get shipping label' },
      { status: 500 }
    );
  }
}
