import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top customers using customer_lifetime_value view
    const { data, error } = await supabase
      .from('customer_lifetime_value')
      .select('*')
      .order('lifetime_value', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const topCustomers = (data || []).map((customer: any) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      lifetimeValue: customer.lifetime_value || 0,
      totalOrders: customer.total_orders || 0,
      avgOrderValue: customer.avg_order_value || 0,
      lastOrderDate: customer.last_order_date ? new Date(customer.last_order_date) : null,
    }));

    return NextResponse.json(topCustomers);
  } catch (error) {
    console.error('Error fetching top customers:', error);
    return NextResponse.json({ error: 'Failed to fetch top customers' }, { status: 500 });
  }
}
