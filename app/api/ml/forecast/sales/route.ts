import { NextRequest, NextResponse } from 'next/server';
import { forecastSalesPeriod, forecastProductDemand } from '@/lib/ml/forecasting/sales-forecast';

/**
 * GET /api/ml/forecast/sales
 * Get sales forecast for 30 or 90 days
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const period = parseInt(searchParams.get('period') || '30') as 30 | 90;
    const productId = searchParams.get('productId');

    if (productId) {
      // Forecast for specific product
      const forecast = await forecastProductDemand(productId, period);

      return NextResponse.json({
        success: true,
        data: {
          type: 'product',
          productId,
          forecast,
          period,
          generatedAt: new Date().toISOString(),
        },
      });
    } else {
      // Forecast overall sales
      const result = await forecastSalesPeriod(period);

      return NextResponse.json({
        success: true,
        data: {
          type: 'sales',
          ...result,
          period,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    console.error('Error forecasting sales:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to forecast sales',
      },
      { status: 500 }
    );
  }
}
