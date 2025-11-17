import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    // Fetch order items with product information
    const { data: orderItems } = await supabase
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
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
