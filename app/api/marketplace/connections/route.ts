import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET user's marketplace connections
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const { data: connections, error } = await supabase
      .from('marketplace_connections')
      .select(
        `
        *,
        marketplace_platforms (*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    return NextResponse.json(connections || []);
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// POST new marketplace connection
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      platformCode,
      shopId,
      shopName,
      accessToken,
      refreshToken,
      apiKey,
      apiSecret,
      webhookSecret,
    } = await req.json();

    if (!userId || !platformCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get platform details
    const { data: platform } = await supabase
      .from('marketplace_platforms')
      .select('id')
      .eq('code', platformCode)
      .single();

    const { data, error } = await supabase
      .from('marketplace_connections')
      .insert({
        user_id: userId,
        platform_id: platform?.id,
        platform_code: platformCode,
        shop_id: shopId,
        shop_name: shopName,
        access_token: accessToken,
        refresh_token: refreshToken,
        api_key: apiKey,
        api_secret: apiSecret,
        webhook_secret: webhookSecret,
        is_active: true,
      })
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create connection' },
        { status: 500 }
      );
    }

    return NextResponse.json(data?.[0], { status: 201 });
  } catch (error) {
    console.error('Error creating connection:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}
