import { NextRequest, NextResponse } from 'next/server';
import { predictCustomerChurn, storeChurnPrediction } from '@/lib/ml/churn/churn-prediction';

/**
 * GET /api/ml/churn/:customerId
 * Get churn prediction for specific customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params;

    const prediction = await predictCustomerChurn(customerId);

    if (!prediction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found or insufficient data',
        },
        { status: 404 }
      );
    }

    // Store prediction in database
    await storeChurnPrediction(prediction);

    return NextResponse.json({
      success: true,
      data: prediction,
    });
  } catch (error: any) {
    console.error('Error predicting customer churn:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to predict customer churn',
      },
      { status: 500 }
    );
  }
}
