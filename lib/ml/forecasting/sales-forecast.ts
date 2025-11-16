import { supabase } from '@/lib/supabase/client';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface TimeSeriesDataPoint {
  date: Date;
  value: number;
}

export interface ForecastResult {
  date: Date;
  predicted: number;
  lower: number; // Lower confidence interval (95%)
  upper: number; // Upper confidence interval (95%)
  trend: number;
  seasonal: number;
  residual: number;
}

export interface SeasonalDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
}

export interface ARIMAParameters {
  p: number; // AR order
  d: number; // Differencing order
  q: number; // MA order
}

export interface ForecastMetrics {
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  r2: number; // R-squared
}

// ============================================
// TIME SERIES DATA COLLECTION
// ============================================

/**
 * Fetch historical sales data aggregated by day
 */
export async function fetchDailySalesData(daysBack: number = 180): Promise<TimeSeriesDataPoint[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, total, status')
      .gte('created_at', startDate.toISOString())
      .in('status', ['completed', 'delivered', 'paid']);

    if (error) throw error;

    // Group by date and sum totals
    const dailySales = new Map<string, number>();

    orders?.forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      dailySales.set(date, (dailySales.get(date) || 0) + order.total);
    });

    // Fill missing dates with 0
    const result: TimeSeriesDataPoint[] = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: new Date(currentDate),
        value: dailySales.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  } catch (error) {
    console.error('Error fetching daily sales data:', error);
    return [];
  }
}

/**
 * Fetch sales data aggregated by week
 */
export async function fetchWeeklySalesData(weeksBack: number = 52): Promise<TimeSeriesDataPoint[]> {
  try {
    const dailyData = await fetchDailySalesData(weeksBack * 7);
    const weeklyData: TimeSeriesDataPoint[] = [];

    for (let i = 0; i < dailyData.length; i += 7) {
      const weekData = dailyData.slice(i, i + 7);
      const weekTotal = weekData.reduce((sum, day) => sum + day.value, 0);

      weeklyData.push({
        date: weekData[0].date,
        value: weekTotal,
      });
    }

    return weeklyData;
  } catch (error) {
    console.error('Error fetching weekly sales data:', error);
    return [];
  }
}

// ============================================
// STATISTICAL FUNCTIONS
// ============================================

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(NaN);
    } else {
      const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / window);
    }
  }

  return result;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(data: number[], alpha: number = 0.3): number[] {
  const result: number[] = [];
  let ema = data[0];

  result.push(ema);

  for (let i = 1; i < data.length; i++) {
    ema = alpha * data[i] + (1 - alpha) * ema;
    result.push(ema);
  }

  return result;
}

/**
 * Calculate differences (for stationarity)
 */
export function calculateDifferences(data: number[], order: number = 1): number[] {
  let result = [...data];

  for (let d = 0; d < order; d++) {
    const diff: number[] = [];
    for (let i = 1; i < result.length; i++) {
      diff.push(result[i] - result[i - 1]);
    }
    result = diff;
  }

  return result;
}

/**
 * Calculate autocorrelation for a given lag
 */
export function calculateAutocorrelation(data: number[], lag: number): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n - lag; i++) {
    numerator += (data[i] - mean) * (data[i + lag] - mean);
  }

  for (let i = 0; i < n; i++) {
    denominator += Math.pow(data[i] - mean, 2);
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

// ============================================
// SEASONAL DECOMPOSITION
// ============================================

/**
 * Perform seasonal decomposition using moving averages
 * @param data Time series data
 * @param seasonalPeriod Period of seasonality (e.g., 7 for weekly, 30 for monthly)
 */
export function seasonalDecomposition(
  data: number[],
  seasonalPeriod: number = 7
): SeasonalDecomposition {
  const n = data.length;

  // 1. Calculate trend using centered moving average
  const trend: number[] = new Array(n).fill(0);
  const halfWindow = Math.floor(seasonalPeriod / 2);

  for (let i = halfWindow; i < n - halfWindow; i++) {
    let sum = 0;
    for (let j = i - halfWindow; j <= i + halfWindow; j++) {
      sum += data[j];
    }
    trend[i] = sum / seasonalPeriod;
  }

  // Extrapolate trend for edges using linear regression
  const validTrendIndices = [];
  const validTrendValues = [];
  for (let i = 0; i < n; i++) {
    if (trend[i] !== 0) {
      validTrendIndices.push(i);
      validTrendValues.push(trend[i]);
    }
  }

  // Simple linear extrapolation for first and last points
  if (validTrendIndices.length > 0) {
    const firstValidIdx = validTrendIndices[0];
    const lastValidIdx = validTrendIndices[validTrendIndices.length - 1];

    for (let i = 0; i < firstValidIdx; i++) {
      trend[i] = validTrendValues[0];
    }
    for (let i = lastValidIdx + 1; i < n; i++) {
      trend[i] = validTrendValues[validTrendValues.length - 1];
    }
  }

  // 2. Detrend the data
  const detrended = data.map((val, i) => (trend[i] !== 0 ? val - trend[i] : 0));

  // 3. Calculate seasonal component by averaging each seasonal position
  const seasonal: number[] = new Array(n).fill(0);
  const seasonalAverages: number[] = new Array(seasonalPeriod).fill(0);
  const seasonalCounts: number[] = new Array(seasonalPeriod).fill(0);

  for (let i = 0; i < n; i++) {
    const seasonalIndex = i % seasonalPeriod;
    seasonalAverages[seasonalIndex] += detrended[i];
    seasonalCounts[seasonalIndex]++;
  }

  for (let i = 0; i < seasonalPeriod; i++) {
    if (seasonalCounts[i] > 0) {
      seasonalAverages[i] /= seasonalCounts[i];
    }
  }

  // Center seasonal component (sum to 0)
  const seasonalMean = seasonalAverages.reduce((a, b) => a + b, 0) / seasonalPeriod;
  for (let i = 0; i < seasonalPeriod; i++) {
    seasonalAverages[i] -= seasonalMean;
  }

  // Assign seasonal values to all points
  for (let i = 0; i < n; i++) {
    seasonal[i] = seasonalAverages[i % seasonalPeriod];
  }

  // 4. Calculate residual
  const residual = data.map((val, i) => val - trend[i] - seasonal[i]);

  return { trend, seasonal, residual };
}

// ============================================
// ARIMA-LIKE FORECASTING
// ============================================

/**
 * Simple Auto-Regressive (AR) model
 */
export function fitARModel(data: number[], order: number = 3): number[] {
  const n = data.length;
  const coefficients: number[] = [];

  // Simple least squares estimation for AR coefficients
  for (let p = 1; p <= order; p++) {
    let sumXY = 0;
    let sumX2 = 0;

    for (let i = p; i < n; i++) {
      sumXY += data[i] * data[i - p];
      sumX2 += data[i - p] * data[i - p];
    }

    coefficients.push(sumX2 !== 0 ? sumXY / sumX2 : 0);
  }

  return coefficients;
}

/**
 * Predict next value using AR model
 */
export function predictAR(data: number[], coefficients: number[]): number {
  let prediction = 0;
  const order = Math.min(coefficients.length, data.length);

  for (let i = 0; i < order; i++) {
    prediction += coefficients[i] * data[data.length - 1 - i];
  }

  return prediction;
}

/**
 * Forecast using ARIMA-like approach
 */
export function arimaForecast(
  data: number[],
  params: ARIMAParameters,
  steps: number = 30
): number[] {
  const { p, d, q } = params;

  // 1. Difference the data to make it stationary
  let differenced = calculateDifferences(data, d);

  // 2. Fit AR model on differenced data
  const arCoefficients = fitARModel(differenced, p);

  // 3. Forecast differenced series
  const forecastDiff: number[] = [];
  let currentSeries = [...differenced];

  for (let i = 0; i < steps; i++) {
    const prediction = predictAR(currentSeries, arCoefficients);
    forecastDiff.push(prediction);
    currentSeries.push(prediction);
  }

  // 4. Integrate back to original scale
  let forecast = [...forecastDiff];

  for (let i = 0; i < d; i++) {
    const integrated: number[] = [];
    let lastValue = data[data.length - 1];

    for (let j = 0; j < forecast.length; j++) {
      lastValue = lastValue + forecast[j];
      integrated.push(lastValue);
    }

    forecast = integrated;
  }

  return forecast;
}

// ============================================
// MAIN FORECASTING FUNCTION
// ============================================

/**
 * Generate sales forecast with confidence intervals
 */
export async function forecastSales(
  daysToForecast: number = 30,
  historicalDays: number = 180
): Promise<ForecastResult[]> {
  try {
    // Fetch historical data
    const historicalData = await fetchDailySalesData(historicalDays);
    const values = historicalData.map(d => d.value);

    if (values.length === 0) {
      throw new Error('No historical data available');
    }

    // Perform seasonal decomposition
    const decomposition = seasonalDecomposition(values, 7); // Weekly seasonality

    // Forecast trend using ARIMA
    const trendForecast = arimaForecast(
      decomposition.trend,
      { p: 3, d: 1, q: 0 },
      daysToForecast
    );

    // Extend seasonal pattern
    const seasonalForecast: number[] = [];
    for (let i = 0; i < daysToForecast; i++) {
      const seasonalIndex = (values.length + i) % 7;
      seasonalForecast.push(decomposition.seasonal[seasonalIndex]);
    }

    // Calculate prediction intervals using residual standard deviation
    const residualStd = Math.sqrt(
      decomposition.residual.reduce((sum, r) => sum + r * r, 0) / decomposition.residual.length
    );

    // Build forecast results
    const forecast: ForecastResult[] = [];
    const lastDate = historicalData[historicalData.length - 1].date;

    for (let i = 0; i < daysToForecast; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i + 1);

      const trend = trendForecast[i];
      const seasonal = seasonalForecast[i];
      const predicted = Math.max(0, trend + seasonal);

      // 95% confidence interval (1.96 * std)
      const margin = 1.96 * residualStd * Math.sqrt(i + 1);

      forecast.push({
        date: forecastDate,
        predicted,
        lower: Math.max(0, predicted - margin),
        upper: predicted + margin,
        trend,
        seasonal,
        residual: 0,
      });
    }

    return forecast;
  } catch (error) {
    console.error('Error forecasting sales:', error);
    return [];
  }
}

/**
 * Forecast sales for specific period (30/90 days)
 */
export async function forecastSalesPeriod(
  period: 30 | 90 = 30
): Promise<{
  forecast: ForecastResult[];
  summary: {
    totalPredicted: number;
    avgDaily: number;
    confidence95Range: { min: number; max: number };
    trend: 'increasing' | 'decreasing' | 'stable';
  };
}> {
  try {
    const forecast = await forecastSales(period);

    const totalPredicted = forecast.reduce((sum, f) => sum + f.predicted, 0);
    const avgDaily = totalPredicted / forecast.length;

    const totalLower = forecast.reduce((sum, f) => sum + f.lower, 0);
    const totalUpper = forecast.reduce((sum, f) => sum + f.upper, 0);

    // Determine trend
    const firstWeekAvg = forecast.slice(0, 7).reduce((sum, f) => sum + f.predicted, 0) / 7;
    const lastWeekAvg =
      forecast.slice(-7).reduce((sum, f) => sum + f.predicted, 0) / 7;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const trendDiff = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;

    if (trendDiff > 5) trend = 'increasing';
    else if (trendDiff < -5) trend = 'decreasing';

    return {
      forecast,
      summary: {
        totalPredicted: Math.round(totalPredicted * 100) / 100,
        avgDaily: Math.round(avgDaily * 100) / 100,
        confidence95Range: {
          min: Math.round(totalLower * 100) / 100,
          max: Math.round(totalUpper * 100) / 100,
        },
        trend,
      },
    };
  } catch (error) {
    console.error('Error in forecast sales period:', error);
    throw error;
  }
}

// ============================================
// PRODUCT-SPECIFIC FORECASTING
// ============================================

/**
 * Forecast demand for specific product
 */
export async function forecastProductDemand(
  productId: string,
  daysToForecast: number = 30
): Promise<ForecastResult[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180);

    // Fetch product order history
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('created_at, quantity')
      .eq('product_id', productId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Group by date
    const dailyDemand = new Map<string, number>();

    orderItems?.forEach((item: any) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      dailyDemand.set(date, (dailyDemand.get(date) || 0) + item.quantity);
    });

    // Fill missing dates
    const values: number[] = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      values.push(dailyDemand.get(dateStr) || 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (values.length === 0) {
      return [];
    }

    // Perform decomposition and forecast
    const decomposition = seasonalDecomposition(values, 7);
    const trendForecast = arimaForecast(decomposition.trend, { p: 2, d: 1, q: 0 }, daysToForecast);

    const forecast: ForecastResult[] = [];
    const lastDate = new Date(today);

    for (let i = 0; i < daysToForecast; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i + 1);

      const seasonalIndex = (values.length + i) % 7;
      const trend = trendForecast[i];
      const seasonal = decomposition.seasonal[seasonalIndex];
      const predicted = Math.max(0, Math.round(trend + seasonal));

      const residualStd = Math.sqrt(
        decomposition.residual.reduce((sum, r) => sum + r * r, 0) / decomposition.residual.length
      );
      const margin = 1.96 * residualStd * Math.sqrt(i + 1);

      forecast.push({
        date: forecastDate,
        predicted,
        lower: Math.max(0, Math.round(predicted - margin)),
        upper: Math.round(predicted + margin),
        trend,
        seasonal,
        residual: 0,
      });
    }

    return forecast;
  } catch (error) {
    console.error('Error forecasting product demand:', error);
    return [];
  }
}

// ============================================
// FORECAST EVALUATION
// ============================================

/**
 * Calculate forecast accuracy metrics
 */
export function calculateForecastMetrics(
  actual: number[],
  predicted: number[]
): ForecastMetrics {
  const n = Math.min(actual.length, predicted.length);

  let mae = 0;
  let mse = 0;
  let mape = 0;

  for (let i = 0; i < n; i++) {
    const error = actual[i] - predicted[i];
    mae += Math.abs(error);
    mse += error * error;
    if (actual[i] !== 0) {
      mape += Math.abs(error / actual[i]);
    }
  }

  mae /= n;
  mse /= n;
  mape = (mape / n) * 100;

  const rmse = Math.sqrt(mse);

  // Calculate R-squared
  const actualMean = actual.reduce((a, b) => a + b, 0) / n;
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    ssRes += Math.pow(actual[i] - predicted[i], 2);
    ssTot += Math.pow(actual[i] - actualMean, 2);
  }

  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { mae, mse, rmse, mape, r2 };
}

/**
 * Store forecast results in database
 */
export async function storeForecast(
  forecastType: 'sales' | 'product',
  forecast: ForecastResult[],
  metadata: {
    productId?: string;
    historicalDays: number;
    algorithm: string;
    metrics?: ForecastMetrics;
  }
): Promise<boolean> {
  try {
    const record = {
      forecast_type: forecastType,
      product_id: metadata.productId,
      forecast_data: JSON.stringify(forecast),
      historical_days: metadata.historicalDays,
      algorithm: metadata.algorithm,
      metrics: metadata.metrics ? JSON.stringify(metadata.metrics) : null,
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const { error } = await supabase.from('ml_forecast_results').insert(record);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error storing forecast:', error);
    return false;
  }
}

// Export all functions
export default {
  forecastSales,
  forecastSalesPeriod,
  forecastProductDemand,
  seasonalDecomposition,
  calculateForecastMetrics,
  storeForecast,
};
