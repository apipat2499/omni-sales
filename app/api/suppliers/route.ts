import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Supplier } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let countQuery = supabase.from('suppliers').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('suppliers').select('*');

    // Apply search filter
    if (search) {
      const searchFilter = `name.ilike.%${search}%,email.ilike.%${search}%,contact_person.ilike.%${search}%`;
      dataQuery = dataQuery.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // Apply active filter
    if (isActive === 'true') {
      dataQuery = dataQuery.eq('is_active', true);
      countQuery = countQuery.eq('is_active', true);
    }

    // Apply pagination
    const { data, error, count } = await dataQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suppliers', details: error.message },
        { status: 500 }
      );
    }

    const suppliers: Supplier[] = (data || []).map((supplier) => ({
      ...supplier,
      createdAt: new Date(supplier.created_at),
      updatedAt: new Date(supplier.updated_at),
    }));

    return NextResponse.json({
      data: suppliers,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/suppliers:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const supplierData = {
      name: body.name.trim(),
      contact_person: body.contactPerson || null,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
      website: body.website || null,
      tax_id: body.taxId || null,
      payment_terms: body.paymentTerms || null,
      notes: body.notes || null,
      rating: body.rating || 0,
      is_active: body.isActive !== undefined ? body.isActive : true,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json(
        { error: 'Failed to create supplier', details: error.message },
        { status: 500 }
      );
    }

    const supplier: Supplier = {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/suppliers:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
