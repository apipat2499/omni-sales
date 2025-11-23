import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const orderId = parseInt(params.id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const { data: activities, error } = await supabase
      .from('order_activities')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching order activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order activities', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: activities || [] });
  } catch (error) {
    console.error('Unexpected error in order activities API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient();
    const orderId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const { type, description, old_value, new_value, metadata } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: type, description' },
        { status: 400 }
      );
    }

    const { data: activity, error } = await supabase
      .from('order_activities')
      .insert({
        order_id: orderId,
        type,
        description,
        old_value,
        new_value,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order activity:', error);
      return NextResponse.json(
        { error: 'Failed to create order activity', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in order activities POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
