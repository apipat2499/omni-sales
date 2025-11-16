/**
 * Funnel Analysis API
 *
 * Provides conversion funnel analysis (browse → cart → purchase).
 * Helps identify drop-off points and optimize conversion rates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCache, setCache } from '@/lib/cache/manager';

export const dynamic = 'force-dynamic';

interface FunnelStage {
  stage: string;
  users: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeToNextStage?: number;
}

interface FunnelMetrics {
  stages: FunnelStage[];
  overallConversionRate: number;
  totalUsers: number;
  conversionsByChannel: {
    channel: string;
    conversionRate: number;
    users: number;
  }[];
  conversionsBySegment: {
    segment: string;
    conversionRate: number;
    users: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const channel = searchParams.get('channel');
    const useCache = searchParams.get('cache') !== 'false';

    // Check cache
    const cacheKey = `funnel:${startDate}:${endDate}:${channel}`;
    if (useCache) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const supabase = await createClient();

    // For this implementation, we'll use order data as a proxy
    // In a real implementation, you would track browse and cart events separately
    let query = supabase
      .from('order_analytics_view')
      .select('*');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Funnel analysis error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch funnel analysis' },
        { status: 500 }
      );
    }

    const orderList = orders || [];

    // Calculate funnel metrics
    const metrics = calculateFunnelMetrics(orderList);

    const response = {
      success: true,
      data: metrics,
      metadata: {
        startDate,
        endDate,
        channel
      }
    };

    // Cache for 6 hours
    if (useCache) {
      await setCache(cacheKey, response, 21600);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Funnel analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate funnel metrics
 * Note: This is a simplified implementation using order data
 * In production, you would track actual browse and cart events
 */
function calculateFunnelMetrics(orders: any[]): FunnelMetrics {
  // Simulate funnel stages based on order data
  // In real implementation, track these events separately

  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map(o => o.customer_id)).size;

  // Estimated funnel (using industry averages as multipliers)
  const estimatedBrowse = Math.round(totalOrders * 10); // 10x browsing
  const estimatedCart = Math.round(totalOrders * 3); // 3x add to cart
  const completedOrders = orders.filter(o => o.status === 'completed').length;

  // Calculate stages
  const stages: FunnelStage[] = [
    {
      stage: 'Browse Products',
      users: estimatedBrowse,
      conversionRate: 100,
      dropOffRate: 0
    },
    {
      stage: 'Add to Cart',
      users: estimatedCart,
      conversionRate: estimatedBrowse > 0 ? (estimatedCart / estimatedBrowse) * 100 : 0,
      dropOffRate: estimatedBrowse > 0 ? ((estimatedBrowse - estimatedCart) / estimatedBrowse) * 100 : 0,
      avgTimeToNextStage: 5 // minutes (estimated)
    },
    {
      stage: 'Initiate Checkout',
      users: totalOrders,
      conversionRate: estimatedCart > 0 ? (totalOrders / estimatedCart) * 100 : 0,
      dropOffRate: estimatedCart > 0 ? ((estimatedCart - totalOrders) / estimatedCart) * 100 : 0,
      avgTimeToNextStage: 3 // minutes (estimated)
    },
    {
      stage: 'Complete Purchase',
      users: completedOrders,
      conversionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      dropOffRate: totalOrders > 0 ? ((totalOrders - completedOrders) / totalOrders) * 100 : 0
    }
  ];

  const overallConversionRate = estimatedBrowse > 0
    ? (completedOrders / estimatedBrowse) * 100
    : 0;

  // Calculate conversions by channel
  const conversionsByChannel = calculateConversionsByDimension(
    orders,
    'channel'
  );

  // Calculate conversions by segment (if available)
  const conversionsBySegment = calculateConversionsByDimension(
    orders,
    'customer_segment'
  );

  return {
    stages,
    overallConversionRate,
    totalUsers: uniqueCustomers,
    conversionsByChannel,
    conversionsBySegment
  };
}

/**
 * Calculate conversions by dimension
 */
function calculateConversionsByDimension(
  orders: any[],
  dimension: string
): {
  channel?: string;
  segment?: string;
  conversionRate: number;
  users: number;
}[] {
  const dimensionMap = new Map<string, any[]>();

  orders.forEach(order => {
    const value = order[dimension];
    if (!value) return;

    if (!dimensionMap.has(value)) {
      dimensionMap.set(value, []);
    }
    dimensionMap.get(value)!.push(order);
  });

  return Array.from(dimensionMap.entries())
    .map(([value, orderList]) => {
      const completed = orderList.filter(o => o.status === 'completed').length;
      const total = orderList.length;

      const result: any = {
        conversionRate: total > 0 ? (completed / total) * 100 : 0,
        users: new Set(orderList.map(o => o.customer_id)).size
      };

      result[dimension === 'channel' ? 'channel' : 'segment'] = value;

      return result;
    })
    .sort((a, b) => b.conversionRate - a.conversionRate);
}

/**
 * POST endpoint to get detailed funnel data for specific stage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stage, startDate, endDate, channel, limit = 100 } = body;

    const supabase = await createClient();

    let query = supabase
      .from('order_analytics_view')
      .select('*')
      .limit(limit);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (channel) {
      query = query.eq('channel', channel);
    }

    // Filter by stage
    if (stage === 'completed') {
      query = query.eq('status', 'completed');
    } else if (stage === 'abandoned') {
      query = query.in('status', ['pending', 'processing']);
    } else if (stage === 'cancelled') {
      query = query.eq('status', 'cancelled');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Funnel stage fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch funnel stage data' },
        { status: 500 }
      );
    }

    const orders = (data || []).map(o => ({
      orderId: o.order_id,
      customerId: o.customer_id,
      customerName: o.customer_name,
      total: o.total,
      status: o.status,
      channel: o.channel,
      createdAt: o.created_at,
      orderAgeDays: o.order_age_days
    }));

    return NextResponse.json({
      success: true,
      data: orders,
      metadata: {
        count: orders.length,
        stage,
        channel
      }
    });
  } catch (error) {
    console.error('Funnel stage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
