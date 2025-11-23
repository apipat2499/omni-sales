import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Discount } from '@/types';
import { getPaginationParams, createPaginatedResponse, getOffsetLimit } from '@/lib/utils/pagination';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const active = searchParams.get('active');
    const { page, limit, sortBy, sortOrder } = getPaginationParams(searchParams);

    // Build count query
    let countQuery = supabase.from('discounts').select('*', { count: 'exact', head: true });

    // Apply filters to count query
    if (search) {
      countQuery = countQuery.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }
    if (active !== null && active !== 'all') {
      countQuery = countQuery.eq('active', active === 'true');
    }

    const { count, error: countError } = await countQuery;

    // If table doesn't exist, return empty response
    if (countError) {
      console.error('Error fetching discounts:', countError);
      const response = createPaginatedResponse([], 0, page, limit);
      return NextResponse.json(response, { status: 200 });
    }

    const total = count || 0;

    // Build data query with pagination
    let query = supabase.from('discounts').select('*');

    // Filter by search (code or name)
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Filter by active status
    if (active !== null && active !== 'all') {
      query = query.eq('active', active === 'true');
    }

    // Apply sorting
    const orderColumn = sortBy || 'created_at';
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const { from, to } = getOffsetLimit(page, limit);
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching discounts:', error);
      // Return empty response instead of error
      const response = createPaginatedResponse([], 0, page, limit);
      return NextResponse.json(response, { status: 200 });
    }

    const discounts: Discount[] = (data || []).map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      type: d.type,
      value: parseFloat(d.value),
      minPurchaseAmount: parseFloat(d.min_purchase_amount),
      maxDiscountAmount: d.max_discount_amount ? parseFloat(d.max_discount_amount) : undefined,
      usageLimit: d.usage_limit,
      usageCount: d.usage_count,
      startDate: d.start_date ? new Date(d.start_date) : undefined,
      endDate: d.end_date ? new Date(d.end_date) : undefined,
      active: d.active,
      appliesTo: d.applies_to,
      appliesToValue: d.applies_to_value,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    }));

    // Return paginated response
    const response = createPaginatedResponse(discounts, total, page, limit);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/discounts:', error);
    // Return empty response instead of error
    const { page, limit } = getPaginationParams(new URL(request.url).searchParams);
    const response = createPaginatedResponse([], 0, page, limit);
    return NextResponse.json(response, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.code || !body.name || !body.type || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, type, value' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('discounts')
      .select('id')
      .eq('code', body.code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 409 }
      );
    }

    const discountData = {
      code: body.code.toUpperCase(),
      name: body.name,
      description: body.description || null,
      type: body.type,
      value: body.value,
      min_purchase_amount: body.minPurchaseAmount || 0,
      max_discount_amount: body.maxDiscountAmount || null,
      usage_limit: body.usageLimit || null,
      usage_count: 0,
      start_date: body.startDate || null,
      end_date: body.endDate || null,
      active: body.active !== undefined ? body.active : true,
      applies_to: body.appliesTo || 'all',
      applies_to_value: body.appliesToValue || null,
    };

    const { data, error } = await supabase
      .from('discounts')
      .insert(discountData)
      .select()
      .single();

    if (error) {
      console.error('Error creating discount:', error);
      return NextResponse.json(
        { error: 'Failed to create discount', details: error.message },
        { status: 500 }
      );
    }

    const discount: Discount = {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      value: parseFloat(data.value),
      minPurchaseAmount: parseFloat(data.min_purchase_amount),
      maxDiscountAmount: data.max_discount_amount ? parseFloat(data.max_discount_amount) : undefined,
      usageLimit: data.usage_limit,
      usageCount: data.usage_count,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      active: data.active,
      appliesTo: data.applies_to,
      appliesToValue: data.applies_to_value,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/discounts:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
