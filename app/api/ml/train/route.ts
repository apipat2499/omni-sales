import { NextRequest, NextResponse } from 'next/server';
import {
  buildItemSimilarityMatrix,
  buildUserItemMatrix,
} from '@/lib/ml/recommendation/collaborative-filter';
import { calculateAllCustomersRFM, getAtRiskCustomers } from '@/lib/ml/churn/churn-prediction';
import { forecastSalesPeriod } from '@/lib/ml/forecasting/sales-forecast';
import { supabase } from '@/lib/supabase/client';

/**
 * POST /api/ml/train
 * Manually trigger model training/recomputation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { models = ['all'] } = body;

    const results: any = {
      startedAt: new Date().toISOString(),
      models: {},
    };

    // Train recommendation models
    if (models.includes('all') || models.includes('recommendations')) {
      try {
        console.log('Training recommendation models...');

        // Build similarity matrices
        const itemSimilarity = await buildItemSimilarityMatrix();

        results.models.recommendations = {
          success: true,
          itemSimilarityMatrixSize: itemSimilarity.size,
          message: 'Recommendation models trained successfully',
        };
      } catch (error: any) {
        results.models.recommendations = {
          success: false,
          error: error.message,
        };
      }
    }

    // Generate sales forecasts
    if (models.includes('all') || models.includes('forecast')) {
      try {
        console.log('Generating sales forecasts...');

        const forecast30 = await forecastSalesPeriod(30);
        const forecast90 = await forecastSalesPeriod(90);

        // Store forecasts
        await supabase.from('ml_forecast_results').insert([
          {
            forecast_type: 'sales',
            forecast_data: JSON.stringify(forecast30.forecast),
            historical_days: 180,
            algorithm: 'ARIMA',
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            metadata: JSON.stringify(forecast30.summary),
          },
          {
            forecast_type: 'sales',
            forecast_data: JSON.stringify(forecast90.forecast),
            historical_days: 180,
            algorithm: 'ARIMA',
            generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            metadata: JSON.stringify(forecast90.summary),
          },
        ]);

        results.models.forecast = {
          success: true,
          forecast30Days: forecast30.summary,
          forecast90Days: forecast90.summary,
          message: 'Sales forecasts generated successfully',
        };
      } catch (error: any) {
        results.models.forecast = {
          success: false,
          error: error.message,
        };
      }
    }

    // Calculate churn predictions
    if (models.includes('all') || models.includes('churn')) {
      try {
        console.log('Calculating churn predictions...');

        // Calculate RFM for all customers
        const rfmScores = await calculateAllCustomersRFM();

        // Get at-risk customers
        const atRiskCustomers = await getAtRiskCustomers('medium');

        // Store training log
        await supabase.from('ml_training_logs').insert({
          model_type: 'churn',
          status: 'completed',
          metrics: JSON.stringify({
            totalCustomers: rfmScores.length,
            atRiskCount: atRiskCustomers.length,
          }),
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });

        results.models.churn = {
          success: true,
          totalCustomers: rfmScores.length,
          atRiskCustomers: atRiskCustomers.length,
          message: 'Churn predictions calculated successfully',
        };
      } catch (error: any) {
        results.models.churn = {
          success: false,
          error: error.message,
        };
      }
    }

    results.completedAt = new Date().toISOString();
    results.success = Object.values(results.models).every((m: any) => m.success);

    // Store training log
    await supabase.from('ml_training_logs').insert({
      model_type: 'all',
      status: results.success ? 'completed' : 'failed',
      metrics: JSON.stringify(results),
      started_at: results.startedAt,
      completed_at: results.completedAt,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error training models:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to train models',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ml/train
 * Get training status and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data: logs, error } = await supabase
      .from('ml_training_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        logs: logs || [],
        count: logs?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Error getting training logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get training logs',
      },
      { status: 500 }
    );
  }
}
