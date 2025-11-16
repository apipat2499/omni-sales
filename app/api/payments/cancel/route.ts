/**
 * Cancel Payment Intent API Route
 * POST /api/payments/cancel
 */

import { NextRequest, NextResponse } from 'next/server';
import { cancelPaymentIntent } from '@/lib/utils/payment-stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const result = await cancelPaymentIntent(paymentIntentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to cancel payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment cancelled successfully',
    });
  } catch (error: any) {
    console.error('Payment cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment cancellation failed' },
      { status: 500 }
    );
  }
}
