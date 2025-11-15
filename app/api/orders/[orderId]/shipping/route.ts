import { NextRequest, NextResponse } from 'next/server';
import { createShipping, updateShippingStatus } from '@/lib/order/service';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    const { data: shipping, error } = await supabase
      .from('order_shipping')
      .select('*')
      .eq('order_id', orderId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch shipping' },
        { status: 500 }
      );
    }

    return NextResponse.json(shipping || []);
  } catch (error) {
    console.error('Error fetching shipping:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    const {
      shippingMethod,
      carrier,
      trackingNumber,
      shippingAddress,
      weightKg,
      dimensionsCm,
      signatureRequired,
      specialInstructions,
    } = await req.json();

    if (!orderId || !shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const shipping = await createShipping(orderId, {
      shippingMethod,
      carrier,
      trackingNumber,
      shippingAddress,
      weightKg,
      dimensionsCm,
      signatureRequired,
      specialInstructions,
    });

    if (!shipping) {
      return NextResponse.json(
        { error: 'Failed to create shipping' },
        { status: 500 }
      );
    }

    return NextResponse.json(shipping, { status: 201 });
  } catch (error) {
    console.error('Error creating shipping:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { shippingId, status, trackingNumber } = await req.json();

    if (!shippingId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await updateShippingStatus(shippingId, status, trackingNumber);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update shipping status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shippingId,
      status,
    });
  } catch (error) {
    console.error('Error updating shipping status:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping status' },
      { status: 500 }
    );
  }
}
