import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getPaginationParams, createPaginatedResponse, getOffsetLimit } from '@/lib/utils/pagination';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, sortBy, sortOrder } = getPaginationParams(searchParams);

    // Optional filters
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const referenceType = searchParams.get('referenceType');

    // Build count query
    let countQuery = supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true });

    if (productId) {
      countQuery = countQuery.eq('product_id', productId);
    }
    if (type) {
      countQuery = countQuery.eq('type', type);
    }
    if (referenceType) {
      countQuery = countQuery.eq('reference_type', referenceType);
    }

    const { count } = await countQuery;
    const total = count || 0;

    // Build data query with join to products table
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        products:product_id (
          id,
          name,
          sku,
          category
        )
      `);

    // Apply filters
    if (productId) {
      query = query.eq('product_id', productId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (referenceType) {
      query = query.eq('reference_type', referenceType);
    }

    // Apply sorting
    const orderColumn = sortBy || 'created_at';
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const { from, to } = getOffsetLimit(page, limit);
    query = query.range(from, to);

    const { data: movements, error } = await query;

    if (error) {
      console.error('Error fetching stock movements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stock movements', details: error.message },
        { status: 500 }
      );
    }

    const response = createPaginatedResponse(movements || [], total, page, limit);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in stock movements API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      product_id,
      type,
      quantity,
      reference_type,
      reference_id,
      notes,
    } = body;

    // Validation
    if (!product_id || !type || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, type, quantity' },
        { status: 400 }
      );
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const previous_stock = product.stock;
    const new_stock = previous_stock + quantity;

    // Prevent negative stock
    if (new_stock < 0) {
      return NextResponse.json(
        { error: 'Insufficient stock. Cannot reduce stock below zero.' },
        { status: 400 }
      );
    }

    // Create stock movement record
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id,
        type,
        quantity,
        previous_stock,
        new_stock,
        reference_type,
        reference_id,
        notes,
      })
      .select()
      .single();

    if (movementError) {
      console.error('Error creating stock movement:', movementError);
      return NextResponse.json(
        { error: 'Failed to create stock movement', details: movementError.message },
        { status: 500 }
      );
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: new_stock })
      .eq('id', product_id);

    if (updateError) {
      console.error('Error updating product stock:', updateError);
      return NextResponse.json(
        { error: 'Failed to update product stock', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: movement, message: 'Stock movement recorded successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in stock movements POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
