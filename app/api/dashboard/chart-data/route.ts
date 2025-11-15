import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { format, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14');

    const now = new Date();
    const startDate = subDays(now, days);

    // Fetch all orders in the date range
    const { data: orders } = await supabase
      .from('orders')
      .select('total, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .order('created_at', { ascending: true });

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
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
