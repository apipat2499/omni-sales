import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '10');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get top products by revenue using product_performance view
    const { data, error } = await supabase
      .from('product_performance')
      .select('*')
      .order('total_revenue', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const topProducts = (data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      totalRevenue: product.total_revenue || 0,
      totalQuantitySold: product.total_quantity_sold || 0,
      totalProfit: product.total_profit || 0,
      timesOrdered: product.times_ordered || 0,
    }));

    return NextResponse.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    return NextResponse.json({ error: 'Failed to fetch top products' }, { status: 500 });
  }
}
