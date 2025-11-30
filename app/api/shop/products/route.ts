import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getCachedProducts } from '@/lib/cache/strategies/products-cache';

/**
 * GET /api/shop/products
 * Get all products for the shop (using real API/Database)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const inStockOnly = searchParams.get('inStockOnly') === 'true';

    // Use cached products with filters
    const products = await getCachedProducts({
      category: category && category !== 'all' ? category : undefined,
      inStock: inStockOnly ? true : undefined,
    });

    // Transform to include only necessary fields
    const shopProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      description: product.description,
      image: product.image,
    }));

    return NextResponse.json(
      {
        products: shopProducts,
        total: shopProducts.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error in GET /api/shop/products:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
