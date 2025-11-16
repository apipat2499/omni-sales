import { NextRequest, NextResponse } from 'next/server';
import { getAtRiskCustomers, predictCustomerChurn } from '@/lib/ml/churn/churn-prediction';

/**
 * GET /api/ml/churn/at-risk
 * Get list of at-risk customers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const minRiskLevel = (searchParams.get('minRiskLevel') || 'medium') as
      | 'medium'
      | 'high'
      | 'critical';
    const limit = parseInt(searchParams.get('limit') || '100');

    const atRiskCustomers = await getAtRiskCustomers(minRiskLevel);

    // Limit results
    const limitedResults = atRiskCustomers.slice(0, limit);

    // Calculate summary statistics
    const summary = {
      total: limitedResults.length,
      critical: limitedResults.filter(c => c.riskLevel === 'critical').length,
      high: limitedResults.filter(c => c.riskLevel === 'high').length,
      medium: limitedResults.filter(c => c.riskLevel === 'medium').length,
      averageChurnProbability:
        limitedResults.reduce((sum, c) => sum + c.churnProbability, 0) / limitedResults.length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        customers: limitedResults,
        summary,
        minRiskLevel,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error getting at-risk customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get at-risk customers',
      },
      { status: 500 }
    );
  }
}
