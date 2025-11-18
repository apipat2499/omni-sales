import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { demoCategorySales } from '@/lib/demo/data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const supabase = getSupabaseClient();

    // If Supabase is not available, return demo data
    if (!supabase) {
      console.warn('Supabase not configured, returning demo category sales');
      return NextResponse.json(demoCategorySales, { status: 200 });
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Fetch order items with product information
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        order_id,
        product_id,
        orders!inner(created_at),
        products!inner(category)
      `)
      .gte('orders.created_at', startDate.toISOString())
      .lte('orders.created_at', now.toISOString());

    if (error) {
      console.error('Error fetching order items from Supabase:', error);
      return NextResponse.json(demoCategorySales, { status: 200 });
    }

    // Group by category
    const salesByCategory: Record<string, number> = {};
    let totalSales = 0;

    (orderItems || []).forEach((item: any) => {
      const category = item.products?.category || 'Other';
      const itemTotal = parseFloat(item.price) * item.quantity;

      salesByCategory[category] = (salesByCategory[category] || 0) + itemTotal;
      totalSales += itemTotal;
    });

    // Convert to array format with percentages
    const categorySales = Object.entries(salesByCategory)
      .map(([category, value]) => ({
        category,
        value: Math.round(value * 100) / 100,
        percentage: totalSales > 0 ? (value / totalSales) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json(categorySales, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/dashboard/category-sales:', error);
    // Return demo data instead of error
    return NextResponse.json(demoCategorySales, { status: 200 });
  }
}

// Set route config for timeout
export const maxDuration = 10; // 10 seconds max
export const dynamic = 'force-dynamic';
