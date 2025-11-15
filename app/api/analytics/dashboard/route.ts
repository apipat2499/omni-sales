import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const daysBack = parseInt(req.nextUrl.searchParams.get('daysBack') || '30');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get daily metrics for the period
    const { data: dailyMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    // Get top products
    const { data: topProducts } = await supabase
      .from('product_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('revenue', { ascending: false })
      .limit(5);

    // Get channel performance
    const { data: channelPerf } = await supabase
      .from('channel_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('revenue', { ascending: false });

    // Get category performance
    const { data: categoryPerf } = await supabase
      .from('category_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('revenue', { ascending: false })
      .limit(5);

    // Get customer analytics
    const { data: customerAnalytics } = await supabase
      .from('customer_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('lifetime_value', { ascending: false })
      .limit(10);

    // Get anomalies
    const { data: anomalies } = await supabase
      .from('anomalies')
      .select('*')
      .eq('user_id', userId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(5);

    // Calculate aggregate metrics
    const totalRevenue = dailyMetrics?.reduce(
      (sum, m) => sum + Number(m.total_revenue || 0),
      0
    ) || 0;

    const totalProfit = dailyMetrics?.reduce(
      (sum, m) => sum + Number(m.total_profit || 0),
      0
    ) || 0;

    const totalOrders = dailyMetrics?.reduce(
      (sum, m) => sum + (m.total_orders || 0),
      0
    ) || 0;

    const uniqueCustomers = dailyMetrics?.reduce(
      (sum, m) => sum + (m.unique_customers || 0),
      0
    ) || 0;

    const averageOrderValue =
      totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate growth metrics (comparing with previous period)
    const previousStart = new Date(
      startDate.getTime() - daysBack * 24 * 60 * 60 * 1000
    );

    const { data: previousMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', previousStart.toISOString().split('T')[0])
      .lt('date', startDate.toISOString().split('T')[0]);

    const previousRevenue = previousMetrics?.reduce(
      (sum, m) => sum + Number(m.total_revenue || 0),
      0
    ) || 0;

    const previousOrders = previousMetrics?.reduce(
      (sum, m) => sum + (m.total_orders || 0),
      0
    ) || 0;

    const previousCustomers = previousMetrics?.reduce(
      (sum, m) => sum + (m.unique_customers || 0),
      0
    ) || 0;

    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const ordersGrowth =
      previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;

    const customersGrowth =
      previousCustomers > 0
        ? ((uniqueCustomers - previousCustomers) / previousCustomers) * 100
        : 0;

    // Segment customers
    const customerSegments = {
      vip: customerAnalytics?.filter((c) => c.segment === 'vip').length || 0,
      loyal: customerAnalytics?.filter((c) => c.segment === 'loyal').length || 0,
      atrisk: customerAnalytics?.filter((c) => c.segment === 'atrisk').length || 0,
      new: customerAnalytics?.filter((c) => c.segment === 'new').length || 0,
    };

    return NextResponse.json({
      totalRevenue,
      totalProfit,
      totalOrders,
      uniqueCustomers,
      averageOrderValue,
      revenueGrowth,
      ordersGrowth,
      customersGrowth,
      topProducts: topProducts || [],
      topChannels: channelPerf || [],
      topCategories: categoryPerf || [],
      customerSegments,
      anomalies: anomalies || [],
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: daysBack,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
