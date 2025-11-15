import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const segment = req.nextUrl.searchParams.get('segment');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('customer_analytics')
      .select(
        `
        *,
        customers (
          id,
          name,
          email,
          phone,
          tags
        )
      `
      )
      .eq('user_id', userId)
      .order('lifetime_value', { ascending: false });

    if (segment) {
      query = query.eq('segment', segment);
    }

    const { data, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch customer analytics' },
        { status: 500 }
      );
    }

    // Calculate segment distribution
    const { data: allCustomers } = await supabase
      .from('customer_analytics')
      .select('segment')
      .eq('user_id', userId);

    const segmentDistribution = {
      vip: 0,
      loyal: 0,
      atrisk: 0,
      new: 0,
    };

    allCustomers?.forEach((c) => {
      const seg = c.segment as keyof typeof segmentDistribution;
      if (seg in segmentDistribution) {
        segmentDistribution[seg]++;
      }
    });

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      limit,
      offset,
      segmentDistribution,
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer analytics' },
      { status: 500 }
    );
  }
}
