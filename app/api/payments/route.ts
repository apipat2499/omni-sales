/**
 * Payments List API Route
 * GET /api/payments - List payments with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentRecords } from '@/lib/utils/payment-management';
import type { PaymentFilters } from '@/lib/utils/payment-management';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Build filters
    const filters: PaymentFilters = {};

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as any;
    }

    if (searchParams.get('customerId')) {
      filters.customerId = searchParams.get('customerId')!;
    }

    if (searchParams.get('orderId')) {
      filters.orderId = searchParams.get('orderId')!;
    }

    if (searchParams.get('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    }

    if (searchParams.get('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!);
    }

    if (searchParams.get('minAmount')) {
      filters.minAmount = parseFloat(searchParams.get('minAmount')!);
    }

    if (searchParams.get('maxAmount')) {
      filters.maxAmount = parseFloat(searchParams.get('maxAmount')!);
    }

    if (searchParams.get('paymentMethod')) {
      filters.paymentMethod = searchParams.get('paymentMethod')!;
    }

    const offset = (page - 1) * pageSize;
    const result = await getPaymentRecords(filters, pageSize, offset);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get payments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payments: result.payments || [],
      total: result.total || 0,
      page,
      pageSize,
    });
  } catch (error: any) {
    console.error('Payments list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payments' },
      { status: 500 }
    );
  }
}
