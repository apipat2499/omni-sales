/**
 * Refund Payment API Route
 * POST /api/payments/refund
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRefund } from '@/lib/utils/payment-stripe';
import { createRefundRecord, getPaymentRecord, updatePaymentRecord } from '@/lib/utils/payment-management';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, amount, reason = 'requested_by_customer', notes } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment record
    const paymentResult = await getPaymentRecord(paymentId);

    if (!paymentResult.success || !paymentResult.payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = paymentResult.payment;

    if (!payment.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID not found' },
        { status: 400 }
      );
    }

    // Create refund with Stripe
    const refundResult = await createRefund({
      paymentIntentId: payment.stripePaymentIntentId,
      amount,
      reason,
      metadata: {
        paymentId,
        orderId: payment.orderId || '',
      },
    });

    if (!refundResult.success || !refundResult.refund) {
      return NextResponse.json(
        { error: refundResult.error || 'Failed to create refund' },
        { status: 500 }
      );
    }

    // Create refund record
    const refundRecordResult = await createRefundRecord({
      paymentId,
      amount: refundResult.refund.amount,
      reason,
      status: refundResult.refund.status === 'succeeded' ? 'succeeded' : 'pending',
      stripeRefundId: refundResult.refund.id,
      notes,
      processedAt: refundResult.refund.status === 'succeeded' ? new Date() : undefined,
    });

    // Update payment record
    await updatePaymentRecord(paymentId, {
      refunded: true,
      refundAmount: refundResult.refund.amount,
      refundedAt: new Date(),
      refundReason: reason,
    });

    return NextResponse.json({
      success: true,
      refund: refundRecordResult.refund,
    });
  } catch (error: any) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Refund processing failed' },
      { status: 500 }
    );
  }
}
