import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Customer } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId: id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('customer_stats')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch customer', details: error.message },
        { status: 500 }
      );
    }

    // Transform dates to Date objects
    const customer: Customer = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastOrderDate: data.lastOrderDate ? new Date(data.lastOrderDate) : undefined,
    };

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/customers/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId: id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate required fields if provided
    if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
      return NextResponse.json(
        { error: 'Customer name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (body.email !== undefined && (typeof body.email !== 'string' || body.email.trim() === '')) {
      return NextResponse.json(
        { error: 'Email must be a non-empty string' },
        { status: 400 }
      );
    }

    // Email validation
    if (body.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Email must be a valid email address' },
          { status: 400 }
        );
      }
    }

    if (body.phone !== undefined && (typeof body.phone !== 'string' || body.phone.trim() === '')) {
      return NextResponse.json(
        { error: 'Phone must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate tags if provided
    if (body.tags !== undefined && !Array.isArray(body.tags)) {
      return NextResponse.json(
        { error: 'Tags must be an array' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.address !== undefined) updateData.address = body.address?.trim() || null;
    if (body.tags !== undefined) updateData.tags = body.tags;

    // Update customer in Supabase
    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Handle unique constraint violations (duplicate email)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A customer with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update customer', details: error.message },
        { status: 500 }
      );
    }

    // Fetch updated customer with stats from customer_stats view
    const { data: statsData, error: statsError } = await supabase
      .from('customer_stats')
      .select('*')
      .eq('id', id)
      .single();

    if (statsError) {
      console.error('Error fetching customer stats:', statsError);
      // Return basic customer data if stats fetch fails
      const customer: Customer = {
        ...data,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
      return NextResponse.json(customer, { status: 200 });
    }

    // Transform dates to Date objects
    const customer: Customer = {
      ...statsData,
      createdAt: new Date(statsData.createdAt),
      updatedAt: new Date(statsData.updatedAt),
      lastOrderDate: statsData.lastOrderDate ? new Date(statsData.lastOrderDate) : undefined,
    };

    return NextResponse.json(customer, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in PUT /api/customers/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId: id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // Delete customer from Supabase (cascade will handle related orders)
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);

      return NextResponse.json(
        { error: 'Failed to delete customer', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/customers/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
