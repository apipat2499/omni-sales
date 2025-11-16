#!/usr/bin/env ts-node

/**
 * ML Model Training Script
 *
 * This script trains and updates all ML models:
 * - Product recommendation models (collaborative filtering)
 * - Sales forecasting models
 * - Customer churn prediction models
 *
 * Schedule this to run nightly via cron:
 * 0 2 * * * cd /path/to/omni-sales && npm run ml:train
 */

import { createClient } from '@supabase/supabase-js';
import {
  buildUserItemMatrix,
  buildItemSimilarityMatrix,
  getRecommendations,
  storeRecommendations,
} from '../lib/ml/recommendation/collaborative-filter';
import {
  forecastSalesPeriod,
  forecastProductDemand,
  storeForecast,
} from '../lib/ml/forecasting/sales-forecast';
import {
  calculateAllCustomersRFM,
  predictCustomerChurn,
  storeChurnPrediction,
} from '../lib/ml/churn/churn-prediction';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(message: string, level: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '[INFO]',
    success: '[SUCCESS]',
    error: '[ERROR]',
    warn: '[WARN]',
  }[level];

  console.log(`${timestamp} ${prefix} ${message}`);
}

async function logTraining(
  modelType: string,
  status: 'started' | 'completed' | 'failed',
  metrics?: any,
  error?: string
) {
  try {
    await supabase.from('ml_training_logs').insert({
      model_type: modelType,
      status,
      metrics: metrics ? JSON.stringify(metrics) : null,
      error_message: error,
      started_at: new Date().toISOString(),
      completed_at: status !== 'started' ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error('Error logging training:', err);
  }
}

// ============================================
// RECOMMENDATION MODEL TRAINING
// ============================================

async function trainRecommendationModels() {
  log('Starting recommendation model training...', 'info');
  const startTime = Date.now();

  try {
    await logTraining('recommendations', 'started');

    // Build user-item matrix
    log('Building user-item matrix...');
    const userItemMatrix = await buildUserItemMatrix('all', 90);
    log(`User-item matrix built: ${userItemMatrix.size} users`);

    // Build item-item similarity matrix
    log('Building item-item similarity matrix...');
    const itemSimilarityMatrix = await buildItemSimilarityMatrix();
    log(`Item similarity matrix built: ${itemSimilarityMatrix.size} items`);

    // Generate recommendations for active users
    log('Generating recommendations for active users...');
    const { data: activeCustomers } = await supabase
      .from('customers')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(500);

    let recommendationsGenerated = 0;
    const batchSize = 10;

    for (let i = 0; i < (activeCustomers?.length || 0); i += batchSize) {
      const batch = activeCustomers?.slice(i, i + batchSize) || [];

      await Promise.all(
        batch.map(async (customer: any) => {
          try {
            const recommendations = await getRecommendations(customer.id, {
              topN: 20,
              algorithm: 'hybrid',
              useCache: false,
            });

            if (recommendations.length > 0) {
              await storeRecommendations(customer.id, recommendations);
              recommendationsGenerated++;
            }
          } catch (err) {
            log(`Error generating recommendations for customer ${customer.id}: ${err}`, 'warn');
          }
        })
      );

      log(`Progress: ${Math.min(i + batchSize, activeCustomers?.length || 0)}/${activeCustomers?.length || 0} customers`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const metrics = {
      usersInMatrix: userItemMatrix.size,
      itemsInMatrix: itemSimilarityMatrix.size,
      recommendationsGenerated,
      durationSeconds: parseFloat(duration),
    };

    await logTraining('recommendations', 'completed', metrics);
    log(`Recommendation model training completed in ${duration}s`, 'success');
    log(`Metrics: ${JSON.stringify(metrics)}`, 'info');

    return metrics;
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logTraining('recommendations', 'failed', null, error.message);
    log(`Recommendation model training failed after ${duration}s: ${error.message}`, 'error');
    throw error;
  }
}

// ============================================
// SALES FORECASTING
// ============================================

async function trainForecastModels() {
  log('Starting sales forecast model training...', 'info');
  const startTime = Date.now();

  try {
    await logTraining('forecast', 'started');

    // Generate 30-day forecast
    log('Generating 30-day sales forecast...');
    const forecast30 = await forecastSalesPeriod(30);
    await storeForecast('sales', forecast30.forecast, {
      historicalDays: 180,
      algorithm: 'ARIMA with Seasonal Decomposition',
      metrics: {
        totalPredicted: forecast30.summary.totalPredicted,
        avgDaily: forecast30.summary.avgDaily,
        trend: forecast30.summary.trend,
      } as any,
    });

    // Generate 90-day forecast
    log('Generating 90-day sales forecast...');
    const forecast90 = await forecastSalesPeriod(90);
    await storeForecast('sales', forecast90.forecast, {
      historicalDays: 180,
      algorithm: 'ARIMA with Seasonal Decomposition',
      metrics: {
        totalPredicted: forecast90.summary.totalPredicted,
        avgDaily: forecast90.summary.avgDaily,
        trend: forecast90.summary.trend,
      } as any,
    });

    // Forecast top products
    log('Generating product demand forecasts...');
    const { data: topProducts } = await supabase
      .from('products')
      .select('id, name')
      .limit(50);

    let productForecastsGenerated = 0;

    for (const product of topProducts || []) {
      try {
        const productForecast = await forecastProductDemand(product.id, 30);
        if (productForecast.length > 0) {
          await storeForecast('product', productForecast, {
            productId: product.id,
            historicalDays: 180,
            algorithm: 'ARIMA',
          });
          productForecastsGenerated++;
        }
      } catch (err) {
        log(`Error forecasting product ${product.id}: ${err}`, 'warn');
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const metrics = {
      forecast30Days: forecast30.summary,
      forecast90Days: forecast90.summary,
      productForecastsGenerated,
      durationSeconds: parseFloat(duration),
    };

    await logTraining('forecast', 'completed', metrics);
    log(`Forecast model training completed in ${duration}s`, 'success');
    log(`Metrics: ${JSON.stringify(metrics)}`, 'info');

    return metrics;
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logTraining('forecast', 'failed', null, error.message);
    log(`Forecast model training failed after ${duration}s: ${error.message}`, 'error');
    throw error;
  }
}

// ============================================
// CHURN PREDICTION
// ============================================

async function trainChurnModels() {
  log('Starting churn prediction model training...', 'info');
  const startTime = Date.now();

  try {
    await logTraining('churn', 'started');

    // Calculate RFM scores for all customers
    log('Calculating RFM scores for all customers...');
    const rfmScores = await calculateAllCustomersRFM();
    log(`RFM scores calculated for ${rfmScores.length} customers`);

    // Segment customers
    const segmentCounts: Record<string, number> = {};
    rfmScores.forEach(rfm => {
      segmentCounts[rfm.segment] = (segmentCounts[rfm.segment] || 0) + 1;
    });

    // Store RFM scores
    log('Storing RFM scores in database...');
    const rfmRecords = rfmScores.map(rfm => ({
      customer_id: rfm.customerId,
      recency: rfm.recency,
      frequency: rfm.frequency,
      monetary: rfm.monetary,
      recency_score: rfm.recencyScore,
      frequency_score: rfm.frequencyScore,
      monetary_score: rfm.monetaryScore,
      rfm_score: rfm.rfmScore,
      segment: rfm.segment,
      calculated_at: new Date().toISOString(),
    }));

    // Batch insert RFM scores
    const batchSize = 100;
    for (let i = 0; i < rfmRecords.length; i += batchSize) {
      const batch = rfmRecords.slice(i, i + batchSize);
      await supabase.from('ml_rfm_scores').upsert(batch, { onConflict: 'customer_id' });
      log(`RFM batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rfmRecords.length / batchSize)} stored`);
    }

    // Predict churn for at-risk segments
    log('Predicting churn for at-risk customers...');
    const atRiskSegments = [
      'At Risk',
      'Cannot Lose Them',
      'About to Sleep',
      'Hibernating',
      'Lost',
    ];
    const atRiskCustomers = rfmScores.filter(rfm => atRiskSegments.includes(rfm.segment));

    let churnPredictionsGenerated = 0;
    let highRiskCount = 0;
    let criticalRiskCount = 0;

    for (const rfm of atRiskCustomers) {
      try {
        const prediction = await predictCustomerChurn(rfm.customerId);
        if (prediction) {
          await storeChurnPrediction(prediction);
          churnPredictionsGenerated++;

          if (prediction.riskLevel === 'high') highRiskCount++;
          if (prediction.riskLevel === 'critical') criticalRiskCount++;
        }
      } catch (err) {
        log(`Error predicting churn for customer ${rfm.customerId}: ${err}`, 'warn');
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const metrics = {
      totalCustomers: rfmScores.length,
      segmentCounts,
      churnPredictionsGenerated,
      highRiskCount,
      criticalRiskCount,
      durationSeconds: parseFloat(duration),
    };

    await logTraining('churn', 'completed', metrics);
    log(`Churn model training completed in ${duration}s`, 'success');
    log(`Metrics: ${JSON.stringify(metrics)}`, 'info');

    return metrics;
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logTraining('churn', 'failed', null, error.message);
    log(`Churn model training failed after ${duration}s: ${error.message}`, 'error');
    throw error;
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  log('=================================================', 'info');
  log('ML Model Training Pipeline Started', 'info');
  log('=================================================', 'info');

  const overallStartTime = Date.now();
  const results: any = {
    startedAt: new Date().toISOString(),
    models: {},
  };

  // Parse command line arguments
  const args = process.argv.slice(2);
  const modelToTrain = args[0] || 'all';

  try {
    // Train recommendation models
    if (modelToTrain === 'all' || modelToTrain === 'recommendations') {
      results.models.recommendations = await trainRecommendationModels();
    }

    // Train forecast models
    if (modelToTrain === 'all' || modelToTrain === 'forecast') {
      results.models.forecast = await trainForecastModels();
    }

    // Train churn prediction models
    if (modelToTrain === 'all' || modelToTrain === 'churn') {
      results.models.churn = await trainChurnModels();
    }

    results.completedAt = new Date().toISOString();
    results.totalDurationSeconds = ((Date.now() - overallStartTime) / 1000).toFixed(2);
    results.success = true;

    log('=================================================', 'success');
    log('ML Model Training Pipeline Completed Successfully', 'success');
    log(`Total Duration: ${results.totalDurationSeconds}s`, 'success');
    log('=================================================', 'success');

    console.log('\nFinal Results:');
    console.log(JSON.stringify(results, null, 2));

    process.exit(0);
  } catch (error: any) {
    results.completedAt = new Date().toISOString();
    results.totalDurationSeconds = ((Date.now() - overallStartTime) / 1000).toFixed(2);
    results.success = false;
    results.error = error.message;

    log('=================================================', 'error');
    log('ML Model Training Pipeline Failed', 'error');
    log(`Error: ${error.message}`, 'error');
    log('=================================================', 'error');

    console.log('\nFinal Results:');
    console.log(JSON.stringify(results, null, 2));

    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export default main;
