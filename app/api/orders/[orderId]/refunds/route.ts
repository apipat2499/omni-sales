import { NextRequest, NextResponse } from 'next/server';
import { processRefund } from '@/lib/order/service';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId: orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch refunds' },
        { status: 500 }
      );
    }

    return NextResponse.json(refunds || []);
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { refundId, transactionId, gatewayResponse } = await req.json();

    if (!refundId) {
      return NextResponse.json(
        { error: 'Missing refundId' },
        { status: 400 }
      );
    }

    const refund = await processRefund(refundId, transactionId, gatewayResponse);

    if (!refund) {
      return NextResponse.json(
        { error: 'Failed to process refund' },
        { status: 500 }
      );
    }

    return NextResponse.json(refund);
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}
