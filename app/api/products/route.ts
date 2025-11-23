import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Product } from '@/types';
import { withRateLimit, rateLimitPresets } from '@/lib/middleware/rateLimit';
import { getCachedProducts, invalidateProductCache } from '@/lib/cache/strategies/products-cache';
import { apiRequireAuth } from '@/lib/middleware/authMiddleware';
import { validateRequestBody, validationErrorResponse } from '@/lib/api/validate-request';
import { ProductCreateSchema, type ProductCreate } from '@/lib/schemas/product';

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStock = searchParams.get('inStock') === 'true' ? true : undefined;

    // Use cached products with filters
    const cachedProducts = await getCachedProducts({
      search,
      category: category && category !== 'all' ? category : undefined,
      minPrice,
      maxPrice,
      inStock,
    });

    // Transform to Product type with Date objects
    const products: Product[] = cachedProducts.map((product) => ({
      ...product,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
    }));

    // Add cache header
    return NextResponse.json(products, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/products:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest) {
  const { user, error } = apiRequireAuth(request);
  if (error) return error;

  // Validate request body
  const validation = await validateRequestBody<ProductCreate>(request, ProductCreateSchema);
  if (!validation.success) {
    return validationErrorResponse(validation.errors || {});
  }

  const body = validation.data!;

  try {

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

    // Invalidate product cache
    await invalidateProductCache();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/products:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to route handlers
export const GET = withRateLimit(rateLimitPresets.read, handleGET);
export const POST = withRateLimit(rateLimitPresets.write, handlePOST);
