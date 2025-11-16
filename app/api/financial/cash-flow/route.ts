/**
 * Cash Flow API Route
 * GET /api/financial/cash-flow
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateCashFlowStatement,
  generateCashFlowByPeriod,
  calculateCashPosition,
  analyzeCashFlowTrends,
  calculateFreeCashFlow,
} from '@/lib/financial/cashflow-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Get parameters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const periodType = searchParams.get('periodType') as 'monthly' | 'quarterly' | 'yearly' | null;
    const reportType = searchParams.get('reportType') || 'statement'; // 'statement', 'position', 'trends', 'fcf'
    const beginningBalance = parseFloat(searchParams.get('beginningBalance') || '0');
    const tenantId = searchParams.get('tenantId') || undefined;

    // For position report, we don't need dates
    if (reportType === 'position') {
      const position = await calculateCashPosition({ tenantId });
      return NextResponse.json({
        success: true,
        data: position,
        metadata: {
          reportType,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Default to current month if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    let result;

    switch (reportType) {
      case 'trends':
        result = await analyzeCashFlowTrends(startDate, endDate, { tenantId });
        break;

      case 'fcf':
        result = await calculateFreeCashFlow(startDate, endDate, { tenantId });
        break;

      case 'statement':
      default:
        if (periodType) {
          result = await generateCashFlowByPeriod(
            startDate,
            endDate,
            periodType,
            { tenantId, beginningBalance }
          );
        } else {
          result = await generateCashFlowStatement(
            startDate,
            endDate,
            { tenantId, beginningBalance }
          );
        }
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reportType,
        periodType: periodType || 'single',
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Cash flow report error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate cash flow report',
        message: error.message
      },
      { status: 500 }
    );
  }
}
