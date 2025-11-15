import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const warehouseId = req.nextUrl.searchParams.get('warehouseId');
    const status = req.nextUrl.searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('stock_counts')
      .select(
        `
        *,
        warehouse:warehouses (
          id,
          name,
          code
        ),
        stock_count_items (
          id,
          product_id,
          counted_quantity,
          system_quantity,
          variance,
          variance_percentage,
          products (
            id,
            name,
            sku
          )
        )
      `
      )
      .eq('user_id', userId);

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: counts, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stock counts' },
        { status: 500 }
      );
    }

    return NextResponse.json(counts || []);
  } catch (error) {
    console.error('Error fetching stock counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock counts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, warehouseId, items, notes } = await req.json();

    if (!userId || !warehouseId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create stock count record
    const { data: count, error: countError } = await supabase
      .from('stock_counts')
      .insert({
        user_id: userId,
        warehouse_id: warehouseId,
        notes,
        status: 'in_progress',
      })
      .select()
      .single();

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to create stock count' },
        { status: 500 }
      );
    }

    // Insert count items
    const countItems = items.map((item: any) => ({
      stock_count_id: count.id,
      product_id: item.productId,
      counted_quantity: item.countedQuantity,
    }));

    const { error: itemsError } = await supabase
      .from('stock_count_items')
      .insert(countItems);

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to add count items' },
        { status: 500 }
      );
    }

    return NextResponse.json(count, { status: 201 });
  } catch (error) {
    console.error('Error creating stock count:', error);
    return NextResponse.json(
      { error: 'Failed to create stock count' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { stockCountId, status } = await req.json();

    if (!stockCountId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get count items to process adjustments if completing
    if (status === 'completed') {
      const { data: countData } = await supabase
        .from('stock_counts')
        .select(
          `
          id,
          user_id,
          warehouse_id,
          stock_count_items (
            id,
            product_id,
            counted_quantity,
            system_quantity
          )
        `
        )
        .eq('id', stockCountId)
        .single();

      if (countData && countData.stock_count_items) {
        // Process each item variance as adjustment
        for (const item of countData.stock_count_items) {
          const variance = item.counted_quantity - (item.system_quantity || 0);

          if (variance !== 0) {
            await supabase.from('stock_movements').insert({
              user_id: countData.user_id,
              product_id: item.product_id,
              warehouse_id: countData.warehouse_id,
              movement_type: 'stocktake',
              quantity_change: variance,
              reason: 'Stock count variance',
              reference_type: 'stock_count',
              reference_id: stockCountId,
            });
          }
        }
      }
    }

    // Update status
    const { data: updated, error } = await supabase
      .from('stock_counts')
      .update({ status })
      .eq('id', stockCountId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update stock count' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating stock count:', error);
    return NextResponse.json(
      { error: 'Failed to update stock count' },
      { status: 500 }
    );
  }
}
