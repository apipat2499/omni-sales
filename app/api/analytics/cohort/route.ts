/**
 * Cohort Analysis API
 *
 * Analyzes customer segments over time based on their first purchase date.
 * Helps understand retention and behavior patterns of different customer cohorts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCache, setCache } from '@/lib/cache/manager';

export const dynamic = 'force-dynamic';

interface CohortData {
  cohort: string;
  period: number;
  customers: number;
  revenue: number;
  orders: number;
  retentionRate: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const periodType = searchParams.get('periodType') || 'month'; // month, week, quarter
    const useCache = searchParams.get('cache') !== 'false';

    // Check cache
    const cacheKey = `cohort:${startDate}:${endDate}:${periodType}`;
    if (useCache) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const supabase = await createClient();

    // Build cohort analysis query
    const query = `
      WITH customer_cohorts AS (
        SELECT
          customer_id,
          DATE_TRUNC('${periodType}', MIN(created_at)) as cohort_date,
          MIN(created_at) as first_order_date
        FROM orders
        WHERE status NOT IN ('cancelled', 'refunded')
          ${startDate ? `AND created_at >= '${startDate}'` : ''}
          ${endDate ? `AND created_at <= '${endDate}'` : ''}
        GROUP BY customer_id
      ),
      cohort_orders AS (
        SELECT
          cc.cohort_date,
          DATE_TRUNC('${periodType}', o.created_at) as order_period,
          EXTRACT(EPOCH FROM (DATE_TRUNC('${periodType}', o.created_at) - cc.cohort_date)) /
            CASE
              WHEN '${periodType}' = 'month' THEN 2592000
              WHEN '${periodType}' = 'week' THEN 604800
              WHEN '${periodType}' = 'quarter' THEN 7776000
              ELSE 2592000
            END as period_number,
          o.customer_id,
          o.total
        FROM customer_cohorts cc
        JOIN orders o ON cc.customer_id = o.customer_id
        WHERE o.status NOT IN ('cancelled', 'refunded')
      ),
      cohort_metrics AS (
        SELECT
          cohort_date,
          period_number,
          COUNT(DISTINCT customer_id) as customers,
          SUM(total) as revenue,
          COUNT(*) as orders
        FROM cohort_orders
        GROUP BY cohort_date, period_number
      ),
      cohort_sizes AS (
        SELECT
          cohort_date,
          COUNT(*) as cohort_size
        FROM customer_cohorts
        GROUP BY cohort_date
      )
      SELECT
        TO_CHAR(cm.cohort_date, 'YYYY-MM-DD') as cohort,
        cm.period_number::integer as period,
        cm.customers,
        cm.revenue,
        cm.orders,
        (cm.customers::float / cs.cohort_size * 100) as retention_rate
      FROM cohort_metrics cm
      JOIN cohort_sizes cs ON cm.cohort_date = cs.cohort_date
      ORDER BY cm.cohort_date, cm.period_number
    `;

    const { data, error } = await supabase.rpc('execute_sql', { query_text: query })
      .catch(async () => {
        // Fallback: use the analytics view directly
        const { data: cohortData, error: cohortError } = await supabase
          .from('customer_analytics_view')
          .select('*')
          .order('customer_since', { ascending: true });

        if (cohortError) throw cohortError;

        // Process cohort data manually
        return { data: processCohortData(cohortData, periodType), error: null };
      });

    if (error) {
      console.error('Cohort analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cohort analysis' },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      data: data || [],
      metadata: {
        startDate,
        endDate,
        periodType,
        totalCohorts: [...new Set((data || []).map((d: CohortData) => d.cohort))].length
      }
    };

    // Cache for 6 hours
    if (useCache) {
      await setCache(cacheKey, response, 21600);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Cohort analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process cohort data manually (fallback)
 */
function processCohortData(customers: any[], periodType: string): CohortData[] {
  const cohorts = new Map<string, Map<number, CohortData>>();

  customers.forEach(customer => {
    const cohortDate = new Date(customer.customer_since);
    const cohortKey = formatCohortDate(cohortDate, periodType);

    if (!cohorts.has(cohortKey)) {
      cohorts.set(cohortKey, new Map());
    }

    const cohortMap = cohorts.get(cohortKey)!;

    // Period 0 (first purchase)
    if (!cohortMap.has(0)) {
      cohortMap.set(0, {
        cohort: cohortKey,
        period: 0,
        customers: 0,
        revenue: 0,
        orders: 0,
        retentionRate: 100
      });
    }

    const period0 = cohortMap.get(0)!;
    period0.customers++;
    period0.revenue += customer.total_spent || 0;
    period0.orders += customer.total_orders || 0;
  });

  return Array.from(cohorts.values()).flatMap(cohortMap =>
    Array.from(cohortMap.values())
  );
}

/**
 * Format cohort date based on period type
 */
function formatCohortDate(date: Date, periodType: string): string {
  const year = date.getFullYear();
  const month = date.getMonth();

  switch (periodType) {
    case 'week':
      const week = Math.ceil(date.getDate() / 7);
      return `${year}-W${week}`;
    case 'quarter':
      const quarter = Math.floor(month / 3) + 1;
      return `${year}-Q${quarter}`;
    case 'month':
    default:
      return `${year}-${String(month + 1).padStart(2, '0')}`;
  }
}
