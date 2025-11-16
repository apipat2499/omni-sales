import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { getReorderSuggestions } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const type = req.nextUrl.searchParams.get('type') || 'suggestions'; // 'suggestions' or 'points'

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    if (type === 'suggestions') {
      const suggestions = await getReorderSuggestions(userId);
      return NextResponse.json(suggestions);
    }

    if (type === 'points') {
      const { data: reorderPoints, error } = await supabase
        .from('reorder_points')
        .select(
          `
          *,
          products (
            id,
            name,
            sku,
            cost
          ),
          inventory (
            quantity_on_hand,
            quantity_available
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch reorder points' },
          { status: 500 }
        );
      }

      return NextResponse.json(reorderPoints || []);
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching reorder data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reorder data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      productId,
      minStock,
      maxStock,
      reorderQuantity,
      autoReorder,
      isActive,
    } = await req.json();

    if (!userId || !productId || minStock === undefined || maxStock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: reorderPoint, error } = await supabase
      .from('reorder_points')
      .upsert({
        user_id: userId,
        product_id: productId,
        min_stock: minStock,
        max_stock: maxStock,
        reorder_quantity: reorderQuantity || maxStock - minStock,
        auto_reorder: autoReorder || false,
        is_active: isActive !== undefined ? isActive : true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save reorder point' },
        { status: 500 }
      );
    }

    return NextResponse.json(reorderPoint, { status: 201 });
  } catch (error) {
    console.error('Error saving reorder point:', error);
    return NextResponse.json(
      { error: 'Failed to save reorder point' },
      { status: 500 }
    );
  }
}
