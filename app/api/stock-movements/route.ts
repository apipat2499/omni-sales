import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { StockMovement } from '@/types';

// GET - Fetch stock movements with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stock movements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stock movements', details: error.message },
        { status: 500 }
      );
    }

    const movements: StockMovement[] = (data || []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      orderId: item.order_id,
      type: item.type,
      quantity: item.quantity,
      previousStock: item.previous_stock,
      newStock: item.new_stock,
      notes: item.notes,
      createdBy: item.created_by,
      createdAt: new Date(item.created_at),
    }));

    return NextResponse.json(movements, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/stock-movements:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST - Manual stock adjustment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, type, notes } = body;

    // Validation
    if (!productId || quantity === undefined || quantity === 0) {
      return NextResponse.json(
        { error: 'Product ID and non-zero quantity are required' },
        { status: 400 }
      );
    }

    if (!type || !['adjustment', 'return', 'restock'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type is required (adjustment, return, or restock)' },
        { status: 400 }
      );
    }

    // Get current product stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const previousStock = product.stock;
    const newStock = previousStock + quantity;

    // Validate new stock is not negative
    if (newStock < 0) {
      return NextResponse.json(
        {
          error: `Cannot adjust stock. Result would be negative. Current: ${previousStock}, Adjustment: ${quantity}`
        },
        { status: 400 }
      );
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating product stock:', updateError);
      return NextResponse.json(
        { error: 'Failed to update stock', details: updateError.message },
        { status: 500 }
      );
    }

    // Record stock movement
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        type,
        quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        notes: notes || `Manual ${type} for ${product.name}`,
      })
      .select()
      .single();

    if (movementError || !movement) {
      console.error('Error recording stock movement:', movementError);
      // Rollback stock update
      await supabase
        .from('products')
        .update({ stock: previousStock })
        .eq('id', productId);
      return NextResponse.json(
        { error: 'Failed to record stock movement', details: movementError?.message },
        { status: 500 }
      );
    }

    const response: StockMovement = {
      id: movement.id,
      productId: movement.product_id,
      orderId: movement.order_id,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previous_stock,
      newStock: movement.new_stock,
      notes: movement.notes,
      createdBy: movement.created_by,
      createdAt: new Date(movement.created_at),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/stock-movements:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
