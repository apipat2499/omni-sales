import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// Simple linear regression for forecasting
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function forecast(data: number[], periods: number): number[] {
  const { slope, intercept } = linearRegression(data);
  const forecasted: number[] = [];

  for (let i = 0; i < periods; i++) {
    const value = slope * (data.length + i) + intercept;
    forecasted.push(Math.max(0, value)); // Ensure non-negative
  }

  return forecasted;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30';
    const forecastDays = parseInt(searchParams.get('forecast') || '7');
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch historical orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const dailyRevenue: Record<string, number> = {};
    const dailyOrders: Record<string, number> = {};

    orders?.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(order.total);
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

    // Fill in missing dates with 0
    const dates: string[] = [];
    const revenueValues: number[] = [];
    const orderValues: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      revenueValues.push(dailyRevenue[dateStr] || 0);
      orderValues.push(dailyOrders[dateStr] || 0);
    }

    // Generate forecasts
    const forecastedRevenue = forecast(revenueValues, forecastDays);
    const forecastedOrders = forecast(orderValues, forecastDays);

    // Generate forecast dates
    const forecastDates: string[] = [];
    for (let i = 1; i <= forecastDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecastDates.push(date.toISOString().split('T')[0]);
    }

    // Calculate trends
    const { slope: revenueSlope } = linearRegression(revenueValues);
    const { slope: orderSlope } = linearRegression(orderValues);

    const revenueTrend = revenueSlope > 0 ? 'increasing' : revenueSlope < 0 ? 'decreasing' : 'stable';
    const orderTrend = orderSlope > 0 ? 'increasing' : orderSlope < 0 ? 'decreasing' : 'stable';

    return NextResponse.json({
      historical: {
        dates,
        revenue: revenueValues,
        orders: orderValues,
      },
      forecast: {
        dates: forecastDates,
        revenue: forecastedRevenue,
        orders: forecastedOrders,
      },
      trends: {
        revenue: revenueTrend,
        revenueSlope,
        orders: orderTrend,
        orderSlope,
      },
      projections: {
        nextWeekRevenue: forecastedRevenue.slice(0, 7).reduce((a, b) => a + b, 0),
        nextMonthRevenue: forecastedRevenue.reduce((a, b) => a + b, 0),
        nextWeekOrders: Math.round(forecastedOrders.slice(0, 7).reduce((a, b) => a + b, 0)),
        nextMonthOrders: Math.round(forecastedOrders.reduce((a, b) => a + b, 0)),
      },
    });
  } catch (error) {
    console.error('Error generating forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
