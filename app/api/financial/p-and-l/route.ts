/**
 * P&L Report API Route
 * GET /api/financial/p-and-l
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePandLReport, generatePandLByPeriod } from '@/lib/financial/p-and-l-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Get date parameters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const periodType = searchParams.get('periodType') as 'monthly' | 'quarterly' | 'yearly' | null;
    const includeYoY = searchParams.get('includeYoY') === 'true';
    const tenantId = searchParams.get('tenantId') || undefined;

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

    // Generate report(s)
    let result;

    if (periodType) {
      // Generate multiple reports by period
      result = await generatePandLByPeriod(
        startDate,
        endDate,
        periodType,
        { tenantId }
      );
    } else {
      // Generate single report
      result = await generatePandLReport(
        startDate,
        endDate,
        {
          includeYoY,
          tenantId,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        periodType: periodType || 'single',
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('P&L report error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate P&L report',
        message: error.message
      },
      { status: 500 }
    );
  }
}
