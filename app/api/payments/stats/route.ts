/**
 * Payment Statistics API Route
 * GET /api/payments/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStats } from '@/lib/utils/payment-management';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId') || undefined;
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;

    const result = await getPaymentStats(customerId, dateFrom, dateTo);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get payment stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
    });
  } catch (error: any) {
    console.error('Payment stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment stats' },
      { status: 500 }
    );
  }
}
