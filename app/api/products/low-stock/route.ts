import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Product } from '@/types';

// GET - Fetch products with low stock
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = parseInt(searchParams.get('threshold') || '10');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch products where stock is below threshold
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lt('stock', threshold)
      .order('stock', { ascending: true }) // Show lowest stock first
      .limit(limit);

    if (error) {
      console.error('Error fetching low stock products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch low stock products', details: error.message },
        { status: 500 }
      );
    }

    // Transform dates to Date objects
    const products: Product[] = (data || []).map((product) => ({
      ...product,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
    }));

    return NextResponse.json({
      products,
      count: products.length,
      threshold,
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/products/low-stock:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
