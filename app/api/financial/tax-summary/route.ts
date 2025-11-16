/**
 * Tax Summary API Route
 * GET /api/financial/tax-summary
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateTaxSummary,
  generateQuarterlyTaxSummaries,
  exportTaxDataForAccountant,
} from '@/lib/financial/tax-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Get parameters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const reportType = searchParams.get('reportType') || 'summary'; // 'summary', 'quarterly', 'export'
    const year = searchParams.get('year');
    const incomeTaxRate = parseFloat(searchParams.get('incomeTaxRate') || '0.21');
    const salesTaxRate = parseFloat(searchParams.get('salesTaxRate') || '0.07');
    const payrollTaxRate = parseFloat(searchParams.get('payrollTaxRate') || '0.153');
    const tenantId = searchParams.get('tenantId') || undefined;

    const options = {
      incomeTaxRate,
      salesTaxRate,
      payrollTaxRate,
      tenantId,
    };

    let result;

    // Handle quarterly report
    if (reportType === 'quarterly') {
      const taxYear = year ? parseInt(year) : new Date().getFullYear();

      if (isNaN(taxYear) || taxYear < 2000 || taxYear > 2100) {
        return NextResponse.json(
          { error: 'Invalid year' },
          { status: 400 }
        );
      }

      result = await generateQuarterlyTaxSummaries(taxYear, options);

      return NextResponse.json({
        success: true,
        data: result,
        metadata: {
          reportType: 'quarterly',
          year: taxYear,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // For other report types, we need dates
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

    // Handle export for accountant
    if (reportType === 'export') {
      result = await exportTaxDataForAccountant(startDate, endDate, options);

      return NextResponse.json({
        success: true,
        data: result,
        metadata: {
          reportType: 'export',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          generatedAt: new Date().toISOString(),
          format: 'json',
        },
      });
    }

    // Default: Generate tax summary
    result = await generateTaxSummary(startDate, endDate, options);

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        reportType: 'summary',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Tax summary error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate tax summary',
        message: error.message
      },
      { status: 500 }
    );
  }
}
