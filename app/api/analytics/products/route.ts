import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const daysBack = parseInt(req.nextUrl.searchParams.get('daysBack') || '30');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'revenue';

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const { data: products, error } = await supabase
      .from('product_performance')
      .select(
        `
        *,
        products (
          id,
          name,
          category,
          price,
          cost
        )
      `
      )
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order(sortBy, { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch product analytics' },
        { status: 500 }
      );
    }

    // Aggregate metrics by product
    const aggregated = new Map();

    products?.forEach((perf) => {
      const productId = perf.product_id;
      if (!aggregated.has(productId)) {
        aggregated.set(productId, {
          ...perf,
          totalUnitsSold: 0,
          totalRevenue: 0,
          totalProfit: 0,
          avgProfit: 0,
          occurrences: 0,
        });
      }

      const current = aggregated.get(productId);
      current.totalUnitsSold += perf.units_sold || 0;
      current.totalRevenue += Number(perf.revenue || 0);
      current.totalProfit += Number(perf.profit || 0);
      current.occurrences += 1;
    });

    // Calculate averages and convert to array
    const result = Array.from(aggregated.values())
      .map((p) => ({
        ...p,
        avgProfit:
          p.occurrences > 0 ? p.totalProfit / p.occurrences : 0,
      }))
      .sort((a, b) => {
        if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'profit') return b.totalProfit - a.totalProfit;
        if (sortBy === 'units') return b.totalUnitsSold - a.totalUnitsSold;
        return 0;
      })
      .slice(0, limit);

    return NextResponse.json({
      data: result,
      count: result.length,
      period: {
        daysBack,
        startDate: startDate.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics' },
      { status: 500 }
    );
  }
}
