import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Customer } from '@/types';
import { withRateLimit, rateLimitPresets } from '@/lib/middleware/rateLimit';
import { getPaginationParams, createPaginatedResponse, getOffsetLimit } from '@/lib/utils/pagination';

async function handleGET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const { page, limit, sortBy, sortOrder } = getPaginationParams(searchParams);

    // Build count query
    let countQuery = supabase.from('customers').select('*', { count: 'exact', head: true });

    // Apply filters to count query
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (tags && tags !== 'all') {
      countQuery = countQuery.contains('tags', [tags]);
    }

    // Build data query
    let dataQuery = supabase
      .from('customers')
      .select('*');

    // Apply search filter to both (name, email, or phone)
    if (search) {
      const searchFilter = `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`;
      dataQuery = dataQuery.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // Apply tags filter to both
    if (tags && tags !== 'all') {
      dataQuery = dataQuery.contains('tags', [tags]);
      countQuery = countQuery.contains('tags', [tags]);
    }

    // Order by created date descending
    dataQuery = dataQuery.order('created_at', { ascending: false });

    // Apply pagination
    const { from, to } = getOffsetLimit(page, limit);
    dataQuery = dataQuery.range(from, to);

    // Execute both queries in parallel
    const [{ data, error }, { count }] = await Promise.all([
      dataQuery,
      countQuery,
    ]);

    const total = count || 0;

    if (error) {
      console.error('Error fetching customers:', error);
      // Return empty paginated response instead of error for missing tables
      const response = createPaginatedResponse([], 0, page, limit);
      return NextResponse.json(response, { status: 200 });
    }

    // Transform dates to Date objects and convert snake_case to camelCase
    const customers: Customer[] = (data || []).map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      tags: customer.tags || [],
      totalOrders: 0, // Will be calculated separately if needed
      totalSpent: 0, // Will be calculated separately if needed
      createdAt: new Date(customer.created_at || customer.createdAt),
      updatedAt: new Date(customer.updated_at || customer.updatedAt),
      lastOrderDate: undefined,
    }));

    // Return paginated response
    const response = createPaginatedResponse(customers, total, page, limit);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/customers:', error);
    // Return empty paginated response instead of error
    const { page, limit } = getPaginationParams(new URL(request.url).searchParams);
    const response = createPaginatedResponse([], 0, page, limit);
    return NextResponse.json(response, { status: 200 });
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone'];
    const missingFields = requiredFields.filter((field) => !(field in body));

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Customer name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof body.email !== 'string' || body.email.trim() === '') {
      return NextResponse.json(
        { error: 'Email must be a non-empty string' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Email must be a valid email address' },
        { status: 400 }
      );
    }

    if (typeof body.phone !== 'string' || body.phone.trim() === '') {
      return NextResponse.json(
        { error: 'Phone must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate tags if provided
    if (body.tags && !Array.isArray(body.tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      );
    }

    // Prepare customer data
    const now = new Date().toISOString();
    const customerData = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      address: body.address?.trim() || null,
      tags: body.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    // Insert customer into Supabase
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);

      // Handle unique constraint violations (duplicate email)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A customer with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create customer', details: error.message },
        { status: 500 }
      );
    }

    // Transform dates to Date objects
    const customer: Customer = {
      ...data,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/customers:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to route handlers
export const GET = withRateLimit(rateLimitPresets.read, handleGET);
export const POST = withRateLimit(rateLimitPresets.write, handlePOST);
