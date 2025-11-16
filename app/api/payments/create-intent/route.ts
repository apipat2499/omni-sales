/**
 * Create Payment Intent API Route
 * POST /api/payments/create-intent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/utils/payment-stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, currency = 'USD', customerId } = body;

    // Validate input
    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order ID or amount' },
        { status: 400 }
      );
    }

    // Create payment intent
    const result = await createPaymentIntent({
      amount,
      currency,
      customerId,
      description: `Payment for Order #${orderId}`,
      metadata: {
        orderId,
      },
      setupFutureUsage: customerId ? 'off_session' : undefined,
    });

    if (!result.success || !result.paymentIntent) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create payment intent' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: result.paymentIntent.id,
      clientSecret: result.paymentIntent.clientSecret,
      amount: result.paymentIntent.amount,
      currency: result.paymentIntent.currency,
    });
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
