import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Promotion } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase.from('promotions').select('*', { count: 'exact' });

    // Filter by active status
    if (isActive === 'true') {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
    }

    // Apply pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching promotions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch promotions', details: error.message },
        { status: 500 }
      );
    }

    const promotions: Promotion[] = (data || []).map((promo) => ({
      ...promo,
      startDate: new Date(promo.start_date),
      endDate: new Date(promo.end_date),
      createdAt: new Date(promo.created_at),
      updatedAt: new Date(promo.updated_at),
    }));

    return NextResponse.json({
      data: promotions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/promotions:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'type', 'value', 'startDate', 'endDate'];
    const missingFields = requiredFields.filter((field) => !(field in body));

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate value based on type
    if (body.type === 'percentage' && (body.value < 0 || body.value > 100)) {
      return NextResponse.json(
        { error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (body.type === 'fixed_amount' && body.value < 0) {
      return NextResponse.json(
        { error: 'Fixed amount must be positive' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const promotionData = {
      name: body.name,
      description: body.description || null,
      type: body.type,
      value: body.value,
      min_purchase: body.minPurchase || 0,
      max_discount: body.maxDiscount || null,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: body.isActive !== undefined ? body.isActive : true,
      usage_limit: body.usageLimit || null,
      usage_count: 0,
      applicable_to: body.applicableTo || 'all',
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('promotions')
      .insert([promotionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating promotion:', error);
      return NextResponse.json(
        { error: 'Failed to create promotion', details: error.message },
        { status: 500 }
      );
    }

    const promotion: Promotion = {
      ...data,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/promotions:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
