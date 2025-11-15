import { NextRequest, NextResponse } from 'next/server';
import { createReturn, approveReturn } from '@/lib/order/service';
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

    const { data: returns, error } = await supabase
      .from('order_returns')
      .select(`
        *,
        return_items (*)
      `)
      .eq('order_id', orderId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch returns' },
        { status: 500 }
      );
    }

    return NextResponse.json(returns || []);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
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
    const { returnReason, reasonDetails, items, notes } = await req.json();

    if (!orderId || !returnReason || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const returnRecord = await createReturn(orderId, {
      returnReason,
      reasonDetails,
      items,
      notes,
    });

    if (!returnRecord) {
      return NextResponse.json(
        { error: 'Failed to create return' },
        { status: 500 }
      );
    }

    return NextResponse.json(returnRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create return' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { returnId, action, refundAmount } = await req.json();

    if (!returnId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const success = await approveReturn(returnId, refundAmount);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to approve return' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        returnId,
        action: 'approve',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating return:', error);
    return NextResponse.json(
      { error: 'Failed to update return' },
      { status: 500 }
    );
  }
}
