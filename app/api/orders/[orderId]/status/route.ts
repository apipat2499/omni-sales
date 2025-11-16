import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/order/service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderId } = await params;
    const { status, reason, notes, changedBy } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing orderId or status' },
        { status: 400 }
      );
    }

    const success = await updateOrderStatus(
      orderId,
      status,
      reason,
      notes,
      changedBy
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      status,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
