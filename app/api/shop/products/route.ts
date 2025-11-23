import { NextRequest, NextResponse } from 'next/server';
import { shopProducts } from '@/lib/data/products';

/**
 * GET /api/shop/products
 * Get all products for the shop (MOCK IMPLEMENTATION)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const inStockOnly = searchParams.get('inStockOnly') === 'true';

    let filteredProducts = [...shopProducts];

    // Filter by category if provided
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    // Filter to only show in-stock products
    if (inStockOnly) {
      filteredProducts = filteredProducts.filter(p => p.stock > 0);
    }

    return NextResponse.json(
      {
        products: filteredProducts,
        total: filteredProducts.length,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in GET /api/shop/products:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
