/**
 * RFM Segmentation API
 *
 * Provides Recency, Frequency, Monetary (RFM) analysis for customer segmentation.
 * Helps identify Champions, Loyal Customers, At Risk, and Lost customers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCache, setCache } from '@/lib/cache/manager';

export const dynamic = 'force-dynamic';

interface RFMSegment {
  segment: string;
  customers: number;
  totalRevenue: number;
  avgLifetimeValue: number;
  rfmScores: {
    avgRecency: number;
    avgFrequency: number;
    avgMonetary: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('groupBy') || 'segment'; // segment or rfm_score
    const useCache = searchParams.get('cache') !== 'false';

    // Check cache
    const cacheKey = `rfm:${groupBy}`;
    if (useCache) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const supabase = await createClient();

    // Fetch RFM data from customer analytics view
    const { data: customers, error } = await supabase
      .from('customer_analytics_view')
      .select('*')
      .not('total_orders', 'is', null);

    if (error) {
      console.error('RFM analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch RFM analysis' },
        { status: 500 }
      );
    }

    // Group data based on request
    let segments: RFMSegment[];

    if (groupBy === 'segment') {
      segments = groupBySegment(customers || []);
    } else {
      segments = groupByRFMScore(customers || []);
    }

    // Calculate distribution
    const totalCustomers = customers?.length || 0;
    const distribution = segments.map(seg => ({
      ...seg,
      percentage: totalCustomers > 0 ? (seg.customers / totalCustomers) * 100 : 0
    }));

    const response = {
      success: true,
      data: distribution,
      metadata: {
        totalCustomers,
        groupBy,
        segments: segments.length
      }
    };

    // Cache for 6 hours
    if (useCache) {
      await setCache(cacheKey, response, 21600);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('RFM analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Group customers by segment name
 */
function groupBySegment(customers: any[]): RFMSegment[] {
  const segments = new Map<string, any[]>();

  customers.forEach(customer => {
    const segment = customer.customer_segment || 'Unknown';
    if (!segments.has(segment)) {
      segments.set(segment, []);
    }
    segments.get(segment)!.push(customer);
  });

  return Array.from(segments.entries()).map(([segment, customerList]) => ({
    segment,
    customers: customerList.length,
    totalRevenue: customerList.reduce((sum, c) => sum + (c.total_spent || 0), 0),
    avgLifetimeValue: customerList.reduce((sum, c) => sum + (c.customer_lifetime_value || 0), 0) / customerList.length,
    rfmScores: {
      avgRecency: customerList.reduce((sum, c) => sum + (c.recency_score || 0), 0) / customerList.length,
      avgFrequency: customerList.reduce((sum, c) => sum + (c.frequency_score || 0), 0) / customerList.length,
      avgMonetary: customerList.reduce((sum, c) => sum + (c.monetary_score || 0), 0) / customerList.length
    }
  }));
}

/**
 * Group customers by RFM score
 */
function groupByRFMScore(customers: any[]): RFMSegment[] {
  const rfmGroups = new Map<string, any[]>();

  customers.forEach(customer => {
    const rfmSegment = customer.rfm_segment || '111';
    if (!rfmGroups.has(rfmSegment)) {
      rfmGroups.set(rfmSegment, []);
    }
    rfmGroups.get(rfmSegment)!.push(customer);
  });

  return Array.from(rfmGroups.entries())
    .map(([rfmScore, customerList]) => {
      const r = parseInt(rfmScore[0]);
      const f = parseInt(rfmScore[1]);
      const m = parseInt(rfmScore[2]);

      return {
        segment: rfmScore,
        customers: customerList.length,
        totalRevenue: customerList.reduce((sum, c) => sum + (c.total_spent || 0), 0),
        avgLifetimeValue: customerList.reduce((sum, c) => sum + (c.customer_lifetime_value || 0), 0) / customerList.length,
        rfmScores: {
          avgRecency: r,
          avgFrequency: f,
          avgMonetary: m
        }
      };
    })
    .sort((a, b) => b.customers - a.customers);
}

/**
 * POST endpoint to get customers in a specific RFM segment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { segment, rfmScore, limit = 100 } = body;

    const supabase = await createClient();

    let query = supabase
      .from('customer_analytics_view')
      .select('*')
      .limit(limit);

    if (segment) {
      query = query.eq('customer_segment', segment);
    }

    if (rfmScore) {
      query = query.eq('rfm_segment', rfmScore);
    }

    const { data, error } = await query;

    if (error) {
      console.error('RFM customers fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      metadata: {
        count: data?.length || 0,
        segment,
        rfmScore
      }
    });
  } catch (error) {
    console.error('RFM customers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
