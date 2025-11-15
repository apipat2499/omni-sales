import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Customer } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build count query
    let countQuery = supabase
      .from('customer_stats')
      .select('*', { count: 'exact', head: true });

    // Build data query
    let dataQuery = supabase
      .from('customer_stats')
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

    // Apply pagination and ordering
    dataQuery = dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute both queries in parallel
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      dataQuery,
      countQuery,
    ]);

    if (error || countError) {
      console.error('Error fetching customers:', error || countError);
      return NextResponse.json(
        { error: 'Failed to fetch customers', details: (error || countError)?.message },
        { status: 500 }
      );
    }

    // Transform dates to Date objects
    const customers: Customer[] = (data || []).map((customer) => ({
      ...customer,
      createdAt: new Date(customer.created_at),
      updatedAt: new Date(customer.updated_at),
      lastOrderDate: customer.last_order_date ? new Date(customer.last_order_date) : undefined,
    }));

    // Return with pagination metadata
    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/customers:', error);
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
