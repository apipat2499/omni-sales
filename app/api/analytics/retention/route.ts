/**
 * Retention Analysis API
 *
 * Provides retention curves, churn analysis, and customer retention metrics.
 * Helps understand customer stickiness and identify churn risk.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCache, setCache } from '@/lib/cache/cache-manager';

export const dynamic = 'force-dynamic';

interface RetentionMetrics {
  overallRetentionRate: number;
  churnRate: number;
  activeCustomers: number;
  churnedCustomers: number;
  atRiskCustomers: number;
  retentionByPeriod: {
    period: string;
    retentionRate: number;
    activeCustomers: number;
    churnedCustomers: number;
  }[];
  retentionCurve: {
    daysSinceFirstOrder: number;
    retentionRate: number;
    customers: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, quarter
    const churnDays = parseInt(searchParams.get('churnDays') || '90'); // Days without order = churned
    const useCache = searchParams.get('cache') !== 'false';

    // Check cache
    const cacheKey = `retention:${period}:${churnDays}`;
    if (useCache) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const supabase = await createClient();

    // Fetch customer data
    const { data: customers, error } = await supabase
      .from('customer_analytics_view')
      .select('*')
      .not('total_orders', 'is', null);

    if (error) {
      console.error('Retention analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch retention analysis' },
        { status: 500 }
      );
    }

    const customerList = customers || [];

    // Calculate retention metrics
    const metrics = calculateRetentionMetrics(customerList, churnDays, period);

    const response = {
      success: true,
      data: metrics,
      metadata: {
        period,
        churnDays,
        totalCustomers: customerList.length
      }
    };

    // Cache for 6 hours
    if (useCache) {
      await setCache(cacheKey, response, 21600);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Retention analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate comprehensive retention metrics
 */
function calculateRetentionMetrics(
  customers: any[],
  churnDays: number,
  period: string
): RetentionMetrics {
  // Categorize customers
  const activeCustomers = customers.filter(c => c.days_since_last_order <= churnDays);
  const churnedCustomers = customers.filter(c => c.days_since_last_order > churnDays);
  const atRiskCustomers = customers.filter(
    c => c.days_since_last_order > churnDays * 0.7 && c.days_since_last_order <= churnDays
  );

  const totalCustomers = customers.length;
  const overallRetentionRate = totalCustomers > 0
    ? (activeCustomers.length / totalCustomers) * 100
    : 0;
  const churnRate = 100 - overallRetentionRate;

  // Calculate retention by period
  const retentionByPeriod = calculateRetentionByPeriod(customers, churnDays, period);

  // Calculate retention curve (retention rate over time since first order)
  const retentionCurve = calculateRetentionCurve(customers, churnDays);

  return {
    overallRetentionRate,
    churnRate,
    activeCustomers: activeCustomers.length,
    churnedCustomers: churnedCustomers.length,
    atRiskCustomers: atRiskCustomers.length,
    retentionByPeriod,
    retentionCurve
  };
}

/**
 * Calculate retention by period
 */
function calculateRetentionByPeriod(
  customers: any[],
  churnDays: number,
  period: string
): {
  period: string;
  retentionRate: number;
  activeCustomers: number;
  churnedCustomers: number;
}[] {
  const periodMap = new Map<string, any[]>();

  customers.forEach(customer => {
    if (!customer.customer_since) return;

    const date = new Date(customer.customer_since);
    const periodKey = formatPeriod(date, period);

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, []);
    }
    periodMap.get(periodKey)!.push(customer);
  });

  return Array.from(periodMap.entries())
    .map(([periodKey, periodCustomers]) => {
      const active = periodCustomers.filter(c => c.days_since_last_order <= churnDays);
      const churned = periodCustomers.filter(c => c.days_since_last_order > churnDays);

      return {
        period: periodKey,
        retentionRate: periodCustomers.length > 0
          ? (active.length / periodCustomers.length) * 100
          : 0,
        activeCustomers: active.length,
        churnedCustomers: churned.length
      };
    })
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Calculate retention curve
 */
function calculateRetentionCurve(
  customers: any[],
  churnDays: number
): {
  daysSinceFirstOrder: number;
  retentionRate: number;
  customers: number;
}[] {
  // Group by customer age in days
  const ageBuckets = [0, 30, 60, 90, 180, 365, 730, 1095]; // 0, 1mo, 2mo, 3mo, 6mo, 1yr, 2yr, 3yr

  return ageBuckets.map(days => {
    const customersInBucket = customers.filter(c => c.customer_age_days >= days);
    const activeInBucket = customersInBucket.filter(c => c.days_since_last_order <= churnDays);

    return {
      daysSinceFirstOrder: days,
      retentionRate: customersInBucket.length > 0
        ? (activeInBucket.length / customersInBucket.length) * 100
        : 0,
      customers: customersInBucket.length
    };
  });
}

/**
 * Format period based on type
 */
function formatPeriod(date: Date, period: string): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  switch (period) {
    case 'day':
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    case 'week':
      const week = Math.ceil(day / 7);
      return `${year}-W${String(week).padStart(2, '0')}`;
    case 'quarter':
      const quarter = Math.floor(month / 3) + 1;
      return `${year}-Q${quarter}`;
    case 'month':
    default:
      return `${year}-${String(month + 1).padStart(2, '0')}`;
  }
}

/**
 * POST endpoint to get at-risk customers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { churnDays = 90, segment, limit = 100 } = body;

    const supabase = await createClient();

    let query = supabase
      .from('customer_analytics_view')
      .select('*')
      .gt('days_since_last_order', churnDays * 0.7)
      .lte('days_since_last_order', churnDays)
      .order('predicted_lifetime_value', { ascending: false })
      .limit(limit);

    if (segment) {
      query = query.eq('customer_segment', segment);
    }

    const { data, error } = await query;

    if (error) {
      console.error('At-risk customers fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch at-risk customers' },
        { status: 500 }
      );
    }

    const customers = (data || []).map(c => ({
      customerId: c.customer_id,
      name: c.name,
      email: c.email,
      segment: c.customer_segment,
      daysSinceLastOrder: c.days_since_last_order,
      totalSpent: c.total_spent,
      predictedCLV: c.predicted_lifetime_value,
      churnRisk: calculateChurnRisk(c, churnDays)
    }));

    return NextResponse.json({
      success: true,
      data: customers,
      metadata: {
        count: customers.length,
        churnDays,
        segment
      }
    });
  } catch (error) {
    console.error('At-risk customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate churn risk score (0-100)
 */
function calculateChurnRisk(customer: any, churnDays: number): number {
  let risk = 0;

  // Days since last order
  const daysSinceLastOrder = customer.days_since_last_order || 0;
  const daysFactor = Math.min(daysSinceLastOrder / churnDays, 1);
  risk += daysFactor * 50;

  // Low RFM scores
  const avgRFM = (
    (customer.recency_score || 0) +
    (customer.frequency_score || 0) +
    (customer.monetary_score || 0)
  ) / 3;
  risk += (5 - avgRFM) * 10;

  // Low order frequency
  if (customer.total_orders <= 2) {
    risk += 20;
  } else if (customer.total_orders <= 5) {
    risk += 10;
  }

  return Math.min(Math.round(risk), 100);
}
