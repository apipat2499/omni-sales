/**
 * Add Payment Method API Route
 * POST /api/payments/methods/add
 */

import { NextRequest, NextResponse } from 'next/server';
import { attachPaymentMethod, getPaymentMethod } from '@/lib/utils/payment-stripe';
import { savePaymentMethod } from '@/lib/utils/payment-management';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, paymentMethodId, isDefault = false } = body;

    if (!customerId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Customer ID and Payment Method ID are required' },
        { status: 400 }
      );
    }

    // Attach payment method to customer in Stripe
    const attachResult = await attachPaymentMethod(paymentMethodId, customerId);

    if (!attachResult.success || !attachResult.paymentMethod) {
      return NextResponse.json(
        { error: attachResult.error || 'Failed to attach payment method' },
        { status: 500 }
      );
    }

    const pm = attachResult.paymentMethod;

    // Save to database
    const saveResult = await savePaymentMethod({
      customerId,
      stripePaymentMethodId: pm.id,
      type: pm.type as 'card' | 'wallet' | 'bank_account',
      last4: pm.card?.last4,
      brand: pm.card?.brand,
      expiryMonth: pm.card?.expMonth,
      expiryYear: pm.card?.expYear,
      isDefault,
    });

    if (!saveResult.success) {
      return NextResponse.json(
        { error: saveResult.error || 'Failed to save payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentMethod: saveResult.paymentMethod,
    });
  } catch (error: any) {
    console.error('Add payment method error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add payment method' },
      { status: 500 }
    );
  }
}
