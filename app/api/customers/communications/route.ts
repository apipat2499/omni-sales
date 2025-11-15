import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { logCommunication } from '@/lib/customer/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerId = req.nextUrl.searchParams.get('customerId');
    const channel = req.nextUrl.searchParams.get('channel');
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
      .from('customer_communications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (channel) {
      query = query.eq('channel', channel);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: communications, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch communications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: communications || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      customerId,
      communicationType,
      subject,
      message,
      direction,
      channel,
      status,
    } = await req.json();

    if (
      !userId ||
      !customerId ||
      !communicationType ||
      !message ||
      !direction ||
      !channel
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await logCommunication(userId, customerId, {
      communicationType,
      subject,
      message,
      direction,
      channel,
      status,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to log communication' },
        { status: 500 }
      );
    }

    // Fetch the created communication
    const { data: communication } = await supabase
      .from('customer_communications')
      .select('*')
      .eq('customer_id', customerId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json(communication, { status: 201 });
  } catch (error) {
    console.error('Error logging communication:', error);
    return NextResponse.json(
      { error: 'Failed to log communication' },
      { status: 500 }
    );
  }
}
