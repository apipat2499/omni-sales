import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { recordStockMovement } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const productId = req.nextUrl.searchParams.get('productId');
    const warehouseId = req.nextUrl.searchParams.get('warehouseId');
    const movementType = req.nextUrl.searchParams.get('movementType');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('stock_movements')
      .select(
        `
        *,
        products (
          id,
          name,
          sku
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    if (movementType) {
      query = query.eq('movement_type', movementType);
    }

    const { data: movements, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch movements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: movements || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      productId,
      warehouseId,
      movementType,
      quantityChange,
      reason,
      notes,
    } = await req.json();

    if (!userId || !productId || !movementType || quantityChange === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const movement = await recordStockMovement(userId, {
      productId,
      warehouseId,
      movementType,
      quantityChange,
      reason,
      notes,
    });

    if (!movement) {
      return NextResponse.json(
        { error: 'Failed to record movement' },
        { status: 500 }
      );
    }

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Error recording movement:', error);
    return NextResponse.json(
      { error: 'Failed to record movement' },
      { status: 500 }
    );
  }
}
