import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createPromotionalCampaign } from '@/lib/discount/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const status = req.nextUrl.searchParams.get('status');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('promotional_campaigns')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: campaigns, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: campaigns || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const {
      campaignName,
      description,
      campaignType,
      targetAudience,
      startDate,
      endDate,
      budgetLimit,
      minPurchaseAmount,
      discountCodes,
      marketingChannel,
      campaignNotes,
    } = await req.json();

    if (!userId || !campaignName || !campaignType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const campaign = await createPromotionalCampaign(userId, {
      campaignName,
      description,
      campaignType,
      targetAudience,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      budgetLimit,
      minPurchaseAmount,
      discountCodes,
      marketingChannel,
      campaignNotes,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
