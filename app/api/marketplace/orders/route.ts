import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const platformCode = req.nextUrl.searchParams.get('platformCode');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('marketplace_orders')
      .select(
        `
        *,
        marketplace_order_items (*),
        marketplace_connections (
          shop_name,
          platform_code,
          marketplace_platforms (name, code)
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (platformCode) {
      query = query.eq('platform_code', platformCode);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
