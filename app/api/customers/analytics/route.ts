import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { updateCustomerAnalytics } from '@/lib/customer/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerId = req.nextUrl.searchParams.get('customerId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('customer_analytics')
      .select('*')
      .eq('user_id', userId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: analytics, error } = await query.order('last_calculated_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json(analytics || []);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, customerId } = await req.json();

    if (!userId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analytics = await updateCustomerAnalytics(userId, customerId);

    if (!analytics) {
      return NextResponse.json(
        { error: 'Failed to calculate analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate analytics' },
      { status: 500 }
    );
  }
}
