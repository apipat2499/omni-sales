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

    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const { data: channels, error } = await supabase
      .from('channel_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('revenue', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch channel analytics' },
        { status: 500 }
      );
    }

    // Aggregate by channel
    const aggregated = new Map();

    channels?.forEach((perf) => {
      const channel = perf.channel;
      if (!aggregated.has(channel)) {
        aggregated.set(channel, {
          channel,
          totalOrders: 0,
          totalRevenue: 0,
          totalProfit: 0,
          avgOrderValue: 0,
          occurrences: 0,
        });
      }

      const current = aggregated.get(channel);
      current.totalOrders += perf.orders || 0;
      current.totalRevenue += Number(perf.revenue || 0);
      current.totalProfit += Number(perf.profit || 0);
      current.occurrences += 1;
    });

    // Calculate averages
    const result = Array.from(aggregated.values())
      .map((c) => ({
        ...c,
        avgOrderValue:
          c.totalOrders > 0 ? c.totalRevenue / c.totalOrders : 0,
        revenuePercentage: 0,
        profitPercentage: 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate percentages
    const totalRevenue = result.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalProfit = result.reduce((sum, c) => sum + c.totalProfit, 0);

    result.forEach((c) => {
      c.revenuePercentage = totalRevenue > 0 ? (c.totalRevenue / totalRevenue) * 100 : 0;
      c.profitPercentage = totalProfit > 0 ? (c.totalProfit / totalProfit) * 100 : 0;
    });

    return NextResponse.json({
      data: result,
      summary: {
        totalRevenue,
        totalProfit,
        totalOrders: result.reduce((sum, c) => sum + c.totalOrders, 0),
        channelCount: result.length,
      },
      period: {
        daysBack,
        startDate: startDate.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error fetching channel analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel analytics' },
      { status: 500 }
    );
  }
}
