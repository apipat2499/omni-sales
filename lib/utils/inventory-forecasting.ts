/**
 * Inventory Forecasting Utility
 *
 * Implements multiple forecasting algorithms for demand prediction:
 * - Simple Moving Average (SMA)
 * - Exponential Smoothing
 * - Seasonal Decomposition
 * - Linear Regression
 * - Hybrid Approach
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DemandHistory {
  date: Date;
  quantity: number;
  revenue: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface Forecast {
  productId: string;
  dates: Date[];
  forecast: number[];
  confidence: {
    lower: number[];
    upper: number[];
  };
  algorithm: 'sma' | 'exponential' | 'seasonal' | 'linear' | 'hybrid';
  accuracy: number;
  seasonality?: {
    detected: boolean;
    period: number;
    factors: number[];
    strength: number;
  };
  metrics?: {
    mape: number;
    mae: number;
    rmse: number;
    r2?: number;
  };
}

export interface SeasonalityInfo {
  detected: boolean;
  period: number;
  strength: number;
  factors: number[];
}

export interface AlgorithmComparison {
  algorithm: 'sma' | 'exponential' | 'seasonal' | 'linear';
  mape: number;
  mae: number;
  rmse: number;
  r2: number;
  recommended: boolean;
}

export interface ForecastSettings {
  algorithm?: 'sma' | 'exponential' | 'seasonal' | 'linear' | 'hybrid';
  periods?: number;
  confidenceLevel?: number;
  smoothingFactor?: number;
  smaWindow?: number;
  minSeasonalPeriod?: number;
  maxSeasonalPeriod?: number;
}

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Calculate mean (average) of an array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate Z-score for confidence interval
 */
function getZScore(confidenceLevel: number): number {
  const zScores: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  return zScores[confidenceLevel] || 1.96;
}

/**
 * Calculate Mean Absolute Percentage Error (MAPE)
 */
export function calculateMAPE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 100;

  let sum = 0;
  let count = 0;

  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      count++;
    }
  }

  return count > 0 ? (sum / count) * 100 : 100;
}

/**
 * Calculate Mean Absolute Error (MAE)
 */
export function calculateMAE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;

  const errors = actual.map((val, i) => Math.abs(val - predicted[i]));
  return mean(errors);
}

/**
 * Calculate Root Mean Square Error (RMSE)
 */
export function calculateRMSE(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;

  const squaredErrors = actual.map((val, i) => Math.pow(val - predicted[i], 2));
  return Math.sqrt(mean(squaredErrors));
}

/**
 * Calculate R-squared (coefficient of determination)
 */
export function calculateR2(actual: number[], predicted: number[]): number {
  if (actual.length !== predicted.length || actual.length === 0) return 0;

  const actualMean = mean(actual);
  const totalSS = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
  const residualSS = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);

  if (totalSS === 0) return 0;
  return 1 - (residualSS / totalSS);
}

// ============================================================================
// FORECASTING ALGORITHMS
// ============================================================================

/**
 * Simple Moving Average (SMA)
 * Good for stable demand patterns
 */
export function simpleMovingAverage(
  history: DemandHistory[],
  periods: number = 30,
  window: number = 7
): number[] {
  if (history.length < window) {
    // Not enough data, return average of all available
    const avg = mean(history.map(h => h.quantity));
    return new Array(periods).fill(avg);
  }

  const forecast: number[] = [];
  const quantities = history.map(h => h.quantity);

  for (let i = 0; i < periods; i++) {
    // Use last 'window' values for moving average
    const startIndex = Math.max(0, quantities.length - window + i);
    const endIndex = quantities.length + i;
    const windowValues = quantities.slice(startIndex, endIndex);

    if (windowValues.length === 0) {
      forecast.push(mean(quantities));
    } else {
      forecast.push(mean(windowValues));
    }
  }

  return forecast;
}

/**
 * Exponential Smoothing
 * Weights recent data more heavily, good for trending demand
 */
export function exponentialSmoothing(
  history: DemandHistory[],
  periods: number = 30,
  alpha: number = 0.3
): number[] {
  if (history.length === 0) return new Array(periods).fill(0);

  const quantities = history.map(h => h.quantity);

  // Initialize with first value
  let smoothed = quantities[0];

  // Apply exponential smoothing to historical data
  for (let i = 1; i < quantities.length; i++) {
    smoothed = alpha * quantities[i] + (1 - alpha) * smoothed;
  }

  // Forecast future periods (flat forecast)
  const forecast: number[] = new Array(periods).fill(smoothed);

  return forecast;
}

/**
 * Double Exponential Smoothing (Holt's Method)
 * Handles trend in data
 */
export function doubleExponentialSmoothing(
  history: DemandHistory[],
  periods: number = 30,
  alpha: number = 0.3,
  beta: number = 0.1
): number[] {
  if (history.length < 2) {
    return exponentialSmoothing(history, periods, alpha);
  }

  const quantities = history.map(h => h.quantity);

  // Initialize level and trend
  let level = quantities[0];
  let trend = quantities[1] - quantities[0];

  // Apply double exponential smoothing
  for (let i = 1; i < quantities.length; i++) {
    const prevLevel = level;
    level = alpha * quantities[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Forecast future periods
  const forecast: number[] = [];
  for (let i = 1; i <= periods; i++) {
    forecast.push(Math.max(0, level + i * trend));
  }

  return forecast;
}

/**
 * Linear Regression
 * Fits a trend line to the data
 */
export function linearRegression(
  history: DemandHistory[],
  periods: number = 30
): { forecast: number[]; r2: number } {
  if (history.length < 2) {
    const avg = history.length > 0 ? history[0].quantity : 0;
    return {
      forecast: new Array(periods).fill(avg),
      r2: 0,
    };
  }

  const n = history.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = history.map(h => h.quantity);

  // Calculate slope and intercept
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const predicted = x.map(xi => slope * xi + intercept);
  const r2 = calculateR2(y, predicted);

  // Forecast future periods
  const forecast: number[] = [];
  for (let i = 0; i < periods; i++) {
    const futureX = n + i;
    forecast.push(Math.max(0, slope * futureX + intercept));
  }

  return { forecast, r2 };
}

/**
 * Detect seasonality in time series data
 */
export function detectSeasonality(
  history: DemandHistory[],
  minPeriod: number = 7,
  maxPeriod: number = 365
): SeasonalityInfo {
  if (history.length < minPeriod * 2) {
    return {
      detected: false,
      period: 0,
      strength: 0,
      factors: [],
    };
  }

  const quantities = history.map(h => h.quantity);
  let bestPeriod = 0;
  let bestStrength = 0;

  // Test different periods
  const maxTestPeriod = Math.min(maxPeriod, Math.floor(history.length / 2));

  for (let period = minPeriod; period <= maxTestPeriod; period++) {
    // Calculate autocorrelation at this lag
    const cycles = Math.floor(quantities.length / period);
    if (cycles < 2) continue;

    let sum = 0;
    let count = 0;

    for (let i = 0; i < quantities.length - period; i++) {
      sum += quantities[i] * quantities[i + period];
      count++;
    }

    const autocorr = count > 0 ? sum / count : 0;
    const strength = Math.abs(autocorr / (mean(quantities) * mean(quantities)));

    if (strength > bestStrength) {
      bestStrength = strength;
      bestPeriod = period;
    }
  }

  // Consider seasonality detected if strength > threshold
  const detected = bestStrength > 0.3;

  // Calculate seasonal factors if detected
  let factors: number[] = [];
  if (detected && bestPeriod > 0) {
    factors = calculateSeasonalFactors(quantities, bestPeriod);
  }

  return {
    detected,
    period: bestPeriod,
    strength: bestStrength,
    factors,
  };
}

/**
 * Calculate seasonal factors for a given period
 */
function calculateSeasonalFactors(data: number[], period: number): number[] {
  const cycles = Math.floor(data.length / period);
  const factors: number[] = new Array(period).fill(0);
  const counts: number[] = new Array(period).fill(0);

  // Average values for each position in the cycle
  for (let i = 0; i < data.length; i++) {
    const position = i % period;
    factors[position] += data[i];
    counts[position]++;
  }

  for (let i = 0; i < period; i++) {
    factors[i] = counts[i] > 0 ? factors[i] / counts[i] : 1;
  }

  // Normalize factors to average 1.0
  const avgFactor = mean(factors);
  if (avgFactor > 0) {
    for (let i = 0; i < period; i++) {
      factors[i] /= avgFactor;
    }
  }

  return factors;
}

/**
 * Seasonal Decomposition Forecast
 * Separates trend, seasonal, and residual components
 */
export function seasonalDecomposition(
  history: DemandHistory[],
  periods: number = 30,
  seasonalPeriod?: number
): { forecast: number[]; seasonality: SeasonalityInfo } {
  if (history.length < 14) {
    return {
      forecast: simpleMovingAverage(history, periods),
      seasonality: {
        detected: false,
        period: 0,
        strength: 0,
        factors: [],
      },
    };
  }

  // Detect seasonality if not provided
  const seasonality = seasonalPeriod
    ? {
        detected: true,
        period: seasonalPeriod,
        strength: 1,
        factors: calculateSeasonalFactors(
          history.map(h => h.quantity),
          seasonalPeriod
        ),
      }
    : detectSeasonality(history);

  if (!seasonality.detected || seasonality.period === 0) {
    // No seasonality, use double exponential smoothing for trend
    return {
      forecast: doubleExponentialSmoothing(history, periods),
      seasonality,
    };
  }

  // Get trend using double exponential smoothing
  const trendForecast = doubleExponentialSmoothing(history, periods);

  // Apply seasonal factors
  const forecast: number[] = [];
  for (let i = 0; i < periods; i++) {
    const seasonalIndex = i % seasonality.period;
    const factor = seasonality.factors[seasonalIndex] || 1;
    forecast.push(Math.max(0, trendForecast[i] * factor));
  }

  return { forecast, seasonality };
}

/**
 * Hybrid Approach
 * Combines multiple algorithms weighted by their accuracy
 */
export function hybridForecast(
  history: DemandHistory[],
  periods: number = 30
): { forecast: number[]; bestAlgorithm: string; comparisons: AlgorithmComparison[] } {
  if (history.length < 7) {
    // Not enough data, use simple average
    const avg = mean(history.map(h => h.quantity));
    return {
      forecast: new Array(periods).fill(avg),
      bestAlgorithm: 'sma',
      comparisons: [],
    };
  }

  // Split data for validation (80/20 split)
  const splitIndex = Math.floor(history.length * 0.8);
  const trainData = history.slice(0, splitIndex);
  const testData = history.slice(splitIndex);
  const testActual = testData.map(h => h.quantity);
  const testPeriods = testData.length;

  if (trainData.length < 5 || testData.length < 2) {
    // Not enough data to validate, use double exponential smoothing
    return {
      forecast: doubleExponentialSmoothing(history, periods),
      bestAlgorithm: 'exponential',
      comparisons: [],
    };
  }

  // Test each algorithm
  const algorithms: AlgorithmComparison[] = [];

  // SMA
  const smaPredicted = simpleMovingAverage(trainData, testPeriods);
  algorithms.push({
    algorithm: 'sma',
    mape: calculateMAPE(testActual, smaPredicted),
    mae: calculateMAE(testActual, smaPredicted),
    rmse: calculateRMSE(testActual, smaPredicted),
    r2: calculateR2(testActual, smaPredicted),
    recommended: false,
  });

  // Exponential Smoothing
  const expPredicted = doubleExponentialSmoothing(trainData, testPeriods);
  algorithms.push({
    algorithm: 'exponential',
    mape: calculateMAPE(testActual, expPredicted),
    mae: calculateMAE(testActual, expPredicted),
    rmse: calculateRMSE(testActual, expPredicted),
    r2: calculateR2(testActual, expPredicted),
    recommended: false,
  });

  // Linear Regression
  const linearResult = linearRegression(trainData, testPeriods);
  algorithms.push({
    algorithm: 'linear',
    mape: calculateMAPE(testActual, linearResult.forecast),
    mae: calculateMAE(testActual, linearResult.forecast),
    rmse: calculateRMSE(testActual, linearResult.forecast),
    r2: linearResult.r2,
    recommended: false,
  });

  // Seasonal Decomposition
  const seasonalResult = seasonalDecomposition(trainData, testPeriods);
  algorithms.push({
    algorithm: 'seasonal',
    mape: calculateMAPE(testActual, seasonalResult.forecast),
    mae: calculateMAE(testActual, seasonalResult.forecast),
    rmse: calculateRMSE(testActual, seasonalResult.forecast),
    r2: calculateR2(testActual, seasonalResult.forecast),
    recommended: false,
  });

  // Find best algorithm based on lowest MAPE
  let bestIndex = 0;
  let lowestMAPE = algorithms[0].mape;

  for (let i = 1; i < algorithms.length; i++) {
    if (algorithms[i].mape < lowestMAPE) {
      lowestMAPE = algorithms[i].mape;
      bestIndex = i;
    }
  }

  algorithms[bestIndex].recommended = true;

  // Generate final forecast using best algorithm
  let finalForecast: number[];
  const bestAlgorithm = algorithms[bestIndex].algorithm;

  switch (bestAlgorithm) {
    case 'sma':
      finalForecast = simpleMovingAverage(history, periods);
      break;
    case 'exponential':
      finalForecast = doubleExponentialSmoothing(history, periods);
      break;
    case 'linear':
      finalForecast = linearRegression(history, periods).forecast;
      break;
    case 'seasonal':
      finalForecast = seasonalDecomposition(history, periods).forecast;
      break;
    default:
      finalForecast = doubleExponentialSmoothing(history, periods);
  }

  return {
    forecast: finalForecast,
    bestAlgorithm,
    comparisons: algorithms,
  };
}

// ============================================================================
// MAIN FORECAST FUNCTION
// ============================================================================

/**
 * Calculate forecast for a product
 */
export async function calculateForecast(
  productId: string,
  history: DemandHistory[],
  settings: ForecastSettings = {}
): Promise<Forecast> {
  const {
    algorithm = 'hybrid',
    periods = 30,
    confidenceLevel = 0.95,
    smoothingFactor = 0.3,
    smaWindow = 7,
  } = settings;

  // Generate dates for forecast
  const lastDate = history.length > 0 ? history[history.length - 1].date : new Date();
  const dates: Date[] = [];
  for (let i = 1; i <= periods; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }

  let forecast: number[] = [];
  let seasonality: SeasonalityInfo | undefined;
  let metrics: any = {};
  let finalAlgorithm = algorithm;

  // Calculate forecast based on selected algorithm
  if (algorithm === 'hybrid') {
    const result = hybridForecast(history, periods);
    forecast = result.forecast;
    finalAlgorithm = result.bestAlgorithm as any;

    // Calculate metrics using best algorithm comparison
    const bestComp = result.comparisons.find(c => c.recommended);
    if (bestComp) {
      metrics = {
        mape: bestComp.mape,
        mae: bestComp.mae,
        rmse: bestComp.rmse,
        r2: bestComp.r2,
      };
    }
  } else if (algorithm === 'sma') {
    forecast = simpleMovingAverage(history, periods, smaWindow);
  } else if (algorithm === 'exponential') {
    forecast = doubleExponentialSmoothing(history, periods, smoothingFactor);
  } else if (algorithm === 'linear') {
    const result = linearRegression(history, periods);
    forecast = result.forecast;
    metrics.r2 = result.r2;
  } else if (algorithm === 'seasonal') {
    const result = seasonalDecomposition(history, periods);
    forecast = result.forecast;
    seasonality = result.seasonality;
  }

  // Calculate confidence intervals
  const historicalQuantities = history.map(h => h.quantity);
  const stdDev = standardDeviation(historicalQuantities);
  const zScore = getZScore(confidenceLevel);
  const margin = zScore * stdDev;

  const lower = forecast.map(f => Math.max(0, f - margin));
  const upper = forecast.map(f => f + margin);

  // Calculate accuracy if not already calculated
  if (!metrics.mape && history.length >= 14) {
    const splitIndex = Math.floor(history.length * 0.8);
    const trainData = history.slice(0, splitIndex);
    const testData = history.slice(splitIndex);
    const testActual = testData.map(h => h.quantity);

    let testForecast: number[] = [];
    if (algorithm === 'sma') {
      testForecast = simpleMovingAverage(trainData, testData.length, smaWindow);
    } else if (algorithm === 'exponential') {
      testForecast = doubleExponentialSmoothing(trainData, testData.length, smoothingFactor);
    } else if (algorithm === 'linear') {
      testForecast = linearRegression(trainData, testData.length).forecast;
    } else if (algorithm === 'seasonal') {
      testForecast = seasonalDecomposition(trainData, testData.length).forecast;
    }

    metrics.mape = calculateMAPE(testActual, testForecast);
    metrics.mae = calculateMAE(testActual, testForecast);
    metrics.rmse = calculateRMSE(testActual, testForecast);
  }

  // Calculate accuracy score (0-1, higher is better)
  const accuracy = metrics.mape !== undefined ? Math.max(0, 1 - metrics.mape / 100) : 0.5;

  return {
    productId,
    dates,
    forecast,
    confidence: {
      lower,
      upper,
    },
    algorithm: finalAlgorithm as any,
    accuracy,
    seasonality,
    metrics,
  };
}

/**
 * Get trend direction based on historical data
 */
export function analyzeTrend(history: DemandHistory[]): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable';

  const recent = history.slice(-7); // Last 7 days
  const previous = history.slice(-14, -7); // Previous 7 days

  if (recent.length === 0 || previous.length === 0) return 'stable';

  const recentAvg = mean(recent.map(h => h.quantity));
  const previousAvg = mean(previous.map(h => h.quantity));

  const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

  if (changePercent > 10) return 'up';
  if (changePercent < -10) return 'down';
  return 'stable';
}

/**
 * Compare different forecasting algorithms
 */
export function compareAlgorithms(history: DemandHistory[]): AlgorithmComparison[] {
  const result = hybridForecast(history, 7);
  return result.comparisons;
}

/**
 * Generate forecast chart data
 */
export function getForecastChartData(
  forecast: Forecast,
  history: DemandHistory[],
  days: number = 60
): Array<{
  date: string;
  actual?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}> {
  const chartData: Array<{
    date: string;
    actual?: number;
    forecast?: number;
    lower?: number;
    upper?: number;
  }> = [];

  // Add historical data
  const recentHistory = history.slice(-days);
  recentHistory.forEach(h => {
    chartData.push({
      date: h.date.toISOString().split('T')[0],
      actual: h.quantity,
    });
  });

  // Add forecast data
  forecast.dates.forEach((date, i) => {
    chartData.push({
      date: date.toISOString().split('T')[0],
      forecast: forecast.forecast[i],
      lower: forecast.confidence.lower[i],
      upper: forecast.confidence.upper[i],
    });
  });

  return chartData;
}
