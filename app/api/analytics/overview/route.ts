import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Get sales metrics
    const { data: sales, error: salesError } = await supabase
      .from('orders')
      .select('total, created_at, status')
      .gte('created_at', startDateStr);

    if (salesError) throw salesError;

    // Get product metrics
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) throw productsError;

    // Get customer metrics
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (customersError) throw customersError;

    // Calculate totals
    const totalRevenue = sales?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const totalOrders = sales?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate growth (compare with previous period)
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);

    const { data: prevSales } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', startDateStr);

    const prevRevenue = prevSales?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      avgOrderValue,
      revenueGrowth,
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
