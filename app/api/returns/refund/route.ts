import { NextRequest, NextResponse } from 'next/server';
import { processRefund, getRefundTransaction } from '@/lib/returns/service';

export async function GET(req: NextRequest) {
  try {
    const returnId = req.nextUrl.searchParams.get('returnId');

    if (!returnId) {
      return NextResponse.json({ error: 'Missing returnId' }, { status: 400 });
    }

    const refund = await getRefundTransaction(returnId);

    return NextResponse.json({
      data: refund,
    });
  } catch (error) {
    console.error('Error fetching refund:', error);
    return NextResponse.json({ error: 'Failed to fetch refund' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, returnId, refundAmount, refundMethod, paymentMethod, orderPaymentId, refundReason } = body;

    if (!userId || !returnId || !refundAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const refund = await processRefund(userId, returnId, {
      refundAmount,
      refundMethod,
      paymentMethod,
      orderPaymentId,
      refundReason,
    });

    if (!refund) {
      return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
    }

    return NextResponse.json(refund, { status: 201 });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
