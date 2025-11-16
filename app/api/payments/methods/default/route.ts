/**
 * Set Default Payment Method API Route
 * POST /api/payments/methods/default
 */

import { NextRequest, NextResponse } from 'next/server';
import { setDefaultPaymentMethod as setDefaultPaymentMethodDb } from '@/lib/utils/payment-management';
import { setDefaultPaymentMethod as setDefaultPaymentMethodStripe } from '@/lib/utils/payment-stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, methodId } = body;

    if (!customerId || !methodId) {
      return NextResponse.json(
        { error: 'Customer ID and Method ID are required' },
        { status: 400 }
      );
    }

    // Get payment method from database to get Stripe ID
    const { getPaymentMethods } = await import('@/lib/utils/payment-management');
    const methodsResult = await getPaymentMethods(customerId);

    if (!methodsResult.success || !methodsResult.paymentMethods) {
      return NextResponse.json(
        { error: 'Payment methods not found' },
        { status: 404 }
      );
    }

    const method = methodsResult.paymentMethods.find((m) => m.id === methodId);

    if (!method) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Set default in Stripe
    await setDefaultPaymentMethodStripe(customerId, method.stripePaymentMethodId);

    // Set default in database
    const result = await setDefaultPaymentMethodDb(customerId, methodId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to set default payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated',
    });
  } catch (error: any) {
    console.error('Set default payment method error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set default payment method' },
      { status: 500 }
    );
  }
}
