import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const warehouseId = req.nextUrl.searchParams.get('warehouseId');
    const productId = req.nextUrl.searchParams.get('productId');
    const includeProducts = req.nextUrl.searchParams.get('includeProducts') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('inventory')
      .select(
        includeProducts
          ? `
            *,
            products (
              id,
              name,
              sku,
              category,
              cost
            )
          `
          : '*'
      )
      .eq('user_id', userId);

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: inventory, error } = await query.order('product_id', {
      ascending: true,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json(inventory || []);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
