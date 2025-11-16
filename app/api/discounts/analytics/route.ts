import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getCampaignAnalytics, recordDiscountAnalytics } from '@/lib/discount/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const discountCodeId = req.nextUrl.searchParams.get('discountCodeId');
    const campaignId = req.nextUrl.searchParams.get('campaignId');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('discount_analytics')
      .select('*')
      .eq('user_id', userId);

    if (discountCodeId) {
      query = query.eq('discount_code_id', discountCodeId);
    }
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    if (startDate) {
      query = query.gte('date', new Date(startDate));
    }
    if (endDate) {
      query = query.lte('date', new Date(endDate));
    }

    const { data: analytics, error } = await query.order('date', {
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
    console.error('Error fetching discount analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount analytics' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const {
      discountCodeId,
      campaignId,
      date,
      totalRedemptions,
      totalDiscountAmount,
      averageOrderValue,
      ordersCreated,
      customersReached,
      conversionRate,
    } = await req.json();

    if (!userId || !date || totalRedemptions === undefined || totalDiscountAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analytics = await recordDiscountAnalytics(userId, {
      discountCodeId,
      campaignId,
      date: new Date(date),
      totalRedemptions,
      totalDiscountAmount,
      averageOrderValue,
      ordersCreated,
      customersReached,
      conversionRate,
    });

    if (!analytics) {
      return NextResponse.json(
        { error: 'Failed to record analytics' },
        { status: 500 }
      );
    }

    return NextResponse.json(analytics, { status: 201 });
  } catch (error) {
    console.error('Error recording analytics:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics' },
      { status: 500 }
    );
  }
}
