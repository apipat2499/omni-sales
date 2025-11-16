/**
 * Payment Methods API Route
 * GET /api/payments/methods - List payment methods
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentMethods } from '@/lib/utils/payment-management';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const result = await getPaymentMethods(customerId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get payment methods' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentMethods: result.paymentMethods || [],
    });
  } catch (error: any) {
    console.error('Payment methods retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment methods' },
      { status: 500 }
    );
  }
}
