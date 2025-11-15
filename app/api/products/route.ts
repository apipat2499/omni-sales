import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Product } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const inStock = searchParams.get('inStock');
    const isFeatured = searchParams.get('isFeatured');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build count query for total
    let countQuery = supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Build data query
    let dataQuery = supabase
      .from('products')
      .select('*');

    // Apply search filter to both queries
    if (search) {
      const searchFilter = `name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`;
      dataQuery = dataQuery.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // Apply category filter to both queries
    if (category && category !== 'all') {
      dataQuery = dataQuery.eq('category', category);
      countQuery = countQuery.eq('category', category);
    }

    // Apply price range filters
    if (minPrice) {
      const minPriceNum = parseFloat(minPrice);
      dataQuery = dataQuery.gte('price', minPriceNum);
      countQuery = countQuery.gte('price', minPriceNum);
    }

    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      dataQuery = dataQuery.lte('price', maxPriceNum);
      countQuery = countQuery.lte('price', maxPriceNum);
    }

    // Apply rating filter
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      dataQuery = dataQuery.gte('rating', minRatingNum);
      countQuery = countQuery.gte('rating', minRatingNum);
    }

    // Apply stock filter
    if (inStock === 'true') {
      dataQuery = dataQuery.gt('stock', 0);
      countQuery = countQuery.gt('stock', 0);
    }

    // Apply featured filter
    if (isFeatured === 'true') {
      dataQuery = dataQuery.eq('is_featured', true);
      countQuery = countQuery.eq('is_featured', true);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    let orderColumn = sortBy;

    // Map sort fields
    if (sortBy === 'newest') {
      orderColumn = 'created_at';
    } else if (sortBy === 'popular') {
      orderColumn = 'view_count';
    }

    // Apply pagination and ordering
    dataQuery = dataQuery
      .order(orderColumn, { ascending })
      .range(offset, offset + limit - 1);

    // Execute both queries in parallel
    const [{ data, error }, { count, error: countError }] = await Promise.all([
      dataQuery,
      countQuery,
    ]);

    if (error || countError) {
      console.error('Error fetching products:', error || countError);
      return NextResponse.json(
        { error: 'Failed to fetch products', details: (error || countError)?.message },
        { status: 500 }
      );
    }

    // Transform dates to Date objects
    const products: Product[] = (data || []).map((product) => ({
      ...product,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
    }));

    // Return with pagination metadata
    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/products:', error);
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
    const requiredFields = ['name', 'category', 'price', 'cost', 'stock', 'sku'];
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
        { error: 'Product name must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof body.sku !== 'string' || body.sku.trim() === '') {
      return NextResponse.json(
        { error: 'SKU must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof body.cost !== 'number' || body.cost < 0) {
      return NextResponse.json(
        { error: 'Cost must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof body.stock !== 'number' || body.stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a positive number' },
        { status: 400 }
      );
    }

    // Prepare product data
    const now = new Date().toISOString();
    const productData = {
      name: body.name.trim(),
      category: body.category,
      price: body.price,
      cost: body.cost,
      stock: body.stock,
      sku: body.sku.trim(),
      image: body.image || null,
      description: body.description || null,
      createdAt: now,
      updatedAt: now,
    };

    // Insert product into Supabase
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);

      // Handle unique constraint violations (duplicate SKU)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create product', details: error.message },
        { status: 500 }
      );
    }

    // Transform dates to Date objects
    const product: Product = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/products:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
