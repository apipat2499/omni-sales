/**
 * Confirm Payment Intent API Route
 * POST /api/payments/confirm
 */

import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentIntent, getPaymentIntent } from '@/lib/utils/payment-stripe';
import { createPaymentRecord } from '@/lib/utils/payment-management';

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

    // Get payment intent details
    const piResult = await getPaymentIntent(paymentIntentId);

    if (!piResult.success || !piResult.paymentIntent) {
      return NextResponse.json(
        { error: piResult.error || 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Confirm payment intent
    const confirmResult = await confirmPaymentIntent(paymentIntentId);

    if (!confirmResult.success || !confirmResult.paymentIntent) {
      return NextResponse.json(
        {
          success: false,
          error: confirmResult.error || 'Failed to confirm payment',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: confirmResult.paymentIntent.id,
      status: confirmResult.paymentIntent.status,
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment confirmation failed' },
      { status: 500 }
    );
  }
}
