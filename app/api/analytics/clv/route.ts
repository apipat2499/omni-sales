/**
 * Customer Lifetime Value (CLV) API
 *
 * Provides CLV analysis and predictions for customers.
 * Helps identify high-value customers and predict future revenue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCache, setCache } from '@/lib/cache/manager';

export const dynamic = 'force-dynamic';

interface CLVMetrics {
  totalCustomers: number;
  avgHistoricalCLV: number;
  avgPredictedCLV: number;
  totalHistoricalValue: number;
  totalPredictedValue: number;
  topCustomers: any[];
  clvDistribution: {
    range: string;
    customers: number;
    totalValue: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topN = parseInt(searchParams.get('topN') || '10');
    const segment = searchParams.get('segment');
    const useCache = searchParams.get('cache') !== 'false';

    // Check cache
    const cacheKey = `clv:${topN}:${segment}`;
    if (useCache) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const supabase = await createClient();

    // Base query
    let query = supabase
      .from('customer_analytics_view')
      .select('*')
      .not('total_orders', 'is', null);

    if (segment) {
      query = query.eq('customer_segment', segment);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('CLV analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch CLV analysis' },
        { status: 500 }
      );
    }

    const customerList = customers || [];

    // Calculate metrics
    const metrics: CLVMetrics = {
      totalCustomers: customerList.length,
      avgHistoricalCLV: customerList.reduce((sum, c) => sum + (c.customer_lifetime_value || 0), 0) / customerList.length,
      avgPredictedCLV: customerList.reduce((sum, c) => sum + (c.predicted_lifetime_value || 0), 0) / customerList.length,
      totalHistoricalValue: customerList.reduce((sum, c) => sum + (c.customer_lifetime_value || 0), 0),
      totalPredictedValue: customerList.reduce((sum, c) => sum + (c.predicted_lifetime_value || 0), 0),
      topCustomers: customerList
        .sort((a, b) => (b.predicted_lifetime_value || 0) - (a.predicted_lifetime_value || 0))
        .slice(0, topN)
        .map(c => ({
          customerId: c.customer_id,
          name: c.name,
          email: c.email,
          historicalCLV: c.customer_lifetime_value || 0,
          predictedCLV: c.predicted_lifetime_value || 0,
          totalOrders: c.total_orders || 0,
          totalSpent: c.total_spent || 0,
          avgOrderValue: c.avg_order_value || 0,
          segment: c.customer_segment
        })),
      clvDistribution: calculateCLVDistribution(customerList)
    };

    const response = {
      success: true,
      data: metrics,
      metadata: {
        segment,
        topN
      }
    };

    // Cache for 6 hours
    if (useCache) {
      await setCache(cacheKey, response, 21600);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('CLV analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate CLV distribution by ranges
 */
function calculateCLVDistribution(customers: any[]): {
  range: string;
  customers: number;
  totalValue: number;
}[] {
  const ranges = [
    { min: 0, max: 100, label: '$0-$100' },
    { min: 100, max: 500, label: '$100-$500' },
    { min: 500, max: 1000, label: '$500-$1K' },
    { min: 1000, max: 5000, label: '$1K-$5K' },
    { min: 5000, max: 10000, label: '$5K-$10K' },
    { min: 10000, max: Infinity, label: '$10K+' }
  ];

  return ranges.map(range => {
    const customersInRange = customers.filter(c => {
      const clv = c.predicted_lifetime_value || 0;
      return clv >= range.min && clv < range.max;
    });

    return {
      range: range.label,
      customers: customersInRange.length,
      totalValue: customersInRange.reduce((sum, c) => sum + (c.predicted_lifetime_value || 0), 0)
    };
  });
}

/**
 * POST endpoint to calculate CLV for specific customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: customer, error } = await supabase
      .from('customer_analytics_view')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (error) {
      console.error('Customer CLV fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customer CLV' },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate detailed CLV breakdown
    const clvBreakdown = {
      customerId: customer.customer_id,
      name: customer.name,
      email: customer.email,
      segment: customer.customer_segment,
      historicalMetrics: {
        totalOrders: customer.total_orders || 0,
        totalSpent: customer.total_spent || 0,
        avgOrderValue: customer.avg_order_value || 0,
        customerLifetimeValue: customer.customer_lifetime_value || 0,
        customerAgeDays: customer.customer_age_days || 0
      },
      predictiveMetrics: {
        predictedCLV: customer.predicted_lifetime_value || 0,
        estimatedOrdersPerYear: customer.total_orders && customer.customer_age_days
          ? (customer.total_orders / (customer.customer_age_days / 365))
          : 0,
        projectedRevenue3Years: customer.predicted_lifetime_value || 0,
        confidenceScore: calculateConfidenceScore(customer)
      },
      rfmMetrics: {
        recencyScore: customer.recency_score || 0,
        frequencyScore: customer.frequency_score || 0,
        monetaryScore: customer.monetary_score || 0,
        rfmSegment: customer.rfm_segment,
        daysSinceLastOrder: customer.days_since_last_order || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: clvBreakdown
    });
  } catch (error) {
    console.error('Customer CLV error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate confidence score for CLV prediction
 */
function calculateConfidenceScore(customer: any): number {
  let score = 0;

  // More orders = higher confidence
  if (customer.total_orders >= 10) score += 30;
  else if (customer.total_orders >= 5) score += 20;
  else if (customer.total_orders >= 2) score += 10;

  // Longer customer history = higher confidence
  if (customer.customer_age_days >= 365) score += 30;
  else if (customer.customer_age_days >= 180) score += 20;
  else if (customer.customer_age_days >= 90) score += 10;

  // Recent activity = higher confidence
  if (customer.days_since_last_order <= 30) score += 20;
  else if (customer.days_since_last_order <= 90) score += 10;

  // Consistent spending = higher confidence
  if (customer.total_orders > 1 && customer.avg_order_value > 0) {
    score += 20;
  }

  return Math.min(score, 100);
}
