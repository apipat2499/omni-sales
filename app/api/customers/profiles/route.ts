import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import {
  getOrCreateCustomerProfile,
  calculateRFMScore,
  updateCustomerAnalytics,
} from '@/lib/customer/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerId = req.nextUrl.searchParams.get('customerId');
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
      .from('customer_profiles')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: profiles, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: profiles || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      customerId,
      firstName,
      lastName,
      email,
      phone,
      companyName,
      industry,
      customerType,
      source,
    } = await req.json();

    if (!userId || !customerId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 409 }
      );
    }

    const { data: profile, error } = await supabase
      .from('customer_profiles')
      .insert({
        user_id: userId,
        customer_id: customerId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company_name: companyName,
        industry,
        customer_type: customerType,
        source,
        status: 'active',
        lifetime_value: 0,
        total_orders: 0,
        total_spent: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    // Calculate initial RFM score
    await calculateRFMScore(userId, customerId);

    // Update analytics
    await updateCustomerAnalytics(userId, customerId);

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { customerId, userId, ...updateData } = await req.json();

    if (!customerId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: profile, error } = await supabase
      .from('customer_profiles')
      .update(updateData)
      .eq('customer_id', customerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
