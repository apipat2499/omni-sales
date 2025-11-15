import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { transferStock } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const status = req.nextUrl.searchParams.get('status');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('stock_transfers')
      .select(
        `
        *,
        products (
          id,
          name,
          sku
        ),
        from_warehouse:warehouses!from_warehouse_id (
          id,
          name,
          code
        ),
        to_warehouse:warehouses!to_warehouse_id (
          id,
          name,
          code
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: transfers, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch transfers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: transfers || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transfers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, fromWarehouseId, toWarehouseId, quantity, notes } =
      await req.json();

    if (
      !userId ||
      !productId ||
      !fromWarehouseId ||
      !toWarehouseId ||
      quantity === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate warehouses are different
    if (fromWarehouseId === toWarehouseId) {
      return NextResponse.json(
        { error: 'Source and destination warehouses must be different' },
        { status: 400 }
      );
    }

    // Validate quantity
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      );
    }

    // Check source warehouse has sufficient inventory
    const { data: sourceInventory } = await supabase
      .from('inventory')
      .select('quantity_on_hand, quantity_reserved')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('warehouse_id', fromWarehouseId)
      .single();

    if (
      !sourceInventory ||
      (sourceInventory.quantity_on_hand || 0) -
        (sourceInventory.quantity_reserved || 0) <
        quantity
    ) {
      return NextResponse.json(
        { error: 'Insufficient inventory in source warehouse' },
        { status: 400 }
      );
    }

    // Process transfer
    const success = await transferStock(userId, {
      productId,
      fromWarehouseId,
      toWarehouseId,
      quantity,
      notes,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process transfer' },
        { status: 500 }
      );
    }

    // Fetch the created transfer record
    const { data: transfer } = await supabase
      .from('stock_transfers')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('from_warehouse_id', fromWarehouseId)
      .eq('to_warehouse_id', toWarehouseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json(
      { error: 'Failed to create transfer' },
      { status: 500 }
    );
  }
}
