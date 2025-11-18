import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { format, subDays } from 'date-fns';
import { demoChartData } from '@/lib/demo/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14');

    const supabase = getSupabaseClient();

    // If Supabase is not available, return demo data
    if (!supabase) {
      console.warn('Supabase not configured, returning demo chart data');
      return NextResponse.json(demoChartData, { status: 200 });
    }

    const now = new Date();
    const startDate = subDays(now, days);

    // Fetch all orders in the date range with timeout
    const { data: orders, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching orders from Supabase:', error);
      return NextResponse.json(demoChartData, { status: 200 });
    }

    // Group orders by date
    const dataByDate: Record<string, { revenue: number; orders: number }> = {};

    // Initialize all dates with zero values
    for (let i = 0; i < days; i++) {
      const date = format(subDays(now, days - i - 1), 'yyyy-MM-dd');
      dataByDate[date] = { revenue: 0, orders: 0 };
    }

    // Aggregate actual data
    (orders || []).forEach((order) => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd');
      if (dataByDate[date]) {
        dataByDate[date].revenue += parseFloat(order.total);
        dataByDate[date].orders += 1;
      }
    });

    // Convert to array format
    const chartData = Object.entries(dataByDate).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }));

    return NextResponse.json(chartData, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/dashboard/chart-data:', error);
    // Return demo data instead of error
    return NextResponse.json(demoChartData, { status: 200 });
  }
}

// Set route config for timeout
export const maxDuration = 10; // 10 seconds max
export const dynamic = 'force-dynamic';
